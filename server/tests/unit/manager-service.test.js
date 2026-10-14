// manager-service, Prisma mocked
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma.js", () => ({
    default: {
        manager: { findMany: vi.fn(), findUnique: vi.fn() },
    },
}));

import prisma from "../../src/lib/prisma.js";
import * as managerService from "../../src/services/manager-service.js";

const MANAGER_ID = "44444444-4444-4444-4444-444444444444";

beforeEach(() => {
    vi.resetAllMocks();
});

describe("getAllManagers", () => {
    it("returns managers ordered by lastname", async () => {
        const managers = [{ lastname: "Cruz" }, { lastname: "Reyes" }];
        prisma.manager.findMany.mockResolvedValue(managers);

        await expect(managerService.getAllManagers()).resolves.toEqual(
            managers,
        );
        expect(prisma.manager.findMany).toHaveBeenCalledWith({
            orderBy: { lastname: "asc" },
        });
    });
});

describe("getMe", () => {
    it("throws when the manager does not exist", async () => {
        prisma.manager.findUnique.mockResolvedValue(null);

        await expect(managerService.getMe(MANAGER_ID)).rejects.toThrow(
            "Manager not found",
        );
    });

    it("returns the manager profile when found", async () => {
        const manager = { id_: MANAGER_ID, firstname: "Ada" };
        prisma.manager.findUnique.mockResolvedValue(manager);

        await expect(managerService.getMe(MANAGER_ID)).resolves.toEqual(
            manager,
        );
    });
});
