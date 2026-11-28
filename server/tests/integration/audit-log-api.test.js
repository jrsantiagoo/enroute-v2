// /api/audit_log through the real Express app, Prisma mocked
// Titles that start with a case number (17-4) implement that case in the STSWENG automation test plan.
// Audit rows are written by a Postgres trigger, so cases about what gets recorded run in e2e-testing/auditLog.spec.ts.
// it.fails marks a case whose behavior issue #5 asks for but the code does not have yet. Remove it once the case passes.
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/lib/prisma.js", () => ({
    default: {
        audit_log: {
            findMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        manager: { findMany: vi.fn() },
        agent_profile: { create: vi.fn() },
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

const AUTH_HEADER = "Bearer good-token";
const MANAGER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const MANAGER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function row(overrides) {
    return {
        id: 1n,
        table_name: "vehicle",
        record_id: "11111111-1111-4111-8111-111111111111",
        action: "INSERT",
        old_data: null,
        new_data: { plate_number: "ABC 1234" },
        actor_id: MANAGER_A,
        created_at: new Date("2026-11-28T02:00:00Z"),
        ...overrides,
    };
}

// Applies the parts of a Prisma `where` the filters would use, so filtering in the query or in code both pass.
function findManyHonoringWhere(rows) {
    return async ({ where } = {}) =>
        rows.filter((r) => {
            if (!where) return true;
            if (where.actor_id && r.actor_id !== where.actor_id) return false;
            if (where.action && r.action !== where.action) return false;
            if (where.table_name && r.table_name !== where.table_name) return false;
            if (where.created_at?.gte && r.created_at < new Date(where.created_at.gte)) return false;
            if (where.created_at?.lte && r.created_at > new Date(where.created_at.lte)) return false;
            return true;
        });
}

beforeEach(() => {
    vi.resetAllMocks();
    supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: MANAGER_A } },
        error: null,
    });
    prisma.manager.findMany.mockResolvedValue([
        { id_: MANAGER_A, firstname: "Ana", lastname: "Reyes", email: "ana@example.com" },
        { id_: MANAGER_B, firstname: "Ben", lastname: "Cruz", email: "ben@example.com" },
    ]);
});

describe("GET /api/audit_log", () => {
    it("is mounted and returns entries in the success envelope", async () => {
        prisma.audit_log.findMany.mockResolvedValue([row()]);

        const res = await request(app).get("/api/audit_log").set("Authorization", AUTH_HEADER);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0]).toMatchObject({ id: 1, action: "INSERT", actor: { name: "Ana Reyes" } });
    });

    it("401s without a token", async () => {
        const res = await request(app).get("/api/audit_log");

        expect(res.status).toBe(401);
        expect(prisma.audit_log.findMany).not.toHaveBeenCalled();
    });

    it("17-9 lists entries newest first", async () => {
        prisma.audit_log.findMany.mockResolvedValue([]);

        await request(app).get("/api/audit_log").set("Authorization", AUTH_HEADER);

        expect(prisma.audit_log.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ orderBy: { created_at: "desc" } }),
        );
    });

    // Issue #5: the object is shown by type and name/ID, e.g. "Driver: D-01". Drivers have no name column, so the driver ID is used.
    it.fails("17-3 records archiving a driver as Archived, Driver: <driver ID>", async () => {
        prisma.audit_log.findMany.mockResolvedValue([
            row({
                table_name: "agent_profile",
                action: "UPDATE",
                old_data: { driver_id: "D-01", archived_at: null },
                new_data: { driver_id: "D-01", archived_at: "2026-11-28T02:00:00Z" },
            }),
        ]);

        const res = await request(app).get("/api/audit_log").set("Authorization", AUTH_HEADER);

        expect(res.body.data[0].details).toMatch(/^Archived/);
        expect(res.body.data[0].details).toContain("Driver: D-01");
    });

    // Issue #5: the global log can be filtered by user, action type, object type and date range.
    it.fails("17-10 filters by user, action, object type and date range", async () => {
        const match = row({
            id: 1n,
            table_name: "agent_profile",
            action: "UPDATE",
            old_data: { driver_id: "D-01", archived_at: null },
            new_data: { driver_id: "D-01", archived_at: "2026-11-26T02:00:00Z" },
            created_at: new Date("2026-11-26T02:00:00Z"),
        });
        prisma.audit_log.findMany.mockImplementation(
            findManyHonoringWhere([
                match,
                row({ id: 2n, actor_id: MANAGER_B, table_name: "agent_profile", action: "UPDATE", old_data: {}, new_data: { driver_id: "D-02" }, created_at: new Date("2026-11-26T03:00:00Z") }),
                row({ id: 3n, table_name: "vehicle", action: "UPDATE", old_data: {}, new_data: { plate_number: "XYZ 9" }, created_at: new Date("2026-11-26T04:00:00Z") }),
                row({ id: 4n, table_name: "agent_profile", action: "INSERT", new_data: { driver_id: "D-03" }, created_at: new Date("2026-11-26T05:00:00Z") }),
                row({ id: 5n, table_name: "agent_profile", action: "UPDATE", old_data: {}, new_data: { driver_id: "D-04" }, created_at: new Date("2026-11-10T02:00:00Z") }),
            ]),
        );

        const res = await request(app)
            .get("/api/audit_log")
            .query({ user: MANAGER_A, action: "UPDATE", objectType: "agent_profile", from: "2026-11-23", to: "2026-11-29" })
            .set("Authorization", AUTH_HEADER);

        expect(res.status).toBe(200);
        expect(res.body.data.map((e) => e.id)).toEqual([1]);
    });
});

describe("audit entries are read-only", () => {
    it("17-5 rejects editing an entry", async () => {
        const res = await request(app)
            .put("/api/audit_log/1")
            .set("Authorization", AUTH_HEADER)
            .send({ action: "Changed" });

        expect([404, 405]).toContain(res.status);
        expect(prisma.audit_log.update).not.toHaveBeenCalled();
    });

    it("17-6 rejects deleting an entry", async () => {
        const res = await request(app).delete("/api/audit_log/1").set("Authorization", AUTH_HEADER);

        expect([404, 405]).toContain(res.status);
        expect(prisma.audit_log.delete).not.toHaveBeenCalled();
    });
});

describe("failed saves", () => {
    // The trigger only fires on a row write, so a request that never writes cannot produce an entry.
    it("17-4 writes no entry when a save fails", async () => {
        const res = await request(app).post("/api/drivers").set("Authorization", AUTH_HEADER).send({});

        expect(res.status).toBe(400);
        expect(prisma.agent_profile.create).not.toHaveBeenCalled();
    });
});
