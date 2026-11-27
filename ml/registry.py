"""Model registry and experiment log, stored in the ModelRun table (see sql/mlops-tables.sql).

Every training run is one row, so the table doubles as experiment tracking. Statuses:
  candidate - trained and registered, not live yet
  active    - the model the server loads (at most one)
  retired   - replaced by a newer active model
  rolled_back - was active, then rolled back away from. Rolling back again never returns to it.
  rejected  - trained, but neither model passed its tests, so it can never be promoted
The server loads the newest active row and falls back to model.json when there is none.
"""

import json
from datetime import date, datetime, timezone
from pathlib import Path

import pandas as pd
import psycopg
from psycopg.types.json import Jsonb

HERE = Path(__file__).parent


def connect(db_url):
    # Autocommit, so each conn.transaction() block below is a real transaction that is committed when it ends.
    return psycopg.connect(db_url, autocommit=True)


def query_frame(conn, sql):
    cur = conn.execute(sql)
    return pd.DataFrame(cur.fetchall(), columns=[c.name for c in cur.description])


def load_training_data(conn):
    trips = query_frame(conn, (HERE / "training-data.sql").read_text())
    events = query_frame(conn, 'SELECT date::text AS date FROM "KnownEvent"')
    return trips, events


def register(conn, model):
    """Inserts a trained model. It is a candidate when at least one model is usable, otherwise rejected."""
    usable = model["pace"]["usable"] or model["late"]["usable"]
    reasons = {
        name: model[name]["reason"] for name in ("pace", "late") if model[name]["reason"]
    }
    with conn.transaction():
        conn.execute(
            """
            INSERT INTO "ModelRun" (id_, version, trained_at, status, trips, date_from, date_to,
                pace_usable, late_usable, pace_error, pace_baseline, late_error, late_baseline,
                reason, artifact)
            VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                model["trainedAt"],
                datetime.fromisoformat(model["trainedAt"]),
                "candidate" if usable else "rejected",
                model["trainedOn"]["trips"],
                date.fromisoformat(model["trainedOn"]["from"]),
                date.fromisoformat(model["trainedOn"]["to"]),
                model["pace"]["usable"],
                model["late"]["usable"],
                model["pace"]["metrics"]["error"],
                model["pace"]["metrics"]["baselineError"],
                model["late"]["metrics"]["error"],
                model["late"]["metrics"]["baselineError"],
                json.dumps(reasons) if reasons else None,
                Jsonb(model),
            ),
        )
    return "candidate" if usable else "rejected"


def get_active(conn):
    row = conn.execute(
        """SELECT version, artifact FROM "ModelRun" WHERE status = 'active'
           ORDER BY promoted_at DESC NULLS LAST LIMIT 1"""
    ).fetchone()
    return None if row is None else {"version": row[0], "artifact": row[1]}


def latest_candidate(conn):
    row = conn.execute(
        """SELECT version FROM "ModelRun" WHERE status = 'candidate'
           ORDER BY trained_at DESC LIMIT 1"""
    ).fetchone()
    return row[0] if row else None


def promote(conn, version, force=False):
    """Makes one candidate (or a retired model, for a rollback) the active model. Returns the retired version, if any."""
    with conn.transaction():
        row = conn.execute(
            'SELECT status, pace_usable, late_usable FROM "ModelRun" WHERE version = %s FOR UPDATE',
            (version,),
        ).fetchone()
        if row is None:
            raise ValueError(f"No registered model with version {version}")
        status, pace_usable, late_usable = row
        if status == "rejected" and not force:
            raise ValueError("That model was rejected (neither part passed its tests). Use --force to override.")
        if not (pace_usable or late_usable) and not force:
            raise ValueError("Neither part of that model is usable. Use --force to override.")
        previous = conn.execute(
            """UPDATE "ModelRun" SET status = 'retired'
               WHERE status = 'active' AND version <> %s RETURNING version""",
            (version,),
        ).fetchone()
        conn.execute(
            'UPDATE "ModelRun" SET status = \'active\', promoted_at = now() WHERE version = %s',
            (version,),
        )
    return previous[0] if previous else None


def rollback(conn):
    """Re-activates the model that was active before the current one."""
    with conn.transaction():
        current = conn.execute(
            """SELECT version, promoted_at FROM "ModelRun" WHERE status = 'active'
               ORDER BY promoted_at DESC NULLS LAST LIMIT 1"""
        ).fetchone()
        if current is None:
            raise ValueError("There is no active model to roll back from.")
        previous = conn.execute(
            """SELECT version FROM "ModelRun"
               WHERE status = 'retired' AND promoted_at IS NOT NULL AND promoted_at < %s
               ORDER BY promoted_at DESC LIMIT 1""",
            (current[1],),
        ).fetchone()
        if previous is None:
            raise ValueError("There is no earlier model to roll back to.")
        conn.execute('UPDATE "ModelRun" SET status = \'rolled_back\' WHERE version = %s', (current[0],))
        conn.execute(
            'UPDATE "ModelRun" SET status = \'active\', promoted_at = now() WHERE version = %s',
            (previous[0],),
        )
    return current[0], previous[0]


def disable_part(conn, version, part, reason):
    """Marks one part of a registered model as not usable. The server stops using it at its next refresh."""
    with conn.transaction():
        row = conn.execute(
            'SELECT artifact FROM "ModelRun" WHERE version = %s FOR UPDATE', (version,)
        ).fetchone()
        artifact = row[0]
        artifact[part]["usable"] = False
        artifact[part]["reason"] = reason
        conn.execute(
            f'UPDATE "ModelRun" SET artifact = %s, {part}_usable = false, reason = %s WHERE version = %s',
            (Jsonb(artifact), json.dumps({part: reason}), version),
        )
    return artifact


def list_runs(conn, limit=10):
    return conn.execute(
        """SELECT version, status, trips, pace_usable, late_usable, pace_error, pace_baseline,
                  late_error, late_baseline
           FROM "ModelRun" ORDER BY trained_at DESC LIMIT %s""",
        (limit,),
    ).fetchall()
