// /api/trips through the real Express app, Prisma mocked
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

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

vi.mock("../../src/lib/supabase-client.js", () => ({
    default: {
        auth: { getUser: vi.fn() },
    },
}));

import prisma from "../../src/lib/prisma.js";
import supabase from "../../src/lib/supabase-client.js";
import app from "../../src/app.js";

const TRIP_ID = "33333333-3333-3333-3333-333333333333";

beforeEach(() => {
    vi.resetAllMocks();
    supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-manager" } },
        error: null,
    });
});

describe("GET /health", () => {
    it("responds ok", async () => {
        const res = await request(app).get("/health");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ok" });
    });
});

describe("GET /api/trips", () => {
    it("returns all trips in the success envelope", async () => {
        const trips = [{ id_: TRIP_ID, status: "PENDING" }];
        prisma.trip.findMany.mockResolvedValue(trips);

        const res = await request(app)
            .get("/api/trips")
            .set("Authorization", "Bearer good-token");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, data: trips });
    });
});

describe("POST /api/trips", () => {
    it("400s when routeId or driverId is missing", async () => {
        const res = await request(app)
            .post("/api/trips")
            .set("Authorization", "Bearer good-token")
            .send({ routeId: "only-a-route" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("routeId and driverId are required");
        expect(prisma.trip.create).not.toHaveBeenCalled();
    });

    it("400s with the service error when the route does not exist", async () => {
        prisma.route.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .post("/api/trips")
            .set("Authorization", "Bearer good-token")
            .send({ routeId: "missing", driverId: "driver" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Route not found");
    });
});

describe("GET /api/trips/:id", () => {
    it("404s for an unknown trip", async () => {
        prisma.trip.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .get(`/api/trips/${TRIP_ID}`)
            .set("Authorization", "Bearer good-token");

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Trip not found");
    });

    it("returns the trip detail in the success envelope", async () => {
        const trip = { id_: TRIP_ID, status: "PENDING" };
        prisma.trip.findUnique.mockResolvedValue(trip);

        const res = await request(app)
            .get(`/api/trips/${TRIP_ID}`)
            .set("Authorization", "Bearer good-token");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, data: trip });
    });
});

describe("PATCH /api/trips/:id/status", () => {
    it("400s when status is missing", async () => {
        const res = await request(app)
            .patch(`/api/trips/${TRIP_ID}/status`)
            .set("Authorization", "Bearer good-token")
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("status is required");
    });

    it("400s for a status outside the enum", async () => {
        const res = await request(app)
            .patch(`/api/trips/${TRIP_ID}/status`)
            .set("Authorization", "Bearer good-token")
            .send({ status: "DELIVERED" });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Invalid status/);
    });

    it("updates a valid status through the full stack", async () => {
        prisma.trip.findUnique.mockResolvedValue({ id_: TRIP_ID });
        prisma.trip.update.mockResolvedValue({
            id_: TRIP_ID,
            status: "COMPLETED",
        });

        const res = await request(app)
            .patch(`/api/trips/${TRIP_ID}/status`)
            .set("Authorization", "Bearer good-token")
            .send({ status: "COMPLETED" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe("COMPLETED");
    });
});

describe("POST /api/trips/assign", () => {
    it("400s when the trip is already assigned", async () => {
        prisma.trip.findUnique.mockResolvedValue({
            id_: TRIP_ID,
            driver_id_: "already-taken",
        });
        prisma.agent_profile.findUnique.mockResolvedValue({ id_: "driver" });

        const res = await request(app)
            .post("/api/trips/assign")
            .set("Authorization", "Bearer good-token")
            .send({ tripId: TRIP_ID, driverId: "driver" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Trip is already assigned");
    });
});
