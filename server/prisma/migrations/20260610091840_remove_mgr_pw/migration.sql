/*
  Warnings:

  - You are about to drop the column `passwordHash` on the `manager` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "manager" DROP COLUMN "passwordHash";
