"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Map,
    ClipboardList,
    Van,
    Gauge,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    noTransition?: boolean;
}

const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/route-tool", label: "Routing Tool", icon: Map },
    { href: "/assignment", label: "Assignment", icon: ClipboardList },
    { href: "/fleet-management", label: "Fleet Management", icon: Van },
];

export default function Sidebar({
    collapsed,
    onToggle,
    noTransition,
}: SidebarProps) {
    const pathname = usePathname();

    return (
        <div
            className={`fixed top-0 left-0 h-screen z-30
                ${collapsed ? "w-20" : "w-64"} 
                bg-background border-r border-border font-semibold 
                ${noTransition ? "transition-none" : "transition-[width] duration-300"}`}
        >
            {/* Route Management Tool Version Text */}
            <div
                className={`flex items-center gap-3 h-16 border-b border-border ${collapsed ? "justify-center" : "gap-3"}`}
            >
                <div className="flex items-center justify-center rounded-xl w-10 h-10 m-4 bg-linear-to-l from-cyan-400 to-teal-300">
                    <Gauge size={21} className="text-background" />
                </div>

                {!collapsed && (
                    <div className="-ml-4">
                        <p className="text-sm font-bold text-foreground">
                            EnRoute
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            Version 1.0
                        </p>
                    </div>
                )}
            </div>

            {/* Creates Navigation Links */}
            <div className="flex flex-col gap-2 ml-2 mr-2 p-2 pt-4 pb-5 flex-1 border-b border-border">
                {navLinks.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 rounded-md p-3 text-sm transition duration-100
                                ${active ? "bg-primary text-primary-foreground" : "hover:bg-secondary dark:hover:text-primary"}
                                ${collapsed ? "justify-center" : ""}`}
                            title={collapsed ? label : undefined}
                        >
                            <Icon size={17} />
                            {!collapsed && <span>{label}</span>}
                        </Link>
                    );
                })}
            </div>

            {/* Allows user to collapse sidebar */}
            <div className="flex justify-center">
                <button
                    onClick={onToggle}
                    className="absolute -right-3 top-70 flex items-center justify-center 
                        w-8 h-8 rounded-full border border-border bg-background
                        hover:bg-secondary dark:hover:text-primary transition duration-300"
                >
                    {collapsed ? (
                        <ChevronsRight size={20} />
                    ) : (
                        <ChevronsLeft size={20} />
                    )}
                </button>
            </div>
        </div>
    );
}
