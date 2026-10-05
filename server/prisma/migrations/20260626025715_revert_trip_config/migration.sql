/*
  Warnings:

  - You are about to drop the column `weekly_assignment_id_` on the `trip` table. All the data in the column will be lost.
  - You are about to drop the `weekly_assignment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `route_id_` to the `trip` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "trip" DROP CONSTRAINT "trip_weekly_assignment_id__fkey";

-- DropForeignKey
ALTER TABLE "weekly_assignment" DROP CONSTRAINT "weekly_assignment_driver_id__fkey";

-- DropForeignKey
ALTER TABLE "weekly_assignment" DROP CONSTRAINT "weekly_assignment_route_id__fkey";

-- DropIndex
DROP INDEX "trip_weekly_assignment_id__idx";

-- AlterTable
ALTER TABLE "trip" DROP COLUMN "weekly_assignment_id_",
ADD COLUMN     "driver_id_" UUID,
ADD COLUMN     "route_id_" UUID NOT NULL;

-- DropTable
DROP TABLE "weekly_assignment";

-- CreateIndex
CREATE INDEX "trip_driver_id__idx" ON "trip"("driver_id_");

-- CreateIndex
CREATE INDEX "trip_route_id__idx" ON "trip"("route_id_");

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_driver_id__fkey" FOREIGN KEY ("driver_id_") REFERENCES "agent_profile"("id_") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_route_id__fkey" FOREIGN KEY ("route_id_") REFERENCES "route"("id_") ON DELETE RESTRICT ON UPDATE CASCADE;
