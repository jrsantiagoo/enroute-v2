"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ShieldAlert } from "lucide-react";
import AuthShell from "@/components/auth/auth-shell";
import { resetPassword } from "@/lib/api/auth";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [token, setToken] = useState("");
    const [tokenMissing, setTokenMissing] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // The reset link from the email carries the token in the URL. Supabase
    // sends it as a hash fragment (e.g. #access_token=...&type=recovery), so we
    // read from both the fragment and the query string for flexibility.
    useEffect(() => {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        const accessToken =
            hashParams.get("access_token") ||
            queryParams.get("access_token") ||
            queryParams.get("token") ||
            "";
        setToken(accessToken);
        if (!accessToken) {
            setTokenMissing(true);
            setError(
                "This reset link is invalid or expired. Please request a new one.",
            );
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (!token) {
            setError(
                "This reset link is invalid or expired. Please request a new one.",
            );
            return;
        }

        if (!newPassword) {
            setError("New password is required");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const result = await resetPassword(
                token,
                newPassword,
                confirmPassword,
            );
            if (result.error) {
                setError(result.error);
                setLoading(false);
                return;
            }
            router.push("/");
        } catch (err) {
            console.log("Reset password error:", err);
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <AuthShell>
            <h1 className="text-3xl font-bold text-foreground">
                Change password
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                {tokenMissing
                    ? "The reset link is invalid or expired."
                    : "Choose a new password for your account."}
            </p>

            {tokenMissing ? (
                <div className="mt-8 flex flex-col gap-5">
                    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
                        <ShieldAlert
                            size={20}
                            className="mt-0.5 text-red-600 dark:text-red-400"
                        />
                        <div className="text-sm text-red-700 dark:text-red-300">
                            This reset link is invalid or expired. Please
                            request a new one from the login page.
                        </div>
                    </div>
                    <Link
                        href="/forgot-password"
                        className="w-full rounded-lg bg-blue-700 py-3 text-center font-semibold text-white transition hover:bg-blue-800"
                    >
                        Request a new link
                    </Link>
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="mt-8 flex flex-col gap-5"
                >
                    {/* New Password Input */}
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="new-password"
                            className="text-sm font-semibold text-gray-700 dark:text-slate-300"
                        >
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                id="new-password"
                                type={showNewPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) =>
                                    setNewPassword(e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2.5 pl-4 pr-10 text-gray-800 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowNewPassword(!showNewPassword)
                                }
                                aria-label={
                                    showNewPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                            >
                                {showNewPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Confirm New Password Input */}
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="confirm-password"
                            className="text-sm font-semibold text-gray-700 dark:text-slate-300"
                        >
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                id="confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2.5 pl-4 pr-10 text-gray-800 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                aria-label={
                                    showConfirmPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm font-medium text-red-500">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 w-full rounded-lg bg-blue-700 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>

                    <p className="text-center text-sm text-gray-500 dark:text-slate-400">
                        <Link
                            href="/"
                            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                            Back to login
                        </Link>
                    </p>
                </form>
            )}
        </AuthShell>
    );
}
