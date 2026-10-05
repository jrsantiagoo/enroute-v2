import "../env.js";

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const prisma = new PrismaClient();

// --- SET THE USER TO DELETE ---
const EMAIL_TO_DELETE = "[INSERT EMAIL]";
// -------------------------------

async function main() {
    console.log(`Deleting user: ${EMAIL_TO_DELETE}`);

    // Find the manager record first to get their Supabase user id
    const manager = await prisma.manager.findUnique({
        where: { email: EMAIL_TO_DELETE },
    });

    if (!manager) {
        console.error("No manager found with that email in the DB.");
        process.exit(1);
    }

    // Delete from Prisma/DB
    await prisma.manager.delete({
        where: { id_: manager.id_ },
    });
    console.log("Deleted manager profile from DB.");

    // Delete from Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(manager.id_);

    if (error) {
        console.error("Supabase error deleting user:", error.message);
        process.exit(1);
    }

    console.log("Deleted user from Supabase Auth.");
}

main()
    .catch((err) => {
        console.error("Unexpected error:", err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
