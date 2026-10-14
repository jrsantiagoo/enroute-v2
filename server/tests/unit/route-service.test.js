// route-service persistence mapping, Prisma mocked
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma.js", () => ({
    default: {
        route: { findMany: vi.fn(), create: vi.fn() },
    },
}));

import prisma from "../../src/lib/prisma.js";
import * as routeService from "../../src/services/route-service.js";

beforeEach(() => {
    vi.resetAllMocks();
});

describe("getAllRoutes", () => {
    it("returns routes with their stops included", async () => {
        const routes = [{ id_: "r1", stops: [] }];
        prisma.route.findMany.mockResolvedValue(routes);

        await expect(routeService.getAllRoutes()).resolves.toEqual(routes);
        expect(prisma.route.findMany).toHaveBeenCalledWith({
            include: { stops: true },
            orderBy: { createdAt: "desc" },
        });
    });
});

describe("createRoute", () => {
    it("persists route fields and stops with their list order", async () => {
        prisma.route.create.mockResolvedValue({});

        await routeService.createRoute({
            name: "QA Baseline Route",
            totalDistanceKm: 12.5,
            totalDurationMinutes: 40,
            vehicleType: "van",
            stops: [
                { name: "DLSU", address: "Taft", lat: 14.56, lng: 120.99 },
                { name: "Rizal Park", address: "Manila", lat: 14.58, lng: 120.97 },
            ],
        });

        const { data } = prisma.route.create.mock.calls[0][0];
        expect(data.name).toBe("QA Baseline Route");
        expect(data.vehicleType).toBe("van");
        expect(data.stops.create).toEqual([
            expect.objectContaining({ name: "DLSU", order: 0 }),
            expect.objectContaining({ name: "Rizal Park", order: 1 }),
        ]);
    });
});
