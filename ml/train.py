"""Trains the two smart notification models and writes them to model.json.

Models (both are linear on purpose, so the Express server can score them in plain JavaScript
and every prediction can be explained by its largest factors):
  - pace: Ridge regression for minutes per stop
  - late: logistic regression for the chance a trip finishes after 6 PM (Manila)

Each model is only marked usable when it beats a plain-average baseline on trips it has not
seen, so a model trained on too little or too noisy history is never shown to managers.

Usage:
    python train.py --db-url "$DIRECT_URL"                 # reads the database directly
    python train.py --trips trips.csv [--events events.csv]  # reads CSV exports instead
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import StandardScaler

from features import FEATURES, MAX_PRECIP_MM, RAINY_DAY_MM, build_frame

HERE = Path(__file__).parent
DEFAULT_OUT = (
    HERE.parent / "server/src/services/smart-notifications/model/model.json"
)

# Gates for marking a model usable.
MIN_TRIPS = 60
MIN_LATE_AND_ONTIME = 10
MIN_IMPROVEMENT = 0.05


def sigmoid(z):
    return 1 / (1 + np.exp(-z))


def cross_validate(X, y, kind):
    # Time-ordered folds: always train on the past and test on the future.
    n_splits = min(4, max(2, len(X) // 25))
    errors, baselines = [], []
    for train, test in TimeSeriesSplit(n_splits=n_splits).split(X):
        if kind == "late" and (y.iloc[train].nunique() < 2):
            continue
        scaler = StandardScaler().fit(X.iloc[train])
        Xtr, Xte = scaler.transform(X.iloc[train]), scaler.transform(X.iloc[test])
        if kind == "pace":
            model = Ridge(alpha=5.0).fit(Xtr, y.iloc[train])
            pred = model.predict(Xte)
            errors.append(float(np.mean(np.abs(pred - y.iloc[test]))))
            baselines.append(float(np.mean(np.abs(y.iloc[train].mean() - y.iloc[test]))))
        else:
            model = LogisticRegression(C=0.2, max_iter=1000).fit(Xtr, y.iloc[train])
            pred = model.predict_proba(Xte)[:, 1]
            errors.append(float(np.mean((pred - y.iloc[test]) ** 2)))
            baselines.append(float(np.mean((y.iloc[train].mean() - y.iloc[test]) ** 2)))
    if not errors:
        return None, None
    return float(np.mean(errors)), float(np.mean(baselines))


def fit_final(X, y, kind):
    scaler = StandardScaler().fit(X)
    Xs = scaler.transform(X)
    if kind == "pace":
        model = Ridge(alpha=5.0).fit(Xs, y)
        intercept, coef = float(model.intercept_), model.coef_
    else:
        model = LogisticRegression(C=0.2, max_iter=1000).fit(Xs, y)
        intercept, coef = float(model.intercept_[0]), model.coef_[0]
    return {
        "intercept": intercept,
        "coef": [float(c) for c in coef],
        "mean": [float(m) for m in scaler.mean_],
        "scale": [float(s) if s > 0 else 1.0 for s in scaler.scale_],
    }


def build_model(X, y, kind, extra_gate):
    cv_error, cv_baseline = cross_validate(X, y, kind)
    gates = []
    if len(X) < MIN_TRIPS:
        gates.append(f"only {len(X)} trips (need {MIN_TRIPS})")
    if extra_gate:
        gates.append(extra_gate)
    if cv_error is None:
        gates.append("not enough varied history to test")
    elif cv_error > cv_baseline * (1 - MIN_IMPROVEMENT):
        gates.append(
            f"did not beat the plain average on unseen trips (error {cv_error:.3f} vs {cv_baseline:.3f})"
        )
    result = {
        "usable": not gates,
        "reason": "; ".join(gates) or None,
        "metrics": {
            "error": cv_error,
            "baselineError": cv_baseline,
            "measure": "mean absolute error in minutes per stop" if kind == "pace" else "Brier score",
        },
        **fit_final(X, y, kind),
    }
    if kind == "late":
        result["baseRate"] = float(y.mean())
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db-url")
    parser.add_argument("--trips")
    parser.add_argument("--events")
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    parser.add_argument(
        "--register",
        action="store_true",
        help="Also record this run in the ModelRun table as a candidate (needs --db-url).",
    )
    args = parser.parse_args()
    if args.register and not args.db_url:
        sys.exit("--register needs --db-url.")

    if args.db_url:
        # Imported here so training from CSV files works without psycopg installed.
        import registry

        conn = registry.connect(args.db_url)
        trips, events = registry.load_training_data(conn)
    elif args.trips:
        trips = pd.read_csv(args.trips)
        events = pd.read_csv(args.events) if args.events else pd.DataFrame(columns=["date"])
    else:
        sys.exit("Pass --db-url or --trips (see the module docstring).")

    X, pace, late, dates = build_frame(trips, events)
    if len(X) == 0:
        sys.exit("No usable trips to train on.")

    late_gate = None
    if late.sum() < MIN_LATE_AND_ONTIME or (len(late) - late.sum()) < MIN_LATE_AND_ONTIME:
        late_gate = f"needs at least {MIN_LATE_AND_ONTIME} late and {MIN_LATE_AND_ONTIME} on-time trips"

    model = {
        "version": 1,
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "trainedOn": {
            "trips": int(len(X)),
            "from": dates.min().isoformat(),
            "to": dates.max().isoformat(),
        },
        "features": FEATURES,
        "defaults": {
            "stops": float(X["stops"].median()),
            "depart_hour": float(X["depart_hour"].median()),
        },
        "limits": {"maxPrecipMm": MAX_PRECIP_MM, "rainyDayMm": RAINY_DAY_MM},
        "pace": build_model(X, pace, "pace", None),
        "late": build_model(X, late, "late", late_gate),
    }

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(model, indent=2) + "\n")
    if args.register:
        status = registry.register(conn, model)
        print(f"Registered as {status}: version {model['trainedAt']}")

    for name in ("pace", "late"):
        m = model[name]
        m_ = m["metrics"]
        print(
            f"{name}: {'USABLE' if m['usable'] else 'not usable'}"
            f" | {m_['measure']}: {m_['error']} vs baseline {m_['baselineError']}"
            + (f" | {m['reason']}" if m["reason"] else "")
        )
    print(f"Wrote {out} from {len(X)} trips.")


if __name__ == "__main__":
    main()
