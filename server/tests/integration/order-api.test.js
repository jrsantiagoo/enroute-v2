// /api/orders through the real Express app, Prisma mocked
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/lib/prisma.js", () => ({
    default: {
        order: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        trip: { findUnique: vi.fn() },
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

const ORDER_ID = "ORD-20260706-001";

beforeEach(() => {
    vi.resetAllMocks();
    supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-manager" } },
        error: null,
    });
});

describe("GET /api/orders", () => {
    it("returns all orders in the success envelope", async () => {
        const orders = [{ order_id: ORDER_ID }];
        prisma.order.findMany.mockResolvedValue(orders);

        const res = await request(app)
            .get("/api/orders")
            .set("Authorization", "Bearer good-token");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, data: orders });
    });
});

describe("GET /api/orders/:orderId", () => {
    it("400s with the service message for an unknown order", async () => {
        prisma.order.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .get(`/api/orders/${ORDER_ID}`)
            .set("Authorization", "Bearer good-token");

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: "Order not found" });
    });
});

describe("GET /api/orders/trip_orders/:tripId", () => {
    it("400s when the trip does not exist", async () => {
        prisma.trip.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .get("/api/orders/trip_orders/nope")
            .set("Authorization", "Bearer good-token");

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: "Trip not found" });
    });
});

describe("POST /api/orders", () => {
    it("creates an order with a generated id", async () => {
        prisma.order.findFirst.mockResolvedValue(null);
        prisma.order.create.mockResolvedValue({ order_id: ORDER_ID });

        const res = await request(app)
            .post("/api/orders")
            .set("Authorization", "Bearer good-token")
            .send({
                client: "ACME",
                destination: "Makati",
                packageContent: "Boxes",
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(prisma.order.create).toHaveBeenCalled();
    });

    it("400s and creates nothing when required fields are missing", async () => {
        prisma.order.findFirst.mockResolvedValue(null);
        prisma.order.create.mockResolvedValue({});

        const res = await request(app)
            .post("/api/orders")
            .set("Authorization", "Bearer good-token")
            .send({ client: "ACME" });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: "Fields incomplete" });
        expect(prisma.order.create).not.toHaveBeenCalled();
    });
});

describe("PUT /api/orders/status/:orderId", () => {
    it("uppercases the status before persisting", async () => {
        prisma.order.findUnique.mockResolvedValue({ order_id: ORDER_ID });
        prisma.order.update.mockResolvedValue({});

        const res = await request(app)
            .put(`/api/orders/status/${ORDER_ID}`)
            .set("Authorization", "Bearer good-token")
            .send({ status: "completed" });

        expect(res.status).toBe(200);
        expect(prisma.order.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { status: "COMPLETED" },
            }),
        );
    });

    it("400s when no fields are provided", async () => {
        const res = await request(app)
            .put(`/api/orders/status/${ORDER_ID}`)
            .set("Authorization", "Bearer good-token")
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: "No fields were provided" });
        expect(prisma.order.update).not.toHaveBeenCalled();
    });
});

describe("PUT /api/orders/assign/:orderId", () => {
    it("400s without a tripId", async () => {
        const res = await request(app)
            .put(`/api/orders/assign/${ORDER_ID}`)
            .set("Authorization", "Bearer good-token")
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: "tripId is required" });
    });
});

describe("DELETE /api/orders/:orderId", () => {
    it("400s for an unknown order", async () => {
        prisma.order.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .delete(`/api/orders/${ORDER_ID}`)
            .set("Authorization", "Bearer good-token");

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: "Order not found" });
        expect(prisma.order.delete).not.toHaveBeenCalled();
    });
});
