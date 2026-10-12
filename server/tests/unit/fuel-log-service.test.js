// fuel-log-service metrics and guards, Prisma mocked
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma.js", () => ({
    default: {
        fuel_log: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        order: { findMany: vi.fn() },
    },
}));

import prisma from "../../src/lib/prisma.js";
import * as fuelLogService from "../../src/services/fuel-log-service.js";

const LOG_ID = "55555555-5555-5555-5555-555555555555";

beforeEach(() => {
    vi.resetAllMocks();
});

describe("buildDailyPerOrderMetrics", () => {
    const build = (logs, orders) =>
        fuelLogService.buildDailyPerOrderMetrics(
            logs,
            orders,
            "liters_added",
            "totalFuel",
            "fuelPerOrder",
        );

    it("buckets logs by day and divides by that day's delivered orders", () => {
        const logs = [
            { log_date: "2026-07-01T08:00:00Z", liters_added: 10 },
            { log_date: "2026-07-01T17:00:00Z", liters_added: 20 },
        ];
        const orders = [
            { delivered_by: "2026-07-01T12:00:00Z" },
            { delivered_by: "2026-07-01T13:00:00Z" },
        ];

        expect(build(logs, orders)).toEqual([
            {
                date: "2026-07-01",
                totalFuel: 30,
                orderCount: 2,
                fuelPerOrder: 15,
            },
        ]);
    });

    it("returns 0 per order instead of dividing by zero when a day has no orders", () => {
        const logs = [{ log_date: "2026-07-02T08:00:00Z", liters_added: 12 }];

        expect(build(logs, [])[0].fuelPerOrder).toBe(0);
    });

    it("ignores orders delivered on days without logs", () => {
        const logs = [{ log_date: "2026-07-01T08:00:00Z", liters_added: 5 }];
        const orders = [{ delivered_by: "2026-07-03T12:00:00Z" }];

        const result = build(logs, orders);
        expect(result).toHaveLength(1);
        expect(result[0].orderCount).toBe(0);
    });

    it("sorts the buckets by date", () => {
        const logs = [
            { log_date: "2026-07-05T08:00:00Z", liters_added: 1 },
            { log_date: "2026-07-01T08:00:00Z", liters_added: 2 },
        ];

        expect(build(logs, []).map((d) => d.date)).toEqual([
            "2026-07-01",
            "2026-07-05",
        ]);
    });

    it("treats missing values as 0", () => {
        const logs = [{ log_date: "2026-07-01T08:00:00Z" }];

        expect(build(logs, [])[0].totalFuel).toBe(0);
    });
});

describe("getLogsRange", () => {
    it("excludes soft-deleted logs and filters to the end of the end date", async () => {
        prisma.fuel_log.findMany.mockResolvedValue([]);

        await fuelLogService.getLogsRange("2026-07-01", "2026-07-06");

        const { where } = prisma.fuel_log.findMany.mock.calls[0][0];
        expect(where.deleted_at).toBeNull();
        expect(where.log_date.gte).toEqual(new Date("2026-07-01"));
        expect(where.log_date.lte.getHours()).toBe(23);
    });

    it("still excludes soft-deleted logs when no dates are given", async () => {
        prisma.fuel_log.findMany.mockResolvedValue([]);

        await fuelLogService.getLogsRange();

        const { where } = prisma.fuel_log.findMany.mock.calls[0][0];
        expect(where).toEqual({ deleted_at: null });
    });
});

describe("updateFuelLog", () => {
    it("throws when the log does not exist", async () => {
        prisma.fuel_log.findUnique.mockResolvedValue(null);

        await expect(
            fuelLogService.updateFuelLog(LOG_ID, { liters_added: 5 }),
        ).rejects.toThrow("Fuel log record not found");
        expect(prisma.fuel_log.update).not.toHaveBeenCalled();
    });

    it("updates the given fields when found", async () => {
        prisma.fuel_log.findUnique.mockResolvedValue({ id_: LOG_ID });
        prisma.fuel_log.update.mockResolvedValue({});

        await fuelLogService.updateFuelLog(LOG_ID, { liters_added: 5 });

        expect(prisma.fuel_log.update).toHaveBeenCalledWith({
            where: { id_: LOG_ID },
            data: { liters_added: 5 },
        });
    });
});

describe("dailyFuelPerOrder", () => {
    it("composes logs and delivered orders into daily per-order metrics", async () => {
        prisma.fuel_log.findMany.mockResolvedValue([
            { log_date: "2026-07-01T08:00:00Z", liters_added: 10 },
        ]);
        prisma.order.findMany.mockResolvedValue([
            { delivered_by: "2026-07-01T12:00:00Z" },
        ]);

        const result = await fuelLogService.dailyFuelPerOrder(
            "2026-07-01",
            "2026-07-01",
        );

        expect(result).toEqual([
            {
                date: "2026-07-01",
                totalFuel: 10,
                orderCount: 1,
                fuelPerOrder: 10,
            },
        ]);
    });
});
