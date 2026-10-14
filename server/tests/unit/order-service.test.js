// order-service business rules, Prisma mocked
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

import prisma from "../../src/lib/prisma.js";
import * as orderService from "../../src/services/order-service.js";

const TRIP_ID = "33333333-3333-3333-3333-333333333333";
const ORDER_ID = "ORD-20260706-001";

beforeEach(() => {
    vi.resetAllMocks();
    // Pin "today" so generated order ids are deterministic
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-06T12:00:00"));
});

afterEach(() => {
    vi.useRealTimers();
});

describe("createOrder", () => {
    it("generates ORD-<date>-000 for the first order of the day", async () => {
        prisma.order.findFirst.mockResolvedValue(null);
        prisma.order.create.mockResolvedValue({});

        await orderService.createOrder("ACME", "Makati", "2026-07-06", "Boxes");

        expect(prisma.order.create).toHaveBeenCalledWith({
            data: {
                order_id: "ORD-20260706-000",
                client: "ACME",
                destination: "Makati",
                ordered_on: "2026-07-06",
                package_content: "Boxes",
            },
        });
    });

    it("increments the sequence after today's latest order", async () => {
        prisma.order.findFirst.mockResolvedValue({
            order_id: "ORD-20260706-007",
        });
        prisma.order.create.mockResolvedValue({});

        await orderService.createOrder("ACME", "Makati", "2026-07-06", "Boxes");

        expect(prisma.order.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    order_id: "ORD-20260706-008",
                }),
            }),
        );
    });

    it("only counts orders with today's prefix", async () => {
        prisma.order.findFirst.mockResolvedValue(null);
        prisma.order.create.mockResolvedValue({});

        await orderService.createOrder("ACME", "Makati", "2026-07-06", "Boxes");

        expect(prisma.order.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { order_id: { startsWith: "ORD-20260706-" } },
            }),
        );
    });
});

describe("getOrderById", () => {
    it("throws when the order does not exist", async () => {
        prisma.order.findUnique.mockResolvedValue(null);

        await expect(orderService.getOrderById(ORDER_ID)).rejects.toThrow(
            "Order not found",
        );
    });

    it("returns the order when found", async () => {
        const order = { order_id: ORDER_ID, client: "ACME" };
        prisma.order.findUnique.mockResolvedValue(order);

        await expect(orderService.getOrderById(ORDER_ID)).resolves.toEqual(
            order,
        );
    });
});

describe("getTripOrders", () => {
    it("throws when the trip does not exist", async () => {
        prisma.trip.findUnique.mockResolvedValue(null);

        await expect(orderService.getTripOrders(TRIP_ID)).rejects.toThrow(
            "Trip not found",
        );
        expect(prisma.order.findMany).not.toHaveBeenCalled();
    });

    it("returns the trip's orders", async () => {
        prisma.trip.findUnique.mockResolvedValue({ id_: TRIP_ID });
        prisma.order.findMany.mockResolvedValue([{ order_id: ORDER_ID }]);

        const result = await orderService.getTripOrders(TRIP_ID);

        expect(prisma.order.findMany).toHaveBeenCalledWith({
            where: { trip_id_: TRIP_ID },
        });
        expect(result).toEqual([{ order_id: ORDER_ID }]);
    });
});

describe("date-range queries", () => {
    it("getDeliveredOrdersRange filters up to the end of the end date", async () => {
        prisma.order.findMany.mockResolvedValue([]);

        await orderService.getDeliveredOrdersRange("2026-07-01", "2026-07-06");

        const { where } = prisma.order.findMany.mock.calls[0][0];
        expect(where.delivered_by.gte).toEqual(new Date("2026-07-01"));
        expect(where.delivered_by.lte.getHours()).toBe(23);
        expect(where.delivered_by.lte.getMinutes()).toBe(59);
    });

    it("getDeliveredOrdersRange applies no filter without dates", async () => {
        prisma.order.findMany.mockResolvedValue([]);

        await orderService.getDeliveredOrdersRange();

        const { where } = prisma.order.findMany.mock.calls[0][0];
        expect(where).toEqual({});
    });

    it("getOrdersRange matches either ordered_on or delivered_by", async () => {
        prisma.order.findMany.mockResolvedValue([]);

        await orderService.getOrdersRange("2026-07-01", "2026-07-06");

        const { where } = prisma.order.findMany.mock.calls[0][0];
        expect(where.OR).toHaveLength(2);
        expect(where.OR[0]).toHaveProperty("ordered_on");
        expect(where.OR[1]).toHaveProperty("delivered_by");
    });
});

describe("updateOrder", () => {
    it("throws when the order does not exist", async () => {
        prisma.order.findUnique.mockResolvedValue(null);

        await expect(
            orderService.updateOrder(ORDER_ID, { client: "New" }),
        ).rejects.toThrow("Order not found");
        expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it("updates the given fields", async () => {
        prisma.order.findUnique.mockResolvedValue({ order_id: ORDER_ID });
        prisma.order.update.mockResolvedValue({});

        await orderService.updateOrder(ORDER_ID, { client: "New" });

        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { order_id: ORDER_ID },
            data: { client: "New" },
        });
    });
});

describe("deleteOrder", () => {
    it("throws when the order does not exist", async () => {
        prisma.order.findUnique.mockResolvedValue(null);

        await expect(orderService.deleteOrder(ORDER_ID)).rejects.toThrow(
            "Order not found",
        );
        expect(prisma.order.delete).not.toHaveBeenCalled();
    });

    it("deletes the order when found", async () => {
        prisma.order.findUnique.mockResolvedValue({ order_id: ORDER_ID });
        prisma.order.delete.mockResolvedValue({});

        await orderService.deleteOrder(ORDER_ID);

        expect(prisma.order.delete).toHaveBeenCalledWith({
            where: { order_id: ORDER_ID },
        });
    });
});
