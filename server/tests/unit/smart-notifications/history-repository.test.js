import { test, expect } from "vitest";
import {
    createHistoryRepository,
    enrichTrips,
} from "../../../src/services/smart-notifications/history-repository.js";
import { NOTIFICATION_CONFIG } from "./fixtures.js";

// Records the query the repository sends and returns canned trip rows shaped like the real schema.
function makePrismaWithTrips(rows) {
    const calls = [];
    return {
        calls,
        trip: {
            findMany: async (query) => {
                calls.push(query);
                return rows;
            },
        },
    };
}

const SINCE = new Date("2026-08-01T00:00:00+08:00");

test("completed trips are read from departed_at, completed_at and the real relations", async () => {
    const prisma = makePrismaWithTrips([
        {
            id_: "t1",
            departed_at: new Date("2026-11-02T08:00:00+08:00"),
            completed_at: new Date("2026-11-02T15:00:00+08:00"),
            driver_id_: "d1",
            vehicle_id_: "v1",
            route: { totalDistanceKm: 42.5, _count: { stops: 9 } },
            _count: { orders: 7 },
        },
        {
            id_: "t2",
            departed_at: new Date("2026-11-03T08:00:00+08:00"),
            completed_at: new Date("2026-11-03T16:00:00+08:00"),
            driver_id_: "d2",
            vehicle_id_: "v2",
            route: { totalDistanceKm: 30, _count: { stops: 6 } },
            _count: { orders: 0 },
        },
        {
            id_: "t3",
            departed_at: new Date("2026-11-04T08:00:00+08:00"),
            completed_at: new Date("2026-11-04T16:00:00+08:00"),
            driver_id_: null,
            vehicle_id_: null,
            route: null,
            _count: { orders: 0 },
        },
    ]);
    const trips =
        await createHistoryRepository(prisma).loadCompletedTrips(SINCE);

    expect(prisma.calls[0].where).toMatchObject({
        status: "COMPLETED",
        deleted_at: null,
        completed_at: { gte: SINCE },
    });
    expect(trips[0]).toEqual({
        id: "t1",
        startedAt: new Date("2026-11-02T08:00:00+08:00"),
        completedAt: new Date("2026-11-02T15:00:00+08:00"),
        stops: 7,
        distanceKm: 42.5,
        fuelLiters: null,
        driverId: "d1",
        vehicleId: "v1",
    });
    // Orders win over route stops, and route stops are the fallback.
    expect(trips[0].stops).toBe(7);
    expect(trips[1].stops).toBe(6);
    expect(trips[2].stops).toBe(0);
});

test("active trips are PROCESSING trips, and only unfinished orders count as remaining stops", async () => {
    const prisma = makePrismaWithTrips([
        { id_: "t1", orders: [{ id_: "o1" }, { id_: "o2" }] },
    ]);
    const active = await createHistoryRepository(prisma).loadActiveTrips();

    expect(prisma.calls[0].where).toMatchObject({
        status: "PROCESSING",
        deleted_at: null,
    });
    expect(prisma.calls[0].select.orders.where.status.in).toEqual([
        "PENDING",
        "PROCESSING",
    ]);
    expect(active).toEqual([{ id: "t1", remainingStops: 2 }]);
});

test("trips with no stops or no usable times are left out of the history", () => {
    const good = {
        id: "g",
        startedAt: new Date("2026-11-02T08:00:00+08:00"),
        completedAt: new Date("2026-11-02T15:00:00+08:00"),
        stops: 5,
        distanceKm: 20,
        fuelLiters: null,
        driverId: "d1",
        vehicleId: "v1",
    };
    const enriched = enrichTrips(
        [
            good,
            { ...good, id: "no-stops", stops: 0 },
            { ...good, id: "no-start", startedAt: null },
            { ...good, id: "backwards", completedAt: good.startedAt },
        ],
        [],
        new Set(),
        NOTIFICATION_CONFIG,
    );

    expect(enriched.map((t) => t.id)).toEqual(["g"]);
    expect(enriched[0].fuelPer100).toBeNull();
    expect(enriched[0].rainy).toBeNull();
});
