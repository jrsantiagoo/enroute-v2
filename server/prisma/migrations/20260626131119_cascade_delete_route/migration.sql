-- DropForeignKey
ALTER TABLE "stop" DROP CONSTRAINT "stop_route_id__fkey";

-- AddForeignKey
ALTER TABLE "stop" ADD CONSTRAINT "stop_route_id__fkey" FOREIGN KEY ("route_id_") REFERENCES "route"("id_") ON DELETE CASCADE ON UPDATE CASCADE;
