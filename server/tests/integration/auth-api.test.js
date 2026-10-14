// /api/auth through the real Express app, Supabase and Prisma mocked
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/lib/supabase-client.js", () => ({
    default: {
        auth: {
            signUp: vi.fn(),
            signInWithPassword: vi.fn(),
            refreshSession: vi.fn(),
            updateUser: vi.fn(),
            signOut: vi.fn(),
            getUser: vi.fn(),
        },
    },
}));

vi.mock("../../src/lib/prisma.js", () => ({
    default: {
        manager: { create: vi.fn(), findUnique: vi.fn() },
    },
}));

import supabase from "../../src/lib/supabase-client.js";
import prisma from "../../src/lib/prisma.js";
import app from "../../src/app.js";

const USER_ID = "44444444-4444-4444-4444-444444444444";
const SESSION = {
    access_token: "access-abc",
    refresh_token: "refresh-abc",
    expires_in: 3600,
    user: { id: USER_ID, email: "manager@example.com" },
};

function mockValidToken() {
    supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: USER_ID, email: "manager@example.com" } },
        error: null,
    });
}

beforeEach(() => {
    vi.resetAllMocks();
});

describe("POST /api/auth/login", () => {
    it("returns tokens and the manager profile", async () => {
        supabase.auth.signInWithPassword.mockResolvedValue({
            data: { user: { id: USER_ID }, session: SESSION },
            error: null,
        });
        const profile = { id_: USER_ID, firstname: "Ada", lastname: "Cruz" };
        prisma.manager.findUnique.mockResolvedValue(profile);

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "manager@example.com", password: "secret" });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            access_token: SESSION.access_token,
            refresh_token: SESSION.refresh_token,
            expires_in: SESSION.expires_in,
            user: SESSION.user,
            profile,
        });
    });

    it("400s with Supabase's message on bad credentials", async () => {
        supabase.auth.signInWithPassword.mockResolvedValue({
            data: null,
            error: { message: "Invalid login credentials" },
        });

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "manager@example.com", password: "wrong" });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "Invalid login credentials" });
        expect(prisma.manager.findUnique).not.toHaveBeenCalled();
    });
});

describe("POST /api/auth/register", () => {
    it("400s with Supabase's message when sign-up fails", async () => {
        supabase.auth.signUp.mockResolvedValue({
            data: null,
            error: { message: "User already registered" },
        });

        const res = await request(app)
            .post("/api/auth/register")
            .send({ email: "manager@example.com", password: "secret" });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "User already registered" });
        expect(prisma.manager.create).not.toHaveBeenCalled();
    });

    // BR-02/RMS-36: the controller references firstname/lastname/middleInitial
    // that are never read from the request, so the success path crashes.
    it.todo("creates the manager profile on successful sign-up (blocked by RMS-36)");
});

describe("POST /api/auth/refresh", () => {
    it("returns a refreshed session", async () => {
        supabase.auth.refreshSession.mockResolvedValue({
            data: { session: SESSION },
            error: null,
        });

        const res = await request(app)
            .post("/api/auth/refresh")
            .send({ refresh_token: "refresh-abc" });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            access_token: SESSION.access_token,
            refresh_token: SESSION.refresh_token,
            expires_in: SESSION.expires_in,
            user: SESSION.user,
        });
    });

    it("400s when the refresh token is rejected", async () => {
        supabase.auth.refreshSession.mockResolvedValue({
            data: null,
            error: { message: "Invalid Refresh Token" },
        });

        const res = await request(app)
            .post("/api/auth/refresh")
            .send({ refresh_token: "stale" });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "Invalid Refresh Token" });
    });
});

describe("POST /api/auth/logout", () => {
    it("401s without a token (authenticate is mounted)", async () => {
        const res = await request(app).post("/api/auth/logout");

        expect(res.status).toBe(401);
        expect(supabase.auth.signOut).not.toHaveBeenCalled();
    });

    it("signs out with a valid token", async () => {
        mockValidToken();
        supabase.auth.signOut.mockResolvedValue({ error: null });

        const res = await request(app)
            .post("/api/auth/logout")
            .set("Authorization", "Bearer access-abc");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "Logged out successfully" });
    });
});

describe("PUT /api/auth/change-password", () => {
    it("401s without a token", async () => {
        const res = await request(app).put("/api/auth/change-password");

        expect(res.status).toBe(401);
    });

    it("400s when the confirmation does not match", async () => {
        mockValidToken();

        const res = await request(app)
            .put("/api/auth/change-password")
            .set("Authorization", "Bearer access-abc")
            .send({
                oldPassword: "old",
                newPassword: "new-1",
                confirmPassword: "new-2",
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe(
            "New password and confirmation do not match",
        );
        expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it("400s when the current password is wrong", async () => {
        mockValidToken();
        supabase.auth.signInWithPassword.mockResolvedValue({
            error: { message: "Invalid login credentials" },
        });

        const res = await request(app)
            .put("/api/auth/change-password")
            .set("Authorization", "Bearer access-abc")
            .send({
                oldPassword: "wrong",
                newPassword: "new-1",
                confirmPassword: "new-1",
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Current password is incorrect");
        expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it("changes the password after verifying the old one", async () => {
        mockValidToken();
        supabase.auth.signInWithPassword.mockResolvedValue({ error: null });
        supabase.auth.updateUser.mockResolvedValue({ error: null });

        const res = await request(app)
            .put("/api/auth/change-password")
            .set("Authorization", "Bearer access-abc")
            .send({
                oldPassword: "old",
                newPassword: "new-1",
                confirmPassword: "new-1",
            });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "Password changed successfully" });
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: "manager@example.com",
            password: "old",
        });
        expect(supabase.auth.updateUser).toHaveBeenCalledWith({
            password: "new-1",
        });
    });
});
