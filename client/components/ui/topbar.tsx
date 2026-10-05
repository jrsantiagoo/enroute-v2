"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import {
    Sun,
    Moon,
    User,
    LogOut as LogOutIcon,
    ChevronDown,
} from "lucide-react";
import * as authApi from "@/lib/api/auth";
import * as managerApi from "@/lib/api/manager";

interface TopbarProps {
    sidebarCollapsed: boolean;
}

export default function Topar({ sidebarCollapsed }: TopbarProps) {
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const [name, setName] = useState("");
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    async function fetchProfile() {
        const accessToken = localStorage.getItem("access_token");

        if (!accessToken) {
            router.push("/");
            return;
        }

        const data = await managerApi.getProfile(accessToken);

        if (data.success) {
            const { firstname, lastname } = data.data;
            setName(`${firstname} ${lastname}`);
        } else {
            router.push("/");
        }
    }

    useEffect(() => {
        fetchProfile();
    }, []);

    /* Closes dropdown on click */
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        }

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    async function handleLogout() {
        await authApi.logout();

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        router.push("/");
    }

    return (
        <header
            className={`fixed top-0 right-0 h-16
                ${sidebarCollapsed ? "left-20" : "left-64"} 
                flex items-center justify-between px-6 bg-background border-b border-border z-20 transition-[left] duration-300`}
        >
            <div className="text-foreground text-left"></div>

            <div className="flex items-center gap-3">
                {/* Allows user to toggle themes */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-md hover:bg-secondary dark:hover:text-primary transition duration-300"
                    title={theme === "light" ? "Dark mode" : "Light mode"}
                >
                    {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
                </button>

                {/* User's profile */}
                <div className="relative min-w-40 rounded-lg" ref={ref}>
                    <button
                        onClick={() => setOpen((p) => !p)}
                        className="flex min-w-40 items-center gap-2 p-1.5 rounded-lg hover:bg-secondary transition group"
                    >
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <User size={16} className="text-foreground" />
                        </div>
                        <span className="max-w-28 text-sm font-medium text-foreground dark:group-hover:text-primary truncate">
                            {name || "User"}
                        </span>
                        <ChevronDown
                            size={16}
                            className={`text-muted-foreground dark:group-hover:text-primary transition ${open ? "rotate-180" : ""}`}
                        />
                    </button>

                    {/* Toggles dropdown */}
                    {open && (
                        <div
                            className="absolute right-0 mt-2 py-1 w-44 bg-card 
                                border border-border rounded-md shadow shadow-muted-foreground"
                        >
                            <div className="items-center gap-2 w-full px-4 py-2 font-[550] text-sm text-foreground border-b border-border">
                                My Account
                            </div>

                            <div className="flex m-1">
                                <button
                                    onClick={() => {
                                        router.push("/profile");
                                        setOpen(false);
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground 
                                        hover:bg-secondary dark:hover:text-primary rounded-lg"
                                >
                                    <User size={16} />
                                    Profile
                                </button>
                            </div>

                            <div className="flex ml-1 mr-1">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground 
                                        hover:bg-secondary dark:hover:text-primary rounded-lg"
                                >
                                    <LogOutIcon size={16} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
