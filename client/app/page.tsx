"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api/apiCall";
import * as authApi from "@/lib/api/auth";
import { useTheme } from "@/lib/theme-context";

//login page with email and password fields, error handling, and loading state. On successful login, navigate to dashboard page
export default function loginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!email && !password) {
            setError("Email and password are required");
            setLoading(false);
            return;
        }

        if (!email) {
            setError("Email is required");
            setLoading(false);
            return;
        }

        if (!password) {
            setError("Password is required");
            setLoading(false);
            return;
        }

        // connect to backend and get access token and refresh token, then store them in local storage
        try {
            /*
            const response = await apiCall("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || "Login failed");
                setLoading(false);
                return;
            }

            const { access_token, refresh_token } = await response.json();

            // Store tokens
            localStorage.setItem("access_token", access_token);
            localStorage.setItem("refresh_token", refresh_token);
            */
            const data = await authApi.login(email, password);

            if (data.error) {
                setError(data.error || "Login Failed");
                setLoading(false);
                return;
            }

            const { access_token, refresh_token } = data;

            // Store tokens
            localStorage.setItem("access_token", access_token);
            localStorage.setItem("refresh_token", refresh_token);

            router.push("/dashboard");
        } catch (err) {
            console.log("Login error:", err);
            setError("Network error");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 transition-colors dark:bg-slate-950">
            <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-gray-400/40 transition-colors dark:bg-slate-900 dark:shadow-black/40 md:grid-cols-2">
                {/* Brand panel */}
                <div className="relative hidden flex-col justify-between bg-linear-to-br from-slate-900 via-slate-900 to-slate-800 p-10 text-white md:flex">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                        </div>
                        <span className="font-semibold">EnRoute</span>
                    </div>

                    <div>
                        <h2 className="text-5xl font-bold leading-tight">
                            <span className="bg-linear-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">
                                Simplify
                            </span>{" "}
                            every route.
                        </h2>
                        <p className="mt-4 max-w-xs text-sm text-slate-400">
                            Plan stops, compare route options, and organize
                            deliveries in one easy-to-use workspace.
                        </p>
                    </div>

                    <div className="flex items-center justify-between text-xs tracking-[0.2em] text-slate-500">
                        <span>ENROUTE</span>
                        <span>V1</span>
                    </div>
                </div>

                {/* Form panel */}
                <div className="relative flex flex-col justify-center p-8 sm:p-12">
                    {/* Dark mode toggle */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label="Toggle dark mode"
                        className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        {theme === "dark" ? (
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="12" cy="12" r="5" />
                                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                            </svg>
                        ) : (
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        )}
                    </button>

                    <h1 className="text-3xl font-bold text-foreground">
                        Welcome
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                        Please enter your credentials to access your dashboard.
                    </p>

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

                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-semibold text-gray-700 dark:text-slate-300"
                                >
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2.5 pl-4 pr-10 text-gray-800 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                                >
                                    {showPassword ? (
                                        <svg
                                            className="h-5 w-5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line
                                                x1="1"
                                                y1="1"
                                                x2="23"
                                                y2="23"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="h-5 w-5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
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
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
