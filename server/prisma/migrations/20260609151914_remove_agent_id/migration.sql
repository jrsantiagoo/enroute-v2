/*
  Warnings:

  - You are about to drop the column `agent_id_` on the `agent_profile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "agent_profile_agent_id__key";

-- AlterTable
ALTER TABLE "agent_profile" DROP COLUMN "agent_id_";
