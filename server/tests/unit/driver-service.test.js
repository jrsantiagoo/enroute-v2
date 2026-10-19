// driver-services, Prisma mocked
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma.js", () => ({
    default: {
        agent_profile: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        trip: { findMany: vi.fn() },
        fuel_log: { findMany: vi.fn() },
    },
}));

import prisma from "../../src/lib/prisma.js";
import * as driverService from "../../src/services/driver-services.js";

const DRIVER_UUID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
    vi.resetAllMocks();
});

describe("getDrivers", () => {
    it("returns non-archived drivers ordered by driver_id", async () => {
        const drivers = [{ driver_id: "D-01" }, { driver_id: "D-02" }];
        prisma.agent_profile.findMany.mockResolvedValue(drivers);

        await expect(driverService.getDrivers()).resolves.toEqual(drivers);
        expect(prisma.agent_profile.findMany).toHaveBeenCalledWith({
            where: { archived_at: null },
            orderBy: { driver_id: "asc" },
        });
    });

    it("includes archived drivers only when requested", async () => {
        prisma.agent_profile.findMany.mockResolvedValue([]);

        await driverService.getDrivers(true);

        expect(prisma.agent_profile.findMany).toHaveBeenCalledWith({
            where: {},
            orderBy: { driver_id: "asc" },
        });
    });
});

describe("getDriverById archived handling", () => {
    it("treats an archived driver as not found", async () => {
        prisma.agent_profile.findUnique.mockResolvedValue({ archived_at: new Date() });

        await expect(driverService.getDriverById(DRIVER_UUID)).rejects.toMatchObject({
            statusCode: 404,
        });
    });
});

describe("getDriverById", () => {
    it("returns the driver when found", async () => {
        const driver = { id_: DRIVER_UUID, driver_id: "D-01" };
        prisma.agent_profile.findUnique.mockResolvedValue(driver);

        await expect(driverService.getDriverById(DRIVER_UUID)).resolves.toEqual(driver);
    });

    it("throws a 404 DriverError when missing", async () => {
        prisma.agent_profile.findUnique.mockResolvedValue(null);

        await expect(driverService.getDriverById(DRIVER_UUID)).rejects.toMatchObject({
            message: "Driver not found",
            statusCode: 404,
        });
    });
});

describe("createDriver", () => {
    it("creates with only whitelisted, trimmed fields", async () => {
        prisma.agent_profile.create.mockResolvedValue({ driver_id: "D-01" });

        await driverService.createDriver({
            driver_id: "  D-01 ",
            id_: "hacked",
            contact_number: "0917",
        });

        expect(prisma.agent_profile.create).toHaveBeenCalledWith({
            data: { driver_id: "D-01", contact_number: "0917" },
        });
    });

    it("maps a unique violation to a 409 DriverError", async () => {
        prisma.agent_profile.create.mockRejectedValue({ code: "P2002" });

        await expect(driverService.createDriver({ driver_id: "D-01" })).rejects.toMatchObject({
            statusCode: 409,
        });
    });
});

describe("updateDriver", () => {
    it("updates the existing driver", async () => {
        prisma.agent_profile.findUnique.mockResolvedValue({ id_: DRIVER_UUID });
        prisma.agent_profile.update.mockResolvedValue({ license_number: "L-1" });

        await driverService.updateDriver(DRIVER_UUID, { license_number: "L-1" });

        expect(prisma.agent_profile.update).toHaveBeenCalledWith({
            where: { id_: DRIVER_UUID },
            data: { license_number: "L-1" },
        });
    });

    it("throws a 404 DriverError and skips the write when missing", async () => {
        prisma.agent_profile.findUnique.mockResolvedValue(null);

        await expect(
            driverService.updateDriver(DRIVER_UUID, { license_number: "L-1" }),
        ).rejects.toMatchObject({ statusCode: 404 });
        expect(prisma.agent_profile.update).not.toHaveBeenCalled();
    });
});

describe("archiveDriver", () => {
    it("sets only archived_at so vehicles are untouched", async () => {
        prisma.agent_profile.findUnique.mockResolvedValue({ id_: DRIVER_UUID, archived_at: null });
        prisma.agent_profile.update.mockResolvedValue({});

        await driverService.archiveDriver(DRIVER_UUID);

        const call = prisma.agent_profile.update.mock.calls[0][0];
        expect(call.where).toEqual({ id_: DRIVER_UUID });
        expect(Object.keys(call.data)).toEqual(["archived_at"]);
        expect(call.data.archived_at).toBeInstanceOf(Date);
    });

    it("404s for an already archived driver", async () => {
        prisma.agent_profile.findUnique.mockResolvedValue({ archived_at: new Date() });

        await expect(driverService.archiveDriver(DRIVER_UUID)).rejects.toMatchObject({
            statusCode: 404,
        });
    });
});

describe("unarchiveDriver", () => {
    it("clears archived_at on an archived driver", async () => {
        prisma.agent_profile.findUnique.mockResolvedValue({ archived_at: new Date() });
        prisma.agent_profile.update.mockResolvedValue({});

        await driverService.unarchiveDriver(DRIVER_UUID);

        expect(prisma.agent_profile.update).toHaveBeenCalledWith({
            where: { id_: DRIVER_UUID },
            data: { archived_at: null },
        });
    });
});

describe("assertDriverAssignable", () => {
    function mockWork({ trips = [], fuelLogs = [] }) {
        prisma.agent_profile.findUnique.mockResolvedValue({ id_: DRIVER_UUID, archived_at: null });
        prisma.agent_profile.findMany.mockResolvedValue([{ id_: DRIVER_UUID, driver_id: "D-01" }]);
        prisma.trip.findMany.mockResolvedValue(trips);
        prisma.fuel_log.findMany.mockResolvedValue(fuelLogs);
    }

    it("rejects an inactive driver with 409", async () => {
        mockWork({});

        await expect(driverService.assertDriverAssignable(DRIVER_UUID)).rejects.toMatchObject({
            statusCode: 409,
        });
    });

    it("allows a driver with scheduled trip hours", async () => {
        mockWork({ trips: [{ driver_id_: DRIVER_UUID, route: { totalDurationMinutes: 60 } }] });

        await expect(driverService.assertDriverAssignable(DRIVER_UUID)).resolves.toBeUndefined();
    });
});

describe("getDriverCapacity status", () => {
    it("marks 8+ hours as FULLY UTILIZED", async () => {
        prisma.agent_profile.findMany.mockResolvedValue([{ id_: DRIVER_UUID, driver_id: "D-01" }]);
        prisma.trip.findMany.mockResolvedValue([
            { driver_id_: DRIVER_UUID, route: { totalDurationMinutes: 480 } },
        ]);
        prisma.fuel_log.findMany.mockResolvedValue([]);

        const [row] = await driverService.getDriverCapacity();

        expect(row.status).toBe("FULLY UTILIZED");
    });
});
