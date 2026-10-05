/*
  Warnings:

  - You are about to drop the column `name` on the `route` table. All the data in the column will be lost.
  - You are about to drop the column `routeId` on the `route` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[routeName]` on the table `route` will be added. If there are existing duplicate values, this will fail.
  - The required column `routeName` was added to the `route` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `totalDistanceKm` to the `route` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalDurationMin` to the `route` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "route_routeId_key";

-- DropIndex
DROP INDEX "stop_route_id__key";

-- AlterTable
ALTER TABLE "route" DROP COLUMN "name",
DROP COLUMN "routeId",
ADD COLUMN     "routeName" TEXT NOT NULL,
ADD COLUMN     "totalDistanceKm" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalDurationMin" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "stop" ALTER COLUMN "address" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "route_routeName_key" ON "route"("routeName");
