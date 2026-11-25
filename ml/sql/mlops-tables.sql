-- Tables for the model registry and prediction monitoring.
-- Run once in the Supabase SQL editor, or add the matching models from schema.mlops.additions.prisma and migrate.
-- The server connects directly, so RLS is enabled with no policies, like the other smart-notification tables.

-- One row per training run: the registry (which model is live) and the experiment log (how each run scored).
-- status: candidate, active, retired, rolled_back or rejected (see registry.py).
CREATE TABLE IF NOT EXISTS "ModelRun" (
    id_           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    version       TEXT NOT NULL UNIQUE,
    trained_at    TIMESTAMP(3) NOT NULL,
    status        TEXT NOT NULL,
    trips         INTEGER NOT NULL,
    date_from     DATE NOT NULL,
    date_to       DATE NOT NULL,
    pace_usable   BOOLEAN NOT NULL,
    late_usable   BOOLEAN NOT NULL,
    pace_error    DOUBLE PRECISION,
    pace_baseline DOUBLE PRECISION,
    late_error    DOUBLE PRECISION,
    late_baseline DOUBLE PRECISION,
    reason        TEXT,
    artifact      JSONB NOT NULL,
    promoted_at   TIMESTAMP(3),
    created_at    TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "ModelRun_status_idx" ON "ModelRun" (status);

-- Every prediction the server makes for a day, filled in with what actually happened once the day is over.
-- kind "late": predicted = chance a trip finishes after 6 PM, actual = share of that day's trips that did.
-- kind "pace": predicted = minutes per stop, actual = average minutes per stop that day.
CREATE TABLE IF NOT EXISTS "PredictionLog" (
    id_           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    kind          TEXT NOT NULL,
    target_date   DATE NOT NULL,
    model_version TEXT NOT NULL,
    predicted     DOUBLE PRECISION NOT NULL,
    actual        DOUBLE PRECISION,
    sample_size   INTEGER,
    resolved_at   TIMESTAMP(3),
    created_at    TIMESTAMP(3) NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP(3) NOT NULL DEFAULT now(),
    UNIQUE (kind, target_date, model_version)
);
CREATE INDEX IF NOT EXISTS "PredictionLog_target_date_idx" ON "PredictionLog" (target_date);

ALTER TABLE "ModelRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PredictionLog" ENABLE ROW LEVEL SECURITY;
