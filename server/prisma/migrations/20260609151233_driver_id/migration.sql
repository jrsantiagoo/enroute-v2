/*
  Warnings:

  - A unique constraint covering the columns `[driver_id]` on the table `agent_profile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `driver_id` to the `agent_profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "agent_profile" ADD COLUMN     "driver_id" VARCHAR(100) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "agent_profile_driver_id_key" ON "agent_profile"("driver_id");
