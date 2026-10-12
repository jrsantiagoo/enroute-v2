-- Reconciles schema.prisma changes that were applied without a migration
-- (f588219 route.archivedAt, 98e5353 optional trip.route_id_, d71401d drop vehicle.target_efficiency).
-- Guarded so it is a no-op on databases that already have these changes.

-- AlterTable
ALTER TABLE "route" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- DropForeignKey
ALTER TABLE "trip" DROP CONSTRAINT IF EXISTS "trip_route_id__fkey";

-- AlterTable
ALTER TABLE "trip" ALTER COLUMN "route_id_" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_route_id__fkey" FOREIGN KEY ("route_id_") REFERENCES "route"("id_") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "vehicle" DROP COLUMN IF EXISTS "target_efficiency";
