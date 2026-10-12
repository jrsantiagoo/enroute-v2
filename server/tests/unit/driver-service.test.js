// driver-services, Prisma mocked
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma.js", () => ({
    default: {
        agent_profile: { findMany: vi.fn() },
    },
}));

import prisma from "../../src/lib/prisma.js";
import * as driverService from "../../src/services/driver-services.js";

beforeEach(() => {
    vi.resetAllMocks();
});

describe("getDrivers", () => {
    it("returns drivers ordered by driver_id", async () => {
        const drivers = [{ driver_id: "D-01" }, { driver_id: "D-02" }];
        prisma.agent_profile.findMany.mockResolvedValue(drivers);

        await expect(driverService.getDrivers()).resolves.toEqual(drivers);
        expect(prisma.agent_profile.findMany).toHaveBeenCalledWith({
            orderBy: { driver_id: "asc" },
        });
    });
});
