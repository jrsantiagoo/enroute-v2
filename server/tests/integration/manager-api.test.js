// /api/managers through the real Express app, Prisma and Supabase mocked
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/lib/prisma.js", () => ({
    default: {
        manager: { findMany: vi.fn(), findUnique: vi.fn() },
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

const MANAGER_ID = "44444444-4444-4444-4444-444444444444";

beforeEach(() => {
    vi.resetAllMocks();
});

describe("GET /api/managers", () => {
    it("returns managers in the success envelope", async () => {
        const managers = [{ id_: MANAGER_ID, lastname: "Reyes" }];
        prisma.manager.findMany.mockResolvedValue(managers);
        supabase.auth.getUser.mockResolvedValue({
            data: { user: { id: MANAGER_ID } },
            error: null,
        });

        const res = await request(app)
            .get("/api/managers")
            .set("Authorization", "Bearer good-token");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, data: managers });
    });
});

describe("GET /api/managers/me", () => {
    it("401s without a token (authenticate is mounted)", async () => {
        const res = await request(app).get("/api/managers/me");

        expect(res.status).toBe(401);
        expect(prisma.manager.findUnique).not.toHaveBeenCalled();
    });

    it("returns the profile of the token's user", async () => {
        supabase.auth.getUser.mockResolvedValue({
            data: { user: { id: MANAGER_ID } },
            error: null,
        });
        const profile = { id_: MANAGER_ID, firstname: "Ada" };
        prisma.manager.findUnique.mockResolvedValue(profile);

        const res = await request(app)
            .get("/api/managers/me")
            .set("Authorization", "Bearer good-token");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, data: profile });
        expect(prisma.manager.findUnique).toHaveBeenCalledWith({
            where: { id_: MANAGER_ID },
        });
    });

    it("400s when the profile row is missing", async () => {
        supabase.auth.getUser.mockResolvedValue({
            data: { user: { id: MANAGER_ID } },
            error: null,
        });
        prisma.manager.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .get("/api/managers/me")
            .set("Authorization", "Bearer good-token");

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: "Manager not found" });
    });
});
