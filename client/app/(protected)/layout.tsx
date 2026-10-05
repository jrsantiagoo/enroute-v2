"use client";

import { useEffect, useState } from "react";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";
import Sidebar from "@/components/ui/sidebar";
import Topbar from "@/components/ui/topbar";

let cachedCollapsed: boolean | null = null;

// This layout wraps all protected pages (Dashboard, Route Tool, Assignment).
export default function protectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed, ready] = usePersistedState(
        "sidebar_collapsed",
        false,
    );
    const [noTransition, setNoTransition] = useState(true);

    // Disables CCS transition when first rendered
    // removes sidebar flash when page reloads
    useEffect(() => {
        requestAnimationFrame(() => setNoTransition(false));
    }, []);

    return (
        <div>
            <Sidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed((c) => !c)}
            />
            <Topbar sidebarCollapsed={collapsed} />
            <main
                className={`${collapsed ? "ml-20" : "ml-64"}
                    min-h-screen p-8 pt-23 bg-background text-foreground 
                    ${noTransition ? "transition-none" : "transition-[margin-left] duration-300"}`}
            >
                {children}
            </main>
        </div>
    );
}
