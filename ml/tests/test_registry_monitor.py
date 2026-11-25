"""Integration tests for the registry and monitor against a real Postgres.

Set TEST_DATABASE_URL to run them. They work in a throwaway schema and drop it afterwards.
"""

import os
import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import pytest

psycopg = pytest.importorskip("psycopg")
URL = os.environ.get("TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(not URL, reason="TEST_DATABASE_URL not set")

import monitor
import registry

SQL = (Path(__file__).parent.parent / "sql" / "mlops-tables.sql").read_text()
APP_TABLES = """
CREATE TABLE route (id_ uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE stop (id_ text PRIMARY KEY DEFAULT gen_random_uuid()::text, route_id_ uuid);
CREATE TABLE "order" (id_ uuid PRIMARY KEY DEFAULT gen_random_uuid(), trip_id_ uuid);
CREATE TABLE trip (id_ uuid PRIMARY KEY DEFAULT gen_random_uuid(), status text, deleted_at timestamptz,
    departed_at timestamptz, completed_at timestamptz, route_id_ uuid);
"""


@pytest.fixture()
def conn():
    c = psycopg.connect(URL, autocommit=True)
    c.execute("DROP SCHEMA IF EXISTS mlops_test CASCADE")
    c.execute("CREATE SCHEMA mlops_test")
    c.execute("SET search_path TO mlops_test")
    c.execute(APP_TABLES)
    c.execute(SQL)
    yield c
    c.execute("DROP SCHEMA mlops_test CASCADE")
    c.close()


def make_model(version, late_usable=True, pace_usable=True):
    part = lambda usable: {
        "usable": usable,
        "reason": None if usable else "test",
        "metrics": {"error": 1.0, "baselineError": 2.0},
        "intercept": 25.0,
        "baseRate": 0.2,
    }
    return {
        "trainedAt": version,
        "trainedOn": {"trips": 100, "from": "2026-01-01", "to": "2026-06-01"},
        "pace": part(pace_usable),
        "late": part(late_usable),
    }


def test_register_promote_and_rollback(conn):
    v1, v2, v3 = (f"2026-0{i}-01T00:00:00+00:00" for i in (1, 2, 3))
    assert registry.register(conn, make_model(v1)) == "candidate"
    assert registry.register(conn, make_model(v3, False, False)) == "rejected"
    assert registry.get_active(conn) is None
    assert registry.latest_candidate(conn) == v1

    # A rejected model cannot be promoted without --force.
    with pytest.raises(ValueError, match="rejected"):
        registry.promote(conn, v3)
    with pytest.raises(ValueError, match="No registered model"):
        registry.promote(conn, "nope")

    assert registry.promote(conn, v1) is None
    assert registry.get_active(conn)["version"] == v1

    registry.register(conn, make_model(v2))
    assert registry.promote(conn, v2) == v1
    assert registry.get_active(conn)["version"] == v2
    statuses = dict(conn.execute('SELECT version, status FROM "ModelRun"').fetchall())
    assert statuses == {v1: "retired", v2: "active", v3: "rejected"}

    assert registry.rollback(conn) == (v2, v1)
    assert registry.get_active(conn)["version"] == v1
    with pytest.raises(ValueError, match="earlier model"):
        registry.rollback(conn)
    assert dict(conn.execute('SELECT version, status FROM "ModelRun"').fetchall())[v2] == "rolled_back"


def add_trip(conn, day, late, stops=10, minutes_per_stop=25):
    route = conn.execute("INSERT INTO route DEFAULT VALUES RETURNING id_").fetchone()[0]
    for _ in range(stops):
        conn.execute("INSERT INTO stop (route_id_) VALUES (%s)", (route,))
    start = datetime.combine(day, datetime.min.time(), tzinfo=timezone(timedelta(hours=8))) + timedelta(hours=8)
    end = (
        datetime.combine(day, datetime.min.time(), tzinfo=timezone(timedelta(hours=8))) + timedelta(hours=18, minutes=30)
        if late
        else start + timedelta(minutes=stops * minutes_per_stop)
    )
    conn.execute(
        "INSERT INTO trip (status, departed_at, completed_at, route_id_) VALUES ('COMPLETED', %s, %s, %s)",
        (start, end, route),
    )


def log(conn, kind, day, version, predicted):
    conn.execute(
        'INSERT INTO "PredictionLog" (kind, target_date, model_version, predicted) VALUES (%s, %s, %s, %s)',
        (kind, day, version, predicted),
    )


def test_monitor_resolves_predictions_and_disables_a_part_worse_than_the_baseline(conn):
    version = "2026-01-01T00:00:00+00:00"
    registry.register(conn, make_model(version))
    registry.promote(conn, version)

    today = date(2026, 11, 20)
    for i in range(1, 21):
        day = today - timedelta(days=i)
        late = i % 5 == 0
        for _ in range(2):
            add_trip(conn, day, late)
        # The late model is confidently wrong (always 95%); the pace model is right on the money.
        log(conn, "late", day, version, 0.95)
        log(conn, "pace", day, version, 28.0 if late else 25.0)

    assert monitor.resolve(conn, today) == 40
    row = conn.execute(
        """SELECT actual, sample_size FROM "PredictionLog" WHERE kind = 'late' AND target_date = %s""",
        (today - timedelta(days=5),),
    ).fetchone()
    assert row == (1.0, 2)
    # A day without trips stays unresolved, and resolving again changes nothing.
    log(conn, "late", today - timedelta(days=30), version, 0.5)
    assert monitor.resolve(conn, today) == 0

    since = today - timedelta(days=60)
    late = monitor.late_stats(monitor.fetch_rows(conn, version, "late", since), 0.2)
    assert monitor.judge(late) == "degraded"
    pace = monitor.pace_stats(monitor.fetch_rows(conn, version, "pace", since), 25.0)
    assert pace["days"] == 20

    registry.disable_part(conn, version, "late", "test")
    artifact = registry.get_active(conn)["artifact"]
    assert artifact["late"]["usable"] is False
    assert artifact["pace"]["usable"] is True
    assert conn.execute('SELECT late_usable, pace_usable FROM "ModelRun"').fetchone() == (False, True)
