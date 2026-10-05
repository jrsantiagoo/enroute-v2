/*
  Warnings:

  - You are about to drop the column `driver_id_` on the `trip` table. All the data in the column will be lost.
  - You are about to drop the column `route_id_` on the `trip` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "trip" DROP CONSTRAINT "trip_driver_id__fkey";

-- DropForeignKey
ALTER TABLE "trip" DROP CONSTRAINT "trip_route_id__fkey";

-- DropIndex
DROP INDEX "trip_driver_id__idx";

-- DropIndex
DROP INDEX "trip_route_id__idx";

-- AlterTable
ALTER TABLE "trip" DROP COLUMN "driver_id_",
DROP COLUMN "route_id_",
ADD COLUMN     "weekly_assignment_id_" UUID;

-- CreateTable
CREATE TABLE "weekly_assignment" (
    "id_" UUID NOT NULL DEFAULT gen_random_uuid(),
    "day_of_week" INTEGER NOT NULL,
    "route_id_" UUID NOT NULL,
    "driver_id_" UUID NOT NULL,

    CONSTRAINT "weekly_assignment_pkey" PRIMARY KEY ("id_")
);

-- CreateTable
CREATE TABLE "order" (
    "id_" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "destination" TEXT,
    "ordered_on" TIMESTAMPTZ(6) NOT NULL,
    "delivered_by" TIMESTAMPTZ(6),
    "package_content" TEXT,
    "package_size" TEXT,
    "package_weight" DOUBLE PRECISION,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "trip_id_" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id_")
);

-- CreateTable
CREATE TABLE "fuel_log" (
    "id_" UUID NOT NULL DEFAULT gen_random_uuid(),
    "log_date" TIMESTAMPTZ(6),
    "odometer_reading" DOUBLE PRECISION NOT NULL,
    "liters_added" DOUBLE PRECISION NOT NULL,
    "price_per_liter" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "receipt_url" TEXT,
    "notes" TEXT,
    "distance_traveled" DOUBLE PRECISION NOT NULL,
    "fuel_efficiency" DOUBLE PRECISION NOT NULL,
    "cost_per_km" DOUBLE PRECISION NOT NULL,
    "variance_percentage" DOUBLE PRECISION NOT NULL,
    "needs_attention" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "driver_id_" UUID,

    CONSTRAINT "fuel_log_pkey" PRIMARY KEY ("id_")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_assignment_route_id__driver_id__day_of_week_key" ON "weekly_assignment"("route_id_", "driver_id_", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "order_order_id_key" ON "order"("order_id");

-- CreateIndex
CREATE INDEX "order_trip_id__idx" ON "order"("trip_id_");

-- CreateIndex
CREATE INDEX "fuel_log_created_at_updated_at_idx" ON "fuel_log"("created_at", "updated_at");

-- CreateIndex
CREATE INDEX "trip_weekly_assignment_id__idx" ON "trip"("weekly_assignment_id_");

-- AddForeignKey
ALTER TABLE "weekly_assignment" ADD CONSTRAINT "weekly_assignment_route_id__fkey" FOREIGN KEY ("route_id_") REFERENCES "route"("id_") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_assignment" ADD CONSTRAINT "weekly_assignment_driver_id__fkey" FOREIGN KEY ("driver_id_") REFERENCES "agent_profile"("id_") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_weekly_assignment_id__fkey" FOREIGN KEY ("weekly_assignment_id_") REFERENCES "weekly_assignment"("id_") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_trip_id__fkey" FOREIGN KEY ("trip_id_") REFERENCES "trip"("id_") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_log" ADD CONSTRAINT "fuel_log_driver_id__fkey" FOREIGN KEY ("driver_id_") REFERENCES "agent_profile"("id_") ON DELETE SET NULL ON UPDATE CASCADE;
