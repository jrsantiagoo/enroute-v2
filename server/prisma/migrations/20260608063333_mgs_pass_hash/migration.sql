/*
  Warnings:

  - You are about to drop the column `phone` on the `manager` table. All the data in the column will be lost.
  - Added the required column `passwordHash` to the `manager` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "manager" DROP COLUMN "phone",
ADD COLUMN     "passwordHash" TEXT NOT NULL;
