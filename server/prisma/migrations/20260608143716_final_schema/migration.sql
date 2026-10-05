/*
  Warnings:

  - The primary key for the `manager` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `manager` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `manager` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TagTypes" AS ENUM ('OPEN', 'ASSIGNED');

-- AlterTable
ALTER TABLE "manager" DROP CONSTRAINT "manager_pkey",
DROP COLUMN "id",
ADD COLUMN     "id_" UUID NOT NULL DEFAULT gen_random_uuid(),
ALTER COLUMN "middleInitial" DROP NOT NULL,
ADD CONSTRAINT "manager_pkey" PRIMARY KEY ("id_");

-- CreateTable
CREATE TABLE "route" (
    "id_" UUID NOT NULL DEFAULT gen_random_uuid(),
    "routeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_pkey" PRIMARY KEY ("id_")
);

-- CreateTable
CREATE TABLE "stop" (
    "id_" TEXT NOT NULL,
    "route_id_" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "stop_pkey" PRIMARY KEY ("id_")
);

-- CreateTable
CREATE TABLE "agent_profile" (
    "id_" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agent_id_" UUID NOT NULL,
    "contact_number" VARCHAR(100),
    "license_number" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_profile_pkey" PRIMARY KEY ("id_")
);

-- CreateTable
CREATE TABLE "trip" (
    "id_" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" "TripStatus" NOT NULL DEFAULT 'PENDING',
    "tag_type" "TagTypes" NOT NULL DEFAULT 'OPEN',
    "scheduled_date" TIMESTAMPTZ(6),
    "notes" TEXT,
    "image_url" TEXT,
    "proof_url" TEXT,
    "accepted_at" TIMESTAMPTZ(6),
    "departed_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "driver_id_" UUID,
    "route_id_" UUID NOT NULL,

    CONSTRAINT "trip_pkey" PRIMARY KEY ("id_")
);

-- CreateIndex
CREATE UNIQUE INDEX "route_routeId_key" ON "route"("routeId");

-- CreateIndex
CREATE UNIQUE INDEX "stop_route_id__key" ON "stop"("route_id_");

-- CreateIndex
CREATE INDEX "stop_route_id__idx" ON "stop"("route_id_");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profile_agent_id__key" ON "agent_profile"("agent_id_");

-- CreateIndex
CREATE INDEX "trip_driver_id__idx" ON "trip"("driver_id_");

-- CreateIndex
CREATE INDEX "trip_route_id__idx" ON "trip"("route_id_");

-- CreateIndex
CREATE INDEX "trip_status_idx" ON "trip"("status");

-- CreateIndex
CREATE UNIQUE INDEX "manager_email_key" ON "manager"("email");

-- AddForeignKey
ALTER TABLE "stop" ADD CONSTRAINT "stop_route_id__fkey" FOREIGN KEY ("route_id_") REFERENCES "route"("id_") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_driver_id__fkey" FOREIGN KEY ("driver_id_") REFERENCES "agent_profile"("id_") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_route_id__fkey" FOREIGN KEY ("route_id_") REFERENCES "route"("id_") ON DELETE RESTRICT ON UPDATE CASCADE;
