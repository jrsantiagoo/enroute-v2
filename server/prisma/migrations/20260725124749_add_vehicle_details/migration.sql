-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('VAN', 'MOTORCYCLE', 'CAR', 'TRUCK', 'BUS', 'OTHER');

-- DropIndex
DROP INDEX "vehicle_created_at_updated_at_driver_id__idx";

-- AlterTable
ALTER TABLE "vehicle" ADD COLUMN     "make_id_" UUID,
ADD COLUMN     "model_id_" UUID,
ADD COLUMN     "target_efficiency" DOUBLE PRECISION,
ADD COLUMN     "vehicle_type" "VehicleType",
ADD COLUMN     "weight_capacity" INTEGER;

-- CreateTable
CREATE TABLE "vehicle_make" (
    "id_" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_make_pkey" PRIMARY KEY ("id_")
);

-- CreateTable
CREATE TABLE "vehicle_model" (
    "id_" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_model_pkey" PRIMARY KEY ("id_")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_make_name_key" ON "vehicle_make"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_model_name_key" ON "vehicle_model"("name");

-- CreateIndex
CREATE INDEX "vehicle_created_at_updated_at_driver_id__make_id__model_id__idx" ON "vehicle"("created_at", "updated_at", "driver_id_", "make_id_", "model_id_");

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_make_id__fkey" FOREIGN KEY ("make_id_") REFERENCES "vehicle_make"("id_") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_model_id__fkey" FOREIGN KEY ("model_id_") REFERENCES "vehicle_model"("id_") ON DELETE CASCADE ON UPDATE CASCADE;
