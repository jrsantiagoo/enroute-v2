"""Feature building shared by training and monitoring.

Keep this in step with model-scorer.js: the feature names and their order are written into model.json,
and the server builds the same values from the same names.
"""

from datetime import date, timedelta

import numpy as np
import pandas as pd

RAINY_DAY_MM = 10
MAX_PRECIP_MM = 60

FEATURES = [f"dow_{d}" for d in range(7)] + [
    "precip_mm",
    "rainy",
    "event_day",
    "stops",
    "depart_hour",
]


def easter_sunday(year):
    # Anonymous Gregorian algorithm, the same one holidays.js uses.
    a, b, c = year % 19, year // 100, year % 100
    d, e = b // 4, b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = c // 4, c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = (h + l - 7 * m + 114) % 31 + 1
    return date(year, month, day)


def philippine_holiday_dates(year):
    # Mirrors philippineHolidays() in holidays.js (fixed dates, Heroes Day, Holy Week).
    fixed = [(1, 1), (4, 9), (5, 1), (6, 12), (8, 21), (11, 1), (11, 30), (12, 8), (12, 25), (12, 30)]
    days = {date(year, m, d) for m, d in fixed}
    last = date(year, 8, 31)
    while last.weekday() != 0:  # Monday
        last -= timedelta(days=1)
    days.add(last)
    easter = easter_sunday(year)
    for back in (3, 2, 1):
        days.add(easter - timedelta(days=back))
    return days


def event_dates(years, extra_events):
    days = set()
    for year in years:
        days |= philippine_holiday_dates(year)
    days |= set(extra_events)
    return {d.isoformat() for d in days}


def build_frame(trips, events):
    df = trips.copy()
    # Postgres returns numeric columns as Decimal, which the models cannot use directly.
    for column in ("dow", "depart_hour", "stops", "duration_min", "precip_mm"):
        df[column] = pd.to_numeric(df[column])
    df = df[(df["stops"] > 0) & (df["duration_min"] > 0)].copy()
    df["date"] = pd.to_datetime(df["date"]).dt.date
    years = {d.year for d in df["date"]}
    extra = (
        set(pd.to_datetime(events["date"]).dt.date) if len(events) else set()
    )
    events_by_day = event_dates(years, extra)

    # Trips with no rainfall record are skipped for the precipitation features, like the engine does.
    df = df[df["precip_mm"].notna()].copy()
    out = pd.DataFrame(index=df.index)
    for d in range(7):
        out[f"dow_{d}"] = (df["dow"] == d).astype(float)
    out["precip_mm"] = df["precip_mm"].clip(upper=MAX_PRECIP_MM)
    out["rainy"] = (df["precip_mm"] >= RAINY_DAY_MM).astype(float)
    out["event_day"] = df["date"].map(lambda d: d.isoformat() in events_by_day).astype(float)
    out["stops"] = df["stops"].astype(float)
    out["depart_hour"] = df["depart_hour"].astype(float)
    out = out[FEATURES]
    pace = df["duration_min"] / df["stops"]
    late = df["late"].astype(int)
    order = np.argsort(df["date"].map(lambda d: d.toordinal()).to_numpy(), kind="stable")
    return (
        out.iloc[order].reset_index(drop=True),
        pace.iloc[order].reset_index(drop=True),
        late.iloc[order].reset_index(drop=True),
        df["date"].iloc[order].reset_index(drop=True),
    )
