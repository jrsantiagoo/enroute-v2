-- CreateTable
CREATE TABLE "ModelRun" (
    "id_" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "trained_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "trips" INTEGER NOT NULL,
    "date_from" DATE NOT NULL,
    "date_to" DATE NOT NULL,
    "pace_usable" BOOLEAN NOT NULL,
    "late_usable" BOOLEAN NOT NULL,
    "pace_error" DOUBLE PRECISION,
    "pace_baseline" DOUBLE PRECISION,
    "late_error" DOUBLE PRECISION,
    "late_baseline" DOUBLE PRECISION,
    "reason" TEXT,
    "artifact" JSONB NOT NULL,
    "promoted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelRun_pkey" PRIMARY KEY ("id_")
);

-- CreateTable
CREATE TABLE "PredictionLog" (
    "id_" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "target_date" DATE NOT NULL,
    "model_version" TEXT NOT NULL,
    "predicted" DOUBLE PRECISION NOT NULL,
    "actual" DOUBLE PRECISION,
    "sample_size" INTEGER,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictionLog_pkey" PRIMARY KEY ("id_")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModelRun_version_key" ON "ModelRun"("version");

-- CreateIndex
CREATE INDEX "ModelRun_status_idx" ON "ModelRun"("status");

-- CreateIndex
CREATE INDEX "PredictionLog_target_date_idx" ON "PredictionLog"("target_date");

-- CreateIndex
CREATE UNIQUE INDEX "PredictionLog_kind_target_date_model_version_key" ON "PredictionLog"("kind", "target_date", "model_version");
