// trip-service business rules, Prisma mocked
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma.js", () => ({
    default: {
        route: { findUnique: vi.fn() },
        agent_profile: { findUnique: vi.fn() },
        trip: {
            create: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

import prisma from "../../src/lib/prisma.js";
import * as tripService from "../../src/services/trip-service.js";

const ROUTE_ID = "11111111-1111-1111-1111-111111111111";
const DRIVER_ID = "22222222-2222-2222-2222-222222222222";
const TRIP_ID = "33333333-3333-3333-3333-333333333333";

beforeEach(() => {
    vi.resetAllMocks();
});

describe("createTrip", () => {
    it("throws when the route does not exist", async () => {
        prisma.route.findUnique.mockResolvedValue(null);

        await expect(
            tripService.createTrip(ROUTE_ID, DRIVER_ID),
        ).rejects.toThrow("Route not found");
        expect(prisma.trip.create).not.toHaveBeenCalled();
    });

    it("throws when the driver does not exist", async () => {
        prisma.route.findUnique.mockResolvedValue({ id_: ROUTE_ID });
        prisma.agent_profile.findUnique.mockResolvedValue(null);

        await expect(
            tripService.createTrip(ROUTE_ID, DRIVER_ID),
        ).rejects.toThrow("Driver not found");
        expect(prisma.trip.create).not.toHaveBeenCalled();
    });

    it("creates a PENDING, ASSIGNED trip with the scheduled date", async () => {
        prisma.route.findUnique.mockResolvedValue({ id_: ROUTE_ID });
        prisma.agent_profile.findUnique.mockResolvedValue({ id_: DRIVER_ID });
        prisma.trip.create.mockResolvedValue({ id_: TRIP_ID });

        await tripService.createTrip(ROUTE_ID, DRIVER_ID, "2026-07-03");

        expect(prisma.trip.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    route_id_: ROUTE_ID,
                    driver_id_: DRIVER_ID,
                    status: "PENDING",
                    tag_type: "ASSIGNED",
                    scheduled_date: new Date("2026-07-03"),
                }),
            }),
        );
    });
});

describe("assignDriverToTrip", () => {
    it("throws when the trip does not exist", async () => {
        prisma.trip.findUnique.mockResolvedValue(null);

        await expect(
            tripService.assignDriverToTrip(TRIP_ID, DRIVER_ID),
        ).rejects.toThrow("Trip not found");
    });

    it("throws when the trip already has a driver", async () => {
        prisma.trip.findUnique.mockResolvedValue({
            id_: TRIP_ID,
            driver_id_: "some-other-driver",
        });
        prisma.agent_profile.findUnique.mockResolvedValue({ id_: DRIVER_ID });

        await expect(
            tripService.assignDriverToTrip(TRIP_ID, DRIVER_ID),
        ).rejects.toThrow("Trip is already assigned");
        expect(prisma.trip.update).not.toHaveBeenCalled();
    });

    it("assigns the driver and tags the trip ASSIGNED", async () => {
        prisma.trip.findUnique.mockResolvedValue({
            id_: TRIP_ID,
            driver_id_: null,
        });
        prisma.agent_profile.findUnique.mockResolvedValue({ id_: DRIVER_ID });
        prisma.trip.update.mockResolvedValue({ id_: TRIP_ID });

        await tripService.assignDriverToTrip(TRIP_ID, DRIVER_ID);

        expect(prisma.trip.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id_: TRIP_ID },
                data: { driver_id_: DRIVER_ID, tag_type: "ASSIGNED" },
            }),
        );
    });
});

describe("updateTripStatus", () => {
    it("rejects a status outside the enum without touching the DB", async () => {
        await expect(
            tripService.updateTripStatus(TRIP_ID, "DELIVERED"),
        ).rejects.toThrow(/Invalid status/);
        expect(prisma.trip.findUnique).not.toHaveBeenCalled();
    });

    it.each(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"])(
        "accepts valid status %s",
        async (status) => {
            prisma.trip.findUnique.mockResolvedValue({ id_: TRIP_ID });
            prisma.trip.update.mockResolvedValue({ id_: TRIP_ID, status });

            const result = await tripService.updateTripStatus(TRIP_ID, status);

            expect(result.status).toBe(status);
            expect(prisma.trip.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: { status } }),
            );
        },
    );

    it("throws when the trip does not exist", async () => {
        prisma.trip.findUnique.mockResolvedValue(null);

        await expect(
            tripService.updateTripStatus(TRIP_ID, "COMPLETED"),
        ).rejects.toThrow("Trip not found");
    });
});

describe("deleteTrip", () => {
    it("throws when the trip does not exist", async () => {
        prisma.trip.findUnique.mockResolvedValue(null);

        await expect(tripService.deleteTrip(TRIP_ID)).rejects.toThrow(
            "Trip not found",
        );
        expect(prisma.trip.delete).not.toHaveBeenCalled();
    });
});

describe("getTripsByDriverAndDay", () => {
    it("groups trips into driverId-day cells", async () => {
        // 2026-07-03 is a Friday; 2026-07-05 is a Sunday.
        prisma.trip.findMany.mockResolvedValue([
            {
                id_: "t1",
                scheduled_date: "2026-07-03T08:00:00Z",
                agent_profile: { driver_id: "D-01" },
                route: { name: "North Loop" },
            },
            {
                id_: "t2",
                scheduled_date: "2026-07-03T10:00:00Z",
                agent_profile: { driver_id: "D-01" },
                route: { name: "South Loop" },
            },
            {
                id_: "t3",
                scheduled_date: "2026-07-05T08:00:00Z",
                agent_profile: { driver_id: "D-02" },
                route: { name: "East Loop" },
            },
        ]);

        const grid = await tripService.getTripsByDriverAndDay();

        expect(grid["D-01-Fri"]).toHaveLength(2);
        expect(grid["D-02-Sun"]).toEqual([
            { tripId: "t3", routeName: "East Loop" },
        ]);
    });
});
