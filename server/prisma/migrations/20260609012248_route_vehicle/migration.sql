/*
  Warnings:

  - You are about to drop the column `totalDurationMin` on the `route` table. All the data in the column will be lost.
  - Added the required column `totalDurationMinutes` to the `route` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "route" DROP COLUMN "totalDurationMin",
ADD COLUMN     "totalDurationMinutes" INTEGER NOT NULL,
ADD COLUMN     "vehicleType" TEXT;
