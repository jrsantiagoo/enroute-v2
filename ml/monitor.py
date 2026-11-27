"""Checks the live models against what actually happened.

    python monitor.py --db-url "$DIRECT_URL" [--auto-disable] [--report-file report.md]

1. Resolves past PredictionLog rows: fills in the real late rate and pace for each finished day from completed trips.
2. Scores the active model on the last --window days, against the plain average it has to beat.
3. With --auto-disable, switches off any part that is worse than the plain average, so the cards fall back to statistics.

Exit codes: 0 healthy or not enough data yet, 2 a part is degraded (use it to open an issue in CI).
"""

import argparse
import sys
from datetime import date, timedelta

import registry

MIN_DAYS = 14
MIN_TRIPS = 30
BINS = [(0.0, 0.2), (0.2, 0.4), (0.4, 0.6), (0.6, 0.8), (0.8, 1.0001)]

# Actuals use the same trip filter as training-data.sql, grouped by the Manila day the trip departed.
ACTUALS_SQL = """
SELECT
    (t.departed_at AT TIME ZONE 'Asia/Manila')::date AS day,
    count(*)::int AS trips,
    avg(CASE WHEN (t.completed_at AT TIME ZONE 'Asia/Manila')
        > ((t.departed_at AT TIME ZONE 'Asia/Manila')::date + time '18:00') THEN 1.0 ELSE 0.0 END) AS late_rate,
    avg(EXTRACT(epoch FROM (t.completed_at - t.departed_at)) / 60.0
        / COALESCE(NULLIF(oc.n, 0), sc.n)) AS pace
FROM trip t
LEFT JOIN LATERAL (SELECT count(*)::int AS n FROM "order" o WHERE o.trip_id_ = t.id_) oc ON true
LEFT JOIN LATERAL (SELECT count(*)::int AS n FROM stop s WHERE s.route_id_ = t.route_id_) sc ON true
WHERE t.status = 'COMPLETED' AND t.deleted_at IS NULL
  AND t.departed_at IS NOT NULL AND t.completed_at IS NOT NULL AND t.completed_at > t.departed_at
  AND COALESCE(NULLIF(oc.n, 0), sc.n, 0) > 0
  AND (t.departed_at AT TIME ZONE 'Asia/Manila')::date = ANY(%s)
GROUP BY 1
"""


def resolve(conn, today):
    """Fills in actual results for predictions about days that are over. Returns how many rows were resolved."""
    pending = conn.execute(
        'SELECT DISTINCT target_date FROM "PredictionLog" WHERE resolved_at IS NULL AND target_date < %s',
        (today,),
    ).fetchall()
    days = [row[0] for row in pending]
    if not days:
        return 0

    resolved = 0
    with conn.transaction():
        for day, trips, late_rate, pace in conn.execute(ACTUALS_SQL, (days,)).fetchall():
            for kind, actual in (("late", late_rate), ("pace", pace)):
                cur = conn.execute(
                    """UPDATE "PredictionLog"
                       SET actual = %s, sample_size = %s, resolved_at = now(), updated_at = now()
                       WHERE kind = %s AND target_date = %s AND resolved_at IS NULL""",
                    (float(actual), trips, kind, day),
                )
                resolved += cur.rowcount
    return resolved


def late_stats(rows, base_rate):
    """Per-trip Brier score of the model against always guessing the base rate. rows: (predicted, actual rate, trips)."""

    def brier(p, rate, n):
        late = round(rate * n)
        return late * (1 - p) ** 2 + (n - late) * p**2

    trips = sum(n for _, _, n in rows)
    if trips == 0:
        return None
    model = sum(brier(p, a, n) for p, a, n in rows) / trips
    baseline = sum(brier(base_rate, a, n) for _, a, n in rows) / trips
    bins = []
    for low, high in BINS:
        inside = [(p, a, n) for p, a, n in rows if low <= p < high]
        weight = sum(n for _, _, n in inside)
        if weight:
            bins.append(
                {
                    "range": f"{int(low * 100)}-{min(100, int(high * 100))}%",
                    "predicted": sum(p * n for p, _, n in inside) / weight,
                    "observed": sum(a * n for _, a, n in inside) / weight,
                    "trips": weight,
                }
            )
    return {"error": model, "baseline": baseline, "trips": trips, "days": len(rows), "bins": bins}


