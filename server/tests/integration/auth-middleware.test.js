// authenticate middleware, Supabase client mocked
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../../src/lib/supabase-client.js", () => ({
    default: {
        auth: { getUser: vi.fn() },
    },
}));

import supabase from "../../src/lib/supabase-client.js";
import { authenticate } from "../../src/middleware/auth.js";

const app = express();
app.get("/protected", authenticate, (req, res) =>
    res.json({ ok: true, hasUser: Boolean(req.user) }),
);

beforeEach(() => {
    vi.resetAllMocks();
});

describe("authenticate middleware", () => {
    it("401s when the Authorization header is missing", async () => {
        const res = await request(app).get("/protected");

        expect(res.status).toBe(401);
        expect(res.body.error).toBe(
            "Authorization header missing or malformed",
        );
        expect(supabase.auth.getUser).not.toHaveBeenCalled();
    });

    it("401s when the header is not a Bearer token", async () => {
        const res = await request(app)
            .get("/protected")
            .set("Authorization", "Basic abc123");

        expect(res.status).toBe(401);
        expect(supabase.auth.getUser).not.toHaveBeenCalled();
    });

    it("403s when Supabase rejects the token", async () => {
        supabase.auth.getUser.mockResolvedValue({
            data: null,
            error: { message: "invalid JWT" },
        });

        const res = await request(app)
            .get("/protected")
            .set("Authorization", "Bearer bad-token");

        expect(res.status).toBe(403);
        expect(res.body.error).toBe("Invalid or expired token");
    });

    it("passes through and attaches req.user for a valid token", async () => {
        supabase.auth.getUser.mockResolvedValue({
            data: { user: { id: "user-1", email: "manager@example.com" } },
            error: null,
        });

        const res = await request(app)
            .get("/protected")
            .set("Authorization", "Bearer good-token");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true, hasUser: true });
        expect(supabase.auth.getUser).toHaveBeenCalledWith("good-token");
    });

    it("500s when the Supabase call itself throws", async () => {
        supabase.auth.getUser.mockRejectedValue(new Error("network down"));

        const res = await request(app)
            .get("/protected")
            .set("Authorization", "Bearer any-token");

        expect(res.status).toBe(500);
        expect(res.body.error).toBe("Server error during authentication");
    });
});
