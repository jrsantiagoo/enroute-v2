// Titles that start with a case number (17-7) implement that case in the STSWENG automation test plan.
// it.fails marks a case whose behavior issue #5 asks for but the code does not have yet. Remove it once the case passes.
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma.js", () => ({
    default: {
        audit_log: { findMany: vi.fn() },
        manager: { findMany: vi.fn() },
        agent_profile: { findMany: vi.fn() },
    },
}));

import prisma from "../../src/lib/prisma.js";
import { getAuditLog } from "../../src/services/audit-log-service.js";

const DRIVER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DRIVER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

beforeEach(() => {
    vi.resetAllMocks();
    prisma.manager.findMany.mockResolvedValue([]);
    prisma.agent_profile.findMany.mockResolvedValue([
        { id_: DRIVER_A, driver_id: "D-01" },
        { id_: DRIVER_B, driver_id: "D-02" },
    ]);
});

describe("getAuditLog", () => {
    it("17-7 labels an entry with no signed-in user as System", async () => {
        prisma.audit_log.findMany.mockResolvedValue([
            {
                id: 7n,
                table_name: "trip",
                record_id: "t-1",
                action: "UPDATE",
                old_data: { status: "PENDING" },
                new_data: { status: "PROCESSING" },
                actor_id: null,
                created_at: new Date("2026-11-28T02:00:00Z"),
            },
        ]);

        const [entry] = await getAuditLog();

        expect(entry.actor).toEqual({ id: null, name: "System", email: null });
    });

    // Issue #5: edits name the field and show old and new values, e.g. "Edited Assigned Driver: Juan Dela Cruz → Maria Santos".
    // Drivers have no name column, so the driver ID stands in for the name.
    it.fails("17-2 records the old and new value of an edit in plain language", async () => {
        prisma.audit_log.findMany.mockResolvedValue([
            {
                id: 2n,
                table_name: "trip",
                record_id: "t-1",
                action: "UPDATE",
                old_data: { driver_id_: DRIVER_A },
                new_data: { driver_id_: DRIVER_B },
                actor_id: null,
                created_at: new Date("2026-11-28T02:00:00Z"),
            },
        ]);

        const [entry] = await getAuditLog();

        expect(entry.details).toBe("Edited Assigned Driver: D-01 → D-02");
    });
});
