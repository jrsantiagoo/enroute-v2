import prisma from "../lib/prisma.js";

export async function getAuditLog() {
    const rows = await prisma.audit_log.findMany({
        orderBy: { created_at: "desc" },
    });
    return rows.map((r) => ({ ...r, id: parseInt(r.id) }));
}
