// /api/routes through the real Express app, Prisma mocked
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/lib/prisma.js", () => ({
    default: {
        route: { findMany: vi.fn(), create: vi.fn() },
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

describe("GET /api/routes", () => {
    it("returns routes with stops in the success envelope", async () => {
        const routes = [{ id_: "r1", stops: [{ name: "DLSU" }] }];
        prisma.route.findMany.mockResolvedValue(routes);

        const res = await request(app)
            .get("/api/routes")
            .set("Authorization", "Bearer good-token");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, data: routes });
    });
});

describe("POST /api/routes", () => {
    it("creates the route with its stops in order", async () => {
        prisma.route.create.mockResolvedValue({ id_: "r1", stops: [] });

        const res = await request(app)
            .post("/api/routes")
            .set("Authorization", "Bearer good-token")
            .send({
                name: "QA Baseline Route",
                totalDistanceKm: 12.5,
                totalDurationMinutes: 40,
                vehicleType: "van",
                stops: [
                    { name: "DLSU", address: "Taft", lat: 14.56, lng: 120.99 },
                ],
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        const { data } = prisma.route.create.mock.calls[0][0];
        expect(data.stops.create[0]).toEqual(
            expect.objectContaining({ name: "DLSU", order: 0 }),
        );
    });

    it("400s with the error envelope when the body has no stops", async () => {
        const res = await request(app)
            .post("/api/routes")
            .set("Authorization", "Bearer good-token")
            .send({ name: "broken" });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("message");
        expect(prisma.route.create).not.toHaveBeenCalled();
    });
});
