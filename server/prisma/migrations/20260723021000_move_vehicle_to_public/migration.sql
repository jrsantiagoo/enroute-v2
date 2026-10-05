-- Drop foreign keys referencing vehicles.vehicle
ALTER TABLE "fuel_log" DROP CONSTRAINT "fuel_log_vehicle_id__fkey";
ALTER TABLE "trip" DROP CONSTRAINT "trip_vehicle_id__fkey";

-- Move vehicle table from vehicles schema to public
ALTER TABLE "vehicles"."vehicle" SET SCHEMA "public";

-- Drop the now-empty vehicles schema
DROP SCHEMA "vehicles";

-- Recreate foreign keys pointing to public.vehicle
ALTER TABLE "trip" ADD CONSTRAINT "trip_vehicle_id__fkey" FOREIGN KEY ("vehicle_id_") REFERENCES "public"."vehicle"("id_") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fuel_log" ADD CONSTRAINT "fuel_log_vehicle_id__fkey" FOREIGN KEY ("vehicle_id_") REFERENCES "public"."vehicle"("id_") ON DELETE SET NULL ON UPDATE CASCADE;
