import supabase from "../lib/supabase-client.js";
import prisma from "../lib/prisma.js";

// --- REGISTER ---
export const register = async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) return res.status(400).json({ error: error.message });

    await prisma.manager.create({
        data: {
            id_: data.user.id,
            email,
            firstname,
            lastname,
            middleInitial,
        },
    });

    res.json({ user: data.user });
};

// --- LOGIN ---
export const login = async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) return res.status(400).json({ error: error.message });

    // Session with access + refresh tokens
    const { session } = data;

    const manager = await prisma.manager.findUnique({
        where: { id_: data.user.id },
    });

    // Token Handling
    res.json({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        user: session.user,
        profile: manager,
    });
};

// --- REFRESH TOKEN ---
export const refreshToken = async (req, res) => {
    const { refresh_token } = req.body;

    const { data, error } = await supabase.auth.refreshSession({
        refresh_token,
    });

    if (error) return res.status(400).json({ error: error.message });

    // Token Handling
    res.json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        user: data.session.user,
    });
};

// --- CHANGE PASSWORD ---
export const changePassword = async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Validate new password and confirmation match
    if (newPassword !== confirmPassword) {
        return res
            .status(400)
            .json({ error: "New password and confirmation do not match" });
    }

    // Get the current user from the authenticate middleware
    const userEmail = req.user.user.email;

    // Verify the old password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: oldPassword,
    });

    if (verifyError) {
        return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (updateError) {
        return res.status(400).json({ error: updateError.message });
    }

    res.json({ message: "Password changed successfully" });
};

// --- LOGOUT ---
export const logout = async (req, res) => {
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Logged out successfully" });
};

// --- FORGOT PASSWORD ---
export const forgotPassword = async (req, res) => {
    const ORIGIN_URI = process.env.ORIGIN_URI || "http://localhost:3000";

    const { email } = req.body;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${ORIGIN_URI}/reset-password`,
    });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Password reset link sent to your email" });
};

// --- RESET PASSWORD ---
export const resetPassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body;

    // Validate new password and confirmation match
    if (newPassword !== confirmPassword) {
        return res
            .status(400)
            .json({ error: "New password and confirmation do not match" });
    }

    // Validate strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            error: "Password must be at least 8 characters long, contain uppercase and lowercase letters, a number, and a symbol.",
        });
    }

    // Update password (Supabase requires active session from reset link)
    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Password reset successfully" });
};
