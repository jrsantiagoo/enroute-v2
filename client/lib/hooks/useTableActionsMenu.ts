"use client";

import {
    useEffect,
    useRef,
    useState,
    type MouseEvent as ReactMouseEvent,
} from "react";

export interface MenuAnchor {
    top: number;
    bottom: number;
    right: number;
}

// Used for a table's Actions Menu pop-up
export function useTableActionsMenu() {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Opens the menu for a row, records the viewport of button
    // to anchor the portaled menu to it
    function openMenu(id: string, e: ReactMouseEvent<HTMLElement>) {
        if (activeMenu === id) {
            setActiveMenu(null);
            setAnchor(null);
            return;
        }
        const r = e.currentTarget.getBoundingClientRect();
        setAnchor({ top: r.top, bottom: r.bottom, right: r.right });
        setActiveMenu(id);
    }

    useEffect(() => {
        function closeMenu() {
            setActiveMenu(null);
            setAnchor(null);
        }

        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node))
                closeMenu();
        }

        document.addEventListener("mousedown", handleClick);
        // The menu is fixed to the viewport
        window.addEventListener("resize", closeMenu);
        window.addEventListener("scroll", closeMenu, true);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            window.removeEventListener("resize", closeMenu);
            window.removeEventListener("scroll", closeMenu, true);
        };
    }, []);

    return { activeMenu, setActiveMenu, anchor, menuRef, openMenu };
}
