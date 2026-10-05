"use client";

import { useTheme } from "@/lib/theme-context";

interface AuthShellProps {
    children: React.ReactNode;
}

// Shared shell for standalone (non-protected) auth pages. Mirrors the styling
// of the login page: brand panel, card container, and dark mode toggle.
export default function AuthShell({ children }: AuthShellProps) {
    const { theme, toggleTheme } = useTheme();

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
                        <span className="font-semibold">Route Management</span>
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
                        <span>ROUTE MANAGEMENT TOOL</span>
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

                    {children}
                </div>
            </div>
        </div>
    );
}
