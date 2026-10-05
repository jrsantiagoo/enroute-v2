import "../env.js";

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const prisma = new PrismaClient();

// --- INSERT PROFILE VALUES HERE ---
const MANAGER = {
    email: " ",
    password: " ",
    firstname: " ",
    lastname: " ",
    middleInitial: "",
};
// ---------------------------

async function main() {
    console.log(`Registering manager: ${MANAGER.email}`);

    // Create user in supabase
    const { data, error } = await supabase.auth.admin.createUser({
        email: MANAGER.email,
        password: MANAGER.password,
        email_confirm: true, // skips email verification
    });

    if (error) {
        console.error("Supabase error:", error.message);
        process.exit(1);
    }

    const supabaseUserId = data.user.id;
    console.log(`Supabase user created: ${supabaseUserId}`);

    // Create manager profile in DB
    const manager = await prisma.manager.create({
        data: {
            id_: supabaseUserId,
            email: MANAGER.email,
            firstname: MANAGER.firstname,
            lastname: MANAGER.lastname,
            middleInitial: MANAGER.middleInitial,
        },
    });

    console.log("Manager profile created:", manager);
}

main()
    .catch((err) => {
        console.error("Unexpected error:", err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
