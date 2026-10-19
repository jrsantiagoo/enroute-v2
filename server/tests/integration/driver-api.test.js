// /api/drivers through the real Express app, Prisma mocked
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/lib/prisma.js", () => ({
    default: {
        agent_profile: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
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

const DRIVER_UUID = "11111111-1111-4111-8111-111111111111";
const AUTH_HEADER = "Bearer good-token";

describe("GET /api/drivers/:id", () => {
    it("400s on a malformed id", async () => {
        const res = await request(app).get("/api/drivers/not-a-uuid").set("Authorization", AUTH_HEADER);

        expect(res.status).toBe(400);
    });

    it("404s when the driver does not exist", async () => {
        prisma.agent_profile.findUnique.mockResolvedValue(null);

        const res = await request(app).get(`/api/drivers/${DRIVER_UUID}`).set("Authorization", AUTH_HEADER);

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ message: "Driver not found" });
    });
});

describe("POST /api/drivers", () => {
    it("400s when driver_id is missing", async () => {
        const res = await request(app).post("/api/drivers").set("Authorization", AUTH_HEADER).send({});

        expect(res.status).toBe(400);
        expect(prisma.agent_profile.create).not.toHaveBeenCalled();
    });

    it("creates a driver and returns 201", async () => {
        const driver = { id_: DRIVER_UUID, driver_id: "D-01" };
        prisma.agent_profile.create.mockResolvedValue(driver);

        const res = await request(app)
            .post("/api/drivers")
            .set("Authorization", AUTH_HEADER)
            .send({ driver_id: "D-01" });

        expect(res.status).toBe(201);
        expect(res.body).toEqual({ success: true, data: driver });
    });

    it("409s on a duplicate driver_id", async () => {
        prisma.agent_profile.create.mockRejectedValue({ code: "P2002" });

        const res = await request(app)
            .post("/api/drivers")
            .set("Authorization", AUTH_HEADER)
            .send({ driver_id: "D-01" });

        expect(res.status).toBe(409);
    });
});

describe("PUT /api/drivers/:id", () => {
    it("400s when no updatable fields are sent", async () => {
        const res = await request(app)
            .put(`/api/drivers/${DRIVER_UUID}`)
            .set("Authorization", AUTH_HEADER)
            .send({});

        expect(res.status).toBe(400);
    });

    it("updates the driver", async () => {
        const driver = { id_: DRIVER_UUID, license_number: "L-1" };
        prisma.agent_profile.findUnique.mockResolvedValue(driver);
        prisma.agent_profile.update.mockResolvedValue(driver);

        const res = await request(app)
            .put(`/api/drivers/${DRIVER_UUID}`)
            .set("Authorization", AUTH_HEADER)
            .send({ license_number: "L-1" });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, data: driver });
    });
});

describe("DELETE /api/drivers/:id", () => {
    it("soft deletes by setting archived_at", async () => {
        const driver = { id_: DRIVER_UUID, archived_at: null };
        prisma.agent_profile.findUnique.mockResolvedValue(driver);
        prisma.agent_profile.update.mockResolvedValue({ ...driver, archived_at: "now" });

        const res = await request(app).delete(`/api/drivers/${DRIVER_UUID}`).set("Authorization", AUTH_HEADER);

        expect(res.status).toBe(200);
        expect(prisma.agent_profile.delete).not.toHaveBeenCalled();
    });

    it("404s for an unknown driver", async () => {
        prisma.agent_profile.findUnique.mockResolvedValue(null);

        const res = await request(app).delete(`/api/drivers/${DRIVER_UUID}`).set("Authorization", AUTH_HEADER);

        expect(res.status).toBe(404);
    });
});

describe("PATCH /api/drivers/:id/unarchive", () => {
    it("restores an archived driver", async () => {
        prisma.agent_profile.findUnique.mockResolvedValue({ id_: DRIVER_UUID, archived_at: new Date() });
        prisma.agent_profile.update.mockResolvedValue({ id_: DRIVER_UUID, archived_at: null });

        const res = await request(app)
            .patch(`/api/drivers/${DRIVER_UUID}/unarchive`)
            .set("Authorization", AUTH_HEADER);

        expect(res.status).toBe(200);
    });
});
