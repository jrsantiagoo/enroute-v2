import prisma from "../lib/prisma.js";

const IGNORED = new Set(["updated_at", "created_at"]);

function describe({ action, table_name, old_data, new_data }) {
    const row = new_data ?? old_data;
    const name =
        row.plate_number ??
        row.driver_id ??
        row.order_id ??
        row.name ??
        "record";

    if (action === "INSERT") return `Created ${table_name} ${name}.`;
    if (action === "DELETE") return `Deleted ${table_name} ${name}.`;

    // Soft deletes arrive as UPDATEs
    if (!old_data.archived_at && new_data.archived_at)
        return `Archived ${table_name} ${name}.`;
    if (old_data.archived_at && !new_data.archived_at)
        return `Restored ${table_name} ${name}.`;
    if (!old_data.deleted_at && new_data.deleted_at)
        return `Deleted ${table_name} ${name}.`;

    const changes = Object.keys(new_data)
        .filter(
            (k) =>
                !IGNORED.has(k) &&
                JSON.stringify(old_data[k]) !== JSON.stringify(new_data[k]),
        )
        .map(
            (k) => `${k}: ${old_data[k] ?? "none"} → ${new_data[k] ?? "none"}`,
        );

    return `Updated ${table_name} ${name} (${changes.join(", ")}).`;
}

export async function getAuditLog() {
    const rows = await prisma.audit_log.findMany({
        orderBy: { created_at: "desc" },
    });

    const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))];
    const managers = await prisma.manager.findMany({
        where: { id_: { in: actorIds } },
        select: { id_: true, firstname: true, lastname: true, email: true },
    });
    const managerById = new Map(managers.map((m) => [m.id_, m]));

    return rows.map((r) => {
        const m = managerById.get(r.actor_id);
        return {
            ...r,
            id: Number(r.id),
            actor: r.actor_id
                ? {
                      id: r.actor_id,
                      name: m ? `${m.firstname} ${m.lastname}` : "Unknown user",
                      email: m?.email ?? null,
                  }
                : { id: null, name: "System", email: null },
            details: describe(r),
        };
    });
}
