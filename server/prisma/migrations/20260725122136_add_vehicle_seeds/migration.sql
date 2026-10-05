/*
  Warnings:

  - You are about to drop the column `make_id_` on the `vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `model_id_` on the `vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `tenant_id_` on the `vehicle` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "vehicle_created_at_updated_at_driver_id__make_id__model_id__idx";

-- AlterTable
ALTER TABLE "vehicle" DROP COLUMN "make_id_",
DROP COLUMN "model_id_",
DROP COLUMN "tenant_id_";

-- CreateIndex
CREATE INDEX "vehicle_created_at_updated_at_driver_id__idx" ON "vehicle"("created_at", "updated_at", "driver_id_");
