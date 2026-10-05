import prisma from "../lib/prisma.js";

export async function getAllManagers() {
    return prisma.manager.findMany({
        orderBy: { lastname: "asc" },
    });
}

export async function getMe(iD) {
    const manager = await prisma.manager.findUnique({
        where: { id_: iD },
    });

    if (!manager) throw new Error("Manager not found");

    return manager;
}
