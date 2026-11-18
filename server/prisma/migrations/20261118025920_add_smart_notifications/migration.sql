/*
  Warnings:

  - You are about to drop the column `archived_at` on the `agent_profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "agent_profile" DROP COLUMN "archived_at";

-- CreateTable
CREATE TABLE "SmartNotificationDismissal" (
    "id_" TEXT NOT NULL,
    "manager_id_" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "notification_key" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "metric" DOUBLE PRECISION,
    "dismissed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmartNotificationDismissal_pkey" PRIMARY KEY ("id_")
);

-- CreateTable
CREATE TABLE "DailyWeather" (
    "date" DATE NOT NULL,
    "precip_mm" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'open-meteo',

    CONSTRAINT "DailyWeather_pkey" PRIMARY KEY ("date")
);

-- CreateTable
CREATE TABLE "KnownEvent" (
    "id_" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'event',
    "notes" TEXT,

    CONSTRAINT "KnownEvent_pkey" PRIMARY KEY ("id_")
);

-- CreateIndex
CREATE INDEX "SmartNotificationDismissal_manager_id__surface_idx" ON "SmartNotificationDismissal"("manager_id_", "surface");

-- CreateIndex
CREATE UNIQUE INDEX "SmartNotificationDismissal_manager_id__surface_notification_key" ON "SmartNotificationDismissal"("manager_id_", "surface", "notification_key");

-- CreateIndex
CREATE INDEX "KnownEvent_date_idx" ON "KnownEvent"("date");
