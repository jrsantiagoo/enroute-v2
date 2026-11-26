"""Fills PredictionLog with 45 days of past predictions (the demo seed has about one trip a day, and the monitor needs 30 trips) so the monitor has something to judge, for demos only.

The real monitor needs about two weeks of live predictions before it says anything. For a presentation you can
not wait that long, so this script writes predictions for the last N days as if the server had been logging them.

    python demo/backfill-predictions.py --db-url "$DIRECT_URL" --scenario healthy
    python monitor.py --db-url "$DIRECT_URL"                       # reports "healthy"

    python demo/backfill-predictions.py --db-url "$DIRECT_URL" --scenario degraded
    python monitor.py --db-url "$DIRECT_URL" --auto-disable        # switches the late model off, exit code 2

Both scenarios REPLACE every PredictionLog row of the active model version. Say in your slides that this data is simulated.
healthy:  the active model's own predictions (note: on demo data they are scored on days it was trained on).
degraded: the late model confidently predicts 97% every day, which is wrong, so the monitor must switch it off.
"""

import argparse
import math
import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import registry
from features import FEATURES, MAX_PRECIP_MM, RAINY_DAY_MM, event_dates


def raw_score(part, values):
    return part["intercept"] + sum(
        c * (v - m) / s for c, v, m, s in zip(part["coef"], values, part["mean"], part["scale"])
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db-url", required=True)
    parser.add_argument("--scenario", choices=["healthy", "degraded"], required=True)
    parser.add_argument("--days", type=int, default=45)
    args = parser.parse_args()

    conn = registry.connect(args.db_url)
    active = registry.get_active(conn)
    if active is None:
        sys.exit("There is no active model. Run train.py --register, then promote.py --latest first.")
    version, model = active["version"], active["artifact"]

    today = conn.execute("SELECT (now() AT TIME ZONE 'Asia/Manila')::date").fetchone()[0]
    first = today - timedelta(days=args.days)
    rain = dict(conn.execute('SELECT date, precip_mm FROM "DailyWeather" WHERE date >= %s', (first,)).fetchall())
    extra = [r[0] for r in conn.execute('SELECT date FROM "KnownEvent"').fetchall()]
    events = event_dates({first.year, today.year}, extra)

    rows = []
    for i in range(1, args.days + 1):
        day = today - timedelta(days=i)
        precip = rain.get(day)
        if precip is None:
            continue
        capped = min(float(precip), MAX_PRECIP_MM)
        weekday = (day.weekday() + 1) % 7  # Sunday is 0, as in the SQL and in JavaScript
        values = {f"dow_{d}": float(d == weekday) for d in range(7)}
        values.update(
            precip_mm=capped,
            rainy=float(capped >= RAINY_DAY_MM),
            event_day=float(day.isoformat() in events),
            stops=model["defaults"]["stops"],
            depart_hour=model["defaults"]["depart_hour"],
        )
        vector = [values[name] for name in FEATURES]
        late = 0.97 if args.scenario == "degraded" else 1 / (1 + math.exp(-raw_score(model["late"], vector)))
        rows.append(("late", day, version, late))
        rows.append(("pace", day, version, max(5.0, raw_score(model["pace"], vector))))

    with conn.transaction():
        conn.execute('DELETE FROM "PredictionLog" WHERE model_version = %s', (version,))
        with conn.cursor() as cur:
            cur.executemany(
                '''INSERT INTO "PredictionLog" (id_, kind, target_date, model_version, predicted, updated_at)
                   VALUES (gen_random_uuid()::text, %s, %s, %s, %s, now())''',
                rows,
            )
    print(f"Wrote {len(rows)} simulated predictions for {len(rows) // 2} days ({args.scenario}) for model {version}.")


if __name__ == "__main__":
    main()
