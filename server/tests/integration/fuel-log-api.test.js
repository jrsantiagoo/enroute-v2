// /api/fuel_logs through the real Express app, Prisma mocked
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/lib/prisma.js", () => ({
    default: {
        fuel_log: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        order: { findMany: vi.fn() },
        vehicle: { findUnique: vi.fn(), update: vi.fn() },
    },
}));

vi.mock("../../src/lib/supabase-client.js", () => ({
    default: {
        auth: { getUser: vi.fn() },
    },
}));

import prisma from "../../src/lib/prisma.js";
import supabase from "../../src/lib/supabase-client.js";
import app from "../../src/app.js";

const LOG_ID = "55555555-5555-5555-5555-555555555555";

beforeEach(() => {
    vi.resetAllMocks();
    supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-manager" } },
        error: null,
    });
});

describe("GET /api/fuel_logs", () => {
    it("returns logs in the success envelope", async () => {
        const logs = [{ id_: LOG_ID, liters_added: 10 }];
        prisma.fuel_log.findMany.mockResolvedValue(logs);

        const res = await request(app)
            .get("/api/fuel_logs")
            .set("Authorization", "Bearer good-token");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, data: logs });
    });
});

describe("POST /api/fuel_logs", () => {
    it("creates a log from the request body", async () => {
        // createFuelLog looks up the vehicle to compute variance_percentage
        // against its expected_kml, and fire-and-forgets an odometer update.
        prisma.vehicle.findUnique.mockResolvedValue({
            id_: "VEH-1",
            expected_kml: 10,
            last_odometer: 1000,
        });
        prisma.vehicle.update.mockResolvedValue({});
        prisma.fuel_log.create.mockResolvedValue({ id_: LOG_ID });

        const res = await request(app)
            .post("/api/fuel_logs")
            .set("Authorization", "Bearer good-token")
            .send({ vehicle_id_: "VEH-1", liters_added: 10, distance_traveled: 120 });

        expect(res.status).toBe(200);
        expect(prisma.fuel_log.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                vehicle_id_: "VEH-1",
                liters_added: 10,
                distance_traveled: 120,
                fuel_efficiency: 12, // 120 / 10
                variance_percentage: 20, // (12 - 10) / 10 * 100
            }),
        });
    });
});

describe("PUT /api/fuel_logs/:logId", () => {
    it("400s for an unknown log", async () => {
        prisma.fuel_log.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .put(`/api/fuel_logs/${LOG_ID}`)
            .set("Authorization", "Bearer good-token")
            .send({ liters_added: 5 });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: "Fuel log record not found" });
    });
});

describe("POST /api/fuel_logs/daily_fuel_per_order", () => {
    it("aggregates logs and delivered orders per day", async () => {
        prisma.fuel_log.findMany.mockResolvedValue([
            { log_date: "2026-07-01T08:00:00Z", liters_added: 10 },
        ]);
        prisma.order.findMany.mockResolvedValue([
            { delivered_by: "2026-07-01T12:00:00Z" },
        ]);

        const res = await request(app)
            .post("/api/fuel_logs/daily_fuel_per_order")
            .set("Authorization", "Bearer good-token")
            .send({ startDate: "2026-07-01", endDate: "2026-07-01" });

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([
            {
                date: "2026-07-01",
                totalFuel: 10,
                orderCount: 1,
                fuelPerOrder: 10,
            },
        ]);
    });
});