def pace_stats(rows, baseline_pace):
    """Mean absolute error in minutes per stop against always guessing the training average. rows: (predicted, actual, trips)."""
    trips = sum(n for _, _, n in rows)
    if trips == 0:
        return None
    model = sum(abs(p - a) * n for p, a, n in rows) / trips
    baseline = sum(abs(baseline_pace - a) * n for _, a, n in rows) / trips
    return {"error": model, "baseline": baseline, "trips": trips, "days": len(rows)}


def judge(stats):
    """healthy, degraded or waiting (not enough resolved days yet)."""
    if stats is None or stats["days"] < MIN_DAYS or stats["trips"] < MIN_TRIPS:
        return "waiting"
    return "degraded" if stats["error"] > stats["baseline"] else "healthy"


def fetch_rows(conn, version, kind, since):
    return [
        (r[0], r[1], r[2])
        for r in conn.execute(
            """SELECT predicted, actual, sample_size FROM "PredictionLog"
               WHERE model_version = %s AND kind = %s AND resolved_at IS NOT NULL
                 AND target_date >= %s AND sample_size > 0""",
            (version, kind, since),
        ).fetchall()
    ]


def build_report(version, results):
    lines = [f"# Smart notification model check", "", f"Active model: `{version}`", ""]
    unit = {"late": "Brier score (lower is better)", "pace": "mean miss, minutes per stop"}
    for kind in ("late", "pace"):
        status, stats = results[kind]
        lines.append(f"## {kind} model: {status}")
        if stats is None:
            lines += ["No resolved predictions yet.", ""]
            continue
        lines.append(
            f"- {stats['days']} days, {stats['trips']} trips. {unit[kind]}: "
            f"model {stats['error']:.3f}, plain average {stats['baseline']:.3f}."
        )
        if status == "waiting":
            lines.append(f"- Waiting for at least {MIN_DAYS} days and {MIN_TRIPS} trips before judging.")
        for b in stats.get("bins", []):
            lines.append(
                f"- Predicted {b['range']}: said {b['predicted']:.0%}, observed {b['observed']:.0%} ({b['trips']} trips)"
            )
        lines.append("")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db-url", required=True)
    parser.add_argument("--window", type=int, default=60, help="Days of resolved predictions to score.")
    parser.add_argument("--auto-disable", action="store_true")
    parser.add_argument("--report-file")
    args = parser.parse_args()

    conn = registry.connect(args.db_url)
    today = conn.execute("SELECT (now() AT TIME ZONE 'Asia/Manila')::date").fetchone()[0]
    print(f"Resolved {resolve(conn, today)} predictions.")

    active = registry.get_active(conn)
    if active is None:
        print("No active model in the registry, nothing to check.")
        return
    model, version = active["artifact"], active["version"]
    since = today - timedelta(days=args.window)

    results = {}
    if model["late"]["usable"]:
        stats = late_stats(fetch_rows(conn, version, "late", since), model["late"]["baseRate"])
        results["late"] = (judge(stats), stats)
    else:
        results["late"] = ("not in use", None)
    if model["pace"]["usable"]:
        # For a ridge model on standardised inputs the intercept is the training mean pace.
        stats = pace_stats(fetch_rows(conn, version, "pace", since), model["pace"]["intercept"])
        results["pace"] = (judge(stats), stats)
    else:
        results["pace"] = ("not in use", None)

    report = build_report(version, results)
    print(report)
    if args.report_file:
        open(args.report_file, "w").write(report)

    degraded = [kind for kind, (status, _) in results.items() if status == "degraded"]
    if degraded and args.auto_disable:
        for kind in degraded:
            reason = f"switched off by monitor on {today}: worse than the plain average on recent days"
            registry.disable_part(conn, version, kind, reason)
            print(f"Disabled the {kind} model.")
    sys.exit(2 if degraded else 0)


if __name__ == "__main__":
    main()
