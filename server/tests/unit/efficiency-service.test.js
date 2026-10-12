// efficiency = total distance traveled / total liters added across fuel logs in range
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/services/fuel-log-service.js", () => ({
    getLogsRange: vi.fn(),
}));

import * as fuelLogService from "../../src/services/fuel-log-service.js";
import { calculateEfficiency } from "../../src/services/efficiency-service.js";

beforeEach(() => {
    vi.resetAllMocks();
});

describe("calculateEfficiency", () => {
    it("returns 0 when there are no fuel logs", async () => {
        fuelLogService.getLogsRange.mockResolvedValue([]);

        expect(await calculateEfficiency()).toBe(0);
    });

    it("guards against zero liters without dividing by zero", async () => {
        fuelLogService.getLogsRange.mockResolvedValue([
            { distance_traveled: 100, liters_added: 0 },
        ]);

        expect(await calculateEfficiency()).toBe(0);
    });

    it("computes km/L from a single log", async () => {
        fuelLogService.getLogsRange.mockResolvedValue([
            { distance_traveled: 50, liters_added: 10 },
        ]);

        expect(await calculateEfficiency()).toBe(5);
    });

    it("sums distance and liters across multiple logs before dividing", async () => {
        fuelLogService.getLogsRange.mockResolvedValue([
            { distance_traveled: 50, liters_added: 10 },
            { distance_traveled: 100, liters_added: 10 },
        ]);

        // (50 + 100) / (10 + 10) = 7.5
        expect(await calculateEfficiency()).toBe(7.5);
    });

    it("rounds the result to two decimals", async () => {
        fuelLogService.getLogsRange.mockResolvedValue([
            { distance_traveled: 100, liters_added: 3 },
        ]);

        // 100 / 3 = 33.333… → 33.33
        expect(await calculateEfficiency()).toBe(33.33);
    });

    it("treats a missing distance_traveled or liters_added as 0", async () => {
        fuelLogService.getLogsRange.mockResolvedValue([
            { liters_added: 10 },
            { distance_traveled: 20, liters_added: 5 },
        ]);

        // distance: (0 + 20) = 20, liters: (10 + 5) = 15 → 1.33
        expect(await calculateEfficiency()).toBe(1.33);
    });
});
