"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import AuthShell from "@/components/auth/auth-shell";
import { forgotPassword } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (!email) {
            setError("Email is required");
            return;
        }

        setLoading(true);
        try {
            const result = await forgotPassword(email);
            if (result.error) {
                setError(result.error);
                setLoading(false);
                return;
            }
            setSent(true);
        } catch (err) {
            console.log("Forgot password error:", err);
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <AuthShell>
            <h1 className="text-3xl font-bold text-foreground">
                {sent ? "Check your email" : "Forgot password?"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                {sent
                    ? `We sent a password reset link to ${email}. Click the link in the email to set a new password.`
                    : "Enter the email address associated with your account and we'll send you a link to reset your password."}
            </p>

            {sent ? (
                <div className="mt-8 flex flex-col gap-5">
                    <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/40">
                        <Mail
                            size={20}
                            className="mt-0.5 text-green-600 dark:text-green-400"
                        />
                        <div className="text-sm text-green-700 dark:text-green-300">
                            If an account exists for{" "}
                            <span className="font-semibold">{email}</span>, a
                            reset link is on its way. Check your inbox (and spam
                            folder).
                        </div>
                    </div>
                    <Link
                        href="/"
                        className="w-full rounded-lg bg-blue-700 py-3 text-center font-semibold text-white transition hover:bg-blue-800"
                    >
                        Back to login
                    </Link>
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="mt-8 flex flex-col gap-5"
                >
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="email"
                            className="text-sm font-semibold text-gray-700 dark:text-slate-300"
                        >
                            Email Address
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-slate-500">
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect
                                        x="2"
                                        y="4"
                                        width="20"
                                        height="16"
                                        rx="2"
                                    />
                                    <path d="m2 7 10 6 10-6" />
                                </svg>
                            </span>
                            <input
                                id="email"
                                type="email"
                                placeholder="admin@acesoft.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2.5 pl-10 pr-4 text-gray-800 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                            />
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
                        {loading ? "Sending..." : "Send reset link"}
                    </button>

                    <p className="text-center text-sm text-gray-500 dark:text-slate-400">
                        Remembered your password?{" "}
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
