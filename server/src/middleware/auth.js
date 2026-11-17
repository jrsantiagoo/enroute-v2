import supabase from "../lib/supabase-client.js";
import { auditContext } from "../lib/audit-context.js";

// --- AUTHENTICATE ---
export const authenticate = async (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ error: "Authorization header missing or malformed" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data?.user)
            return res.status(403).json({ error: "Invalid or expired token" });

        req.user = data; // same shape as before, so req.user.user.email still works
        auditContext.run({ userId: data.user.id }, next);
    } catch (err) {
        res.status(500).json({ error: "Server error during authentication" });
    }
};
