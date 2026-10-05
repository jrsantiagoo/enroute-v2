-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "vehicles";

-- AlterTable
ALTER TABLE "fuel_log" ADD COLUMN     "vehicle_id_" UUID;

-- AlterTable
ALTER TABLE "trip" ADD COLUMN     "vehicle_id_" UUID;

-- CreateTable
CREATE TABLE "vehicles"."vehicle" (
    "id_" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "plate_number" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "initial_odometer" INTEGER NOT NULL,
    "last_odometer" DOUBLE PRECISION,
    "expected_kml" INTEGER NOT NULL,
    "conduction_sticker" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "reg_certification" TEXT,
    "or_number" TEXT,
    "registration_expiry" TIMESTAMPTZ(6),
    "insurance_expiry" TIMESTAMPTZ(6),
    "driver_id_" UUID,
    "tenant_id_" UUID NOT NULL,
    "make_id_" UUID NOT NULL,
    "model_id_" UUID NOT NULL,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id_")
);

-- CreateIndex
CREATE INDEX "vehicle_created_at_updated_at_driver_id__make_id__model_id__idx" ON "vehicles"."vehicle"("created_at", "updated_at", "driver_id_", "make_id_", "model_id_", "tenant_id_");

-- AddForeignKey
ALTER TABLE "vehicles"."vehicle" ADD CONSTRAINT "vehicle_driver_id__fkey" FOREIGN KEY ("driver_id_") REFERENCES "agent_profile"("id_") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_vehicle_id__fkey" FOREIGN KEY ("vehicle_id_") REFERENCES "vehicles"."vehicle"("id_") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_log" ADD CONSTRAINT "fuel_log_vehicle_id__fkey" FOREIGN KEY ("vehicle_id_") REFERENCES "vehicles"."vehicle"("id_") ON DELETE SET NULL ON UPDATE CASCADE;
