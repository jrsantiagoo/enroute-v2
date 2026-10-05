"use client";

import { createPortal } from "react-dom";
import {
    forwardRef,
    useLayoutEffect,
    useState,
    type ReactNode,
    type RefObject,
} from "react";
import type { MenuAnchor } from "@/lib/hooks/useTableActionsMenu";

export interface ActionItem {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    variant?: "default" | "danger";
}

interface TableActionsMenuProps {
    actions: ActionItem[];
    anchor: MenuAnchor;
}

export const TableActionsMenu = forwardRef<
    HTMLDivElement,
    TableActionsMenuProps
>(({ actions, anchor }, ref) => {
    // Prevents menu from clipping by overflow by rendering in a portal
    // with fixed viewport positioning
    const [top, setTop] = useState<number | null>(null);

    useLayoutEffect(() => {
        const el = (ref as RefObject<HTMLDivElement>).current;
        if (!el) return;
        const { height } = el.getBoundingClientRect();
        // Adjusts widget location (down/up) if widget overflows the bottom of the viewport
        const down = anchor.bottom + 4;
        if (down + height > window.innerHeight - 8) {
            const above = anchor.top - 4 - height;
            if (above >= 0) {
                setTop(above);
                return;
            }
        }
        setTop(down);
    }, [anchor, ref]);

    return createPortal(
        <div
            ref={ref}
            style={{
                position: "fixed",
                top: top ?? anchor.bottom + 4,
                right: window.innerWidth - anchor.right + 20,
            }}
            className="w-44 bg-card border border-border rounded-lg shadow-sm shadow-muted-foreground z-50 px-1 py-1"
        >
            {actions.map((a) => (
                <button
                    key={a.label}
                    onClick={a.onClick}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition
                            ${
                                a.variant === "danger"
                                    ? "text-red-500 hover:bg-secondary hover:text-red-600"
                                    : "text-foreground hover:bg-secondary hover:text-primary-foreground dark:hover:text-primary"
                            }`}
                >
                    {a.icon}
                    {a.label}
                </button>
            ))}
        </div>,
        document.body,
    );
});

TableActionsMenu.displayName = "TableActionsMenu";
