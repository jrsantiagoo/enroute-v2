// /api/efficiency through the real Express app, Prisma mocked
// calculateEfficiency returns raw km/L (totalDistance / totalLiters), not a
// composite score — see server/src/services/efficiency-service.js.
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/lib/prisma.js", () => ({
    default: {
        fuel_log: { findMany: vi.fn() },
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

beforeEach(() => {
    vi.resetAllMocks();
    supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-manager" } },
        error: null,
    });
});

describe("POST /api/efficiency", () => {
    it("returns 0 when there are no fuel logs in range", async () => {
        prisma.fuel_log.findMany.mockResolvedValue([]);

        const res = await request(app)
            .post("/api/efficiency")
            .set("Authorization", "Bearer good-token")
            .send({ startDate: "2026-07-01", endDate: "2026-07-06" });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, data: 0 });
    });

    it("computes km/L from total distance over total liters through the full stack", async () => {
        prisma.fuel_log.findMany.mockResolvedValue([
            { distance_traveled: 100, liters_added: 10 },
        ]);

        const res = await request(app)
            .post("/api/efficiency")
            .set("Authorization", "Bearer good-token")
            .send({ startDate: "2026-07-01", endDate: "2026-07-06" });

        expect(res.status).toBe(200);
        expect(res.body.data).toBe(10);
    });
});
