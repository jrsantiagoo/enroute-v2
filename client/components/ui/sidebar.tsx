"use client";

import { usePathname } from "next/navigation";
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
        <aside
            className={`fixed top-0 left-0 h-screen z-30 flex flex-col justify-between
                ${collapsed ? "w-20" : "w-64"} 
                bg-background border-r border-border font-semibold 
                ${noTransition ? "transition-none" : "transition-[width] duration-300"}`}
        >
            {/* Top Section: Brand & Nav Links */}
            <div className="flex flex-col flex-1 min-h-0">
                {/* Brand Header */}
                <div
                    className={`flex items-center h-16 shrink-0 border-b border-border ${
                        collapsed ? "justify-center" : "gap-3 px-4"
                    }`}
                >
                    <div className="flex items-center justify-center rounded-xl w-10 h-10 bg-linear-to-l from-cyan-400 to-teal-300 shrink-0">
                        <Gauge size={21} className="text-background" />
                    </div>

                    {!collapsed && (
                        <div className="flex flex-col">
                            <p className="text-sm font-bold text-foreground leading-tight">
                                EnRoute
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                Version 1.0
                            </p>
                        </div>
                    )}
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col gap-1.5 p-3 flex-1 overflow-y-auto">
                    {navLinks.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 rounded-md p-3 text-sm transition duration-150
                                    ${
                                        active
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    }
                                    ${collapsed ? "justify-center px-0" : ""}`}
                                title={collapsed ? label : undefined}
                            >
                                <Icon size={18} className="shrink-0" />
                                {!collapsed && <span className="truncate">{label}</span>}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Section: Collapse / Expand Button */}
            <div className="p-3 border-t border-border shrink-0">
                <button
                    onClick={onToggle}
                    className={`flex items-center gap-3 w-full rounded-md p-2.5 text-sm font-medium text-muted-foreground 
                        hover:bg-secondary hover:text-foreground transition duration-150 cursor-pointer
                        ${collapsed ? "justify-center px-0" : ""}`}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? (
                        <ChevronsRight size={18} className="shrink-0" />
                    ) : (
                        <>
                            <ChevronsLeft size={18} className="shrink-0" />
                            <span className="truncate">Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}