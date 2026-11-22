import { PrismaClient } from "../generated/prisma/client.ts";
import { getActorId } from "./audit-context.js";

export const prismaBase = new PrismaClient();

const WRITE_OPS = new Set([
    "create",
    "createMany",
    "createManyAndReturn",
    "update",
    "updateMany",
    "updateManyAndReturn",
    "upsert",
    "delete",
    "deleteMany",
]);

const prisma = prismaBase.$extends({
    query: {
        $allModels: {
            async $allOperations({ operation, args, query }) {
                const actorId = getActorId();
                // Reads, or no logged-in user (cron, scripts): run normally
                if (!actorId || !WRITE_OPS.has(operation)) return query(args);

                const [, result] = await prismaBase.$transaction([
                    prismaBase.$executeRaw`select set_config('app.user_id', ${actorId}, true)`,
                    query(args),
                ]);
                return result;
            },
        },
    },
});

export default prisma;

// For interactive transactions: set the actor once at the start
export function auditedTransaction(fn) {
    return prismaBase.$transaction(async (tx) => {
        const actorId = getActorId();
        if (actorId) {
            await tx.$executeRaw`select set_config('app.user_id', ${actorId}, true)`;
        }
        return fn(tx);
    });
}
