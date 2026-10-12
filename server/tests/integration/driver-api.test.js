// /api/drivers through the real Express app, Prisma mocked
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/lib/prisma.js", () => ({
    default: {
        agent_profile: { findMany: vi.fn() },
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

describe("GET /api/drivers", () => {
    it("returns drivers in the success envelope", async () => {
        const drivers = [{ driver_id: "D-01" }];
        prisma.agent_profile.findMany.mockResolvedValue(drivers);

        const res = await request(app)
            .get("/api/drivers")
            .set("Authorization", "Bearer good-token");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, data: drivers });
    });

    // this controller alone uses 500 + { error } instead of 400 + { message }
    it("500s with an error body when the lookup fails", async () => {
        prisma.agent_profile.findMany.mockRejectedValue(new Error("db down"));

        const res = await request(app)
            .get("/api/drivers")
            .set("Authorization", "Bearer good-token");

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: "db down" });
    });
});
