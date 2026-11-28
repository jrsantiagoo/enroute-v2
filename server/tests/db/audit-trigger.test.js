// Audit Log behavior that only the real database can show: the log_audit() trigger, the actor
// passed through set_config, and row-level security. Covers issue #32's Definition of Done items
// that mocked tests cannot reach. Runs in CI against the migrated Postgres in the server job:
//   DB_TESTS=1 npx vitest run tests/db
// Without DB_TESTS it is skipped, so `npm test` still works without a database.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";

const runAgainstDatabase = process.env.DB_TESTS === "1";

describe.skipIf(!runAgainstDatabase)("audit_log against the database", () => {
    let prisma, prismaBase, auditContext, updateStops;

    beforeAll(async () => {
        // Imported here so a run without a database never builds a real Prisma client.
        ({ default: prisma, prismaBase } = await import("../../src/lib/prisma.js"));
        ({ auditContext } = await import("../../src/lib/audit-context.js"));
        ({ updateStops } = await import("../../src/services/route-service.js"));
    });

    afterAll(async () => {
        await prismaBase?.$disconnect();
    });

    const entriesFor = (recordId) =>
        prismaBase.audit_log.findMany({
            where: { record_id: recordId },
            orderBy: { id: "asc" },
        });

    const asUser = (userId, fn) => auditContext.run({ userId }, fn);

    function newVehicle() {
        return prisma.vehicle.create({
            data: {
                plate_number: `DB${Date.now().toString().slice(-7)}`,
                year: 2022,
                initial_odometer: 1000,
                expected_kml: 12,
            },
        });
    }

    it("audit_log has row-level security on and no policies, so Supabase's client API cannot read it", async () => {
        const [table] = await prismaBase.$queryRaw`
            select relrowsecurity from pg_class
            where relname = 'audit_log' and relnamespace = 'public'::regnamespace`;
        const [{ count }] = await prismaBase.$queryRaw`
            select count(*)::int as count from pg_policies
            where schemaname = 'public' and tablename = 'audit_log'`;

        expect(table.relrowsecurity).toBe(true);
        expect(count).toBe(0);
    });

    it("a sync-style rewrite of unchanged values writes no audit row; a real change writes one", async () => {
        const vehicle = await newVehicle();
        expect(await entriesFor(vehicle.id_)).toHaveLength(1); // the INSERT

        // What a sync run does to an unchanged record: same values, so only updated_at moves.
        await prisma.vehicle.update({
            where: { id_: vehicle.id_ },
            data: { plate_number: vehicle.plate_number },
        });
        await prismaBase.$executeRaw`update vehicle set updated_at = now() where id_ = ${vehicle.id_}::uuid`;
        expect(await entriesFor(vehicle.id_)).toHaveLength(1);

        await prisma.vehicle.update({
            where: { id_: vehicle.id_ },
            data: { last_odometer: 1500 },
        });
        const entries = await entriesFor(vehicle.id_);
        expect(entries.map((e) => e.action)).toEqual(["INSERT", "UPDATE"]);
    });

    it("a write by a signed-in user records them as the actor; one with no user records none", async () => {
        const userId = randomUUID();
        const vehicle = await asUser(userId, () => newVehicle());
        await prisma.vehicle.update({
            where: { id_: vehicle.id_ },
            data: { last_odometer: 2000 },
        });

        const [created, edited] = await entriesFor(vehicle.id_);
        expect(created.actor_id).toBe(userId);
        expect(edited.actor_id).toBeNull();
    });

    it("updateStops records the signed-in user on every audit row it causes", async () => {
        const route = await prismaBase.route.create({
            data: { name: `DB route ${randomUUID()}`, totalDistanceKm: 5, totalDurationMinutes: 20 },
        });
        const userId = randomUUID();

        await asUser(userId, () =>
            updateStops(route.id_, [
                { name: "DLSU", address: "Taft Ave", lat: 14.5649, lng: 120.9932 },
                { name: "Rizal Park", address: "Ermita", lat: 14.5826, lng: 120.9787 },
            ]),
        );

        const rows = await prismaBase.$queryRaw`
            select table_name, action, actor_id::text as actor_id from audit_log
            where table_name = 'stop'
              and coalesce(new_data, old_data)->>'route_id_' = ${route.id_}`;
        expect(rows).toHaveLength(2);
        expect(rows.every((r) => r.actor_id === userId)).toBe(true);
    });
});
