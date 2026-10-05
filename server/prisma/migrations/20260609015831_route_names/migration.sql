/*
  Warnings:

  - You are about to drop the column `routeName` on the `route` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `stop` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `stop` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `route` will be added. If there are existing duplicate values, this will fail.
  - The required column `name` was added to the `route` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `lat` to the `stop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lng` to the `stop` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "route_routeName_key";

-- AlterTable
ALTER TABLE "route" DROP COLUMN "routeName",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "stop" DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "lat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "lng" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "route_name_key" ON "route"("name");
