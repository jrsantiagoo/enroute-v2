import numpy as np
import pandas as pd
import pytest

import monitor
from features import FEATURES, build_frame, philippine_holiday_dates
from train import build_model


def synthetic_trips(days, late_weekday=4, seed=0):
    rng = np.random.default_rng(seed)
    rows = []
    start = pd.Timestamp("2026-01-01")
    for i in range(days):
        d = start + pd.Timedelta(days=i)
        rainy = i % 4 == 0
        late = (d.dayofweek == late_weekday and rng.random() < 0.8) or (rainy and rng.random() < 0.4)
        stops = 15
        pace = (30 if rainy else 24) + rng.normal(0, 1.5)
        rows.append(
            dict(
                trip_id=str(i),
                date=d.date().isoformat(),
                dow=(d.dayofweek + 1) % 7,
                depart_hour=8.3,
                stops=stops,
                duration_min=pace * stops,
                late=bool(late),
                precip_mm=18.0 if rainy else 1.0,
            )
        )
    return pd.DataFrame(rows)


def test_holiday_calendar_matches_the_javascript_one():
    # Same expectations as the holiday test in units.test.js for 2026.
    days = {d.isoformat() for d in philippine_holiday_dates(2026)}
    assert {"2026-04-02", "2026-04-03", "2026-04-04", "2026-08-31", "2026-11-01", "2026-12-25"} <= days


def test_model_is_usable_with_enough_signal_and_rejected_with_too_little_history():
    X, pace, late, _ = build_frame(synthetic_trips(200), pd.DataFrame(columns=["date"]))
    assert list(X.columns) == FEATURES
    assert build_model(X, pace, "pace", None)["usable"]
    assert build_model(X, late, "late", None)["usable"]

    X, pace, late, _ = build_frame(synthetic_trips(40), pd.DataFrame(columns=["date"]))
    small = build_model(X, pace, "pace", None)
    assert not small["usable"] and "only 40 trips" in small["reason"]


def test_pure_noise_is_not_marked_usable():
    trips = synthetic_trips(200)
    rng = np.random.default_rng(1)
    trips["late"] = rng.random(len(trips)) < 0.3
    trips["duration_min"] = rng.normal(400, 40, len(trips))
    X, pace, late, _ = build_frame(trips, pd.DataFrame(columns=["date"]))
    assert not build_model(X, late, "late", None)["usable"]
    assert not build_model(X, pace, "pace", None)["usable"]


def test_late_brier_against_the_base_rate():
    # One day, 10 trips, 3 late. Predicting 0.3 for each trip: 3*0.49 + 7*0.09 = 2.1 over 10 trips.
    stats = monitor.late_stats([(0.3, 0.3, 10)], base_rate=0.5)
    assert stats["error"] == pytest.approx(0.21)
    assert stats["baseline"] == pytest.approx(0.25)
    assert stats["bins"][0]["observed"] == pytest.approx(0.3)


def test_pace_error_is_weighted_by_trips():
    stats = monitor.pace_stats([(30, 28, 10), (30, 34, 30)], baseline_pace=25)
    assert stats["error"] == pytest.approx((2 * 10 + 4 * 30) / 40)
    assert stats["baseline"] == pytest.approx((3 * 10 + 9 * 30) / 40)


def test_judge_waits_for_enough_days_then_compares_with_the_baseline():
    few = {"error": 9, "baseline": 1, "days": 5, "trips": 100}
    assert monitor.judge(few) == "waiting"
    assert monitor.judge(None) == "waiting"
    assert monitor.judge({"error": 0.1, "baseline": 0.2, "days": 20, "trips": 100}) == "healthy"
    assert monitor.judge({"error": 0.3, "baseline": 0.2, "days": 20, "trips": 100}) == "degraded"
