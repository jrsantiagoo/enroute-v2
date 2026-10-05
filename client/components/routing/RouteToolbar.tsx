"use client";

import { useTheme } from "@/lib/theme-context";
import { DARK } from "./routeTheme";

interface RouteToolbarProps {
    isEditMode: boolean;
    onToggleEdit: () => void;
    onSuggestRoutes: () => void;
    onSave: () => void;
    canSave: boolean;
}

export default function RouteToolbar({
    isEditMode,
    onToggleEdit,
    onSuggestRoutes,
    onSave,
    canSave,
}: RouteToolbarProps) {
    const { theme } = useTheme();
    const dark = theme === "dark";

    const baseBtn: React.CSSProperties = {
        padding: "6px 16px",
        border: `1px solid ${dark ? DARK.btnBorder : "#d1d5db"}`,
        borderRadius: "4px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        background: dark ? DARK.btnBg : "#fff",
        color: dark ? DARK.btnText : "#374151",
        transition: "background 0.15s",
    };

    // Dark-mode only hover background.
    const hoverIn = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (dark) e.currentTarget.style.background = DARK.btnHover;
    };
    const hoverOut = (
        e: React.MouseEvent<HTMLButtonElement>,
        active = false,
    ) => {
        if (dark)
            e.currentTarget.style.background = active
                ? DARK.btnActiveBg
                : DARK.btnBg;
    };

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                background: dark ? DARK.toolbarBg : "var(--background)",
                borderBottom: `1px solid ${dark ? DARK.panelBorder : "#e5e7eb"}`,
                minHeight: "48px",
                flexShrink: 0,
            }}
        >
            <button
                onClick={onToggleEdit}
                onMouseEnter={hoverIn}
                onMouseLeave={(e) => hoverOut(e, isEditMode)}
                style={{
                    ...baseBtn,
                    background: dark
                        ? isEditMode
                            ? DARK.btnActiveBg
                            : DARK.btnBg
                        : isEditMode
                          ? "#374151"
                          : "#fff",
                    color: dark
                        ? DARK.btnText
                        : isEditMode
                          ? "#fff"
                          : "#374151",
                    border: dark
                        ? `1px solid ${isEditMode ? DARK.btnText : DARK.btnBorder}`
                        : `1px solid ${isEditMode ? "#374151" : "#d1d5db"}`,
                }}
            >
                {isEditMode ? "Done Editing" : "Edit"}
            </button>

            <button
                onClick={onSuggestRoutes}
                onMouseEnter={hoverIn}
                onMouseLeave={(e) => hoverOut(e)}
                style={baseBtn}
            >
                Suggest Routes
            </button>

            <button
                onClick={() => {
                    if (canSave) onSave();
                }}
                disabled={!canSave}
                title={canSave ? "Save route" : "Add a stop to save"}
                onMouseEnter={(e) => {
                    if (canSave) hoverIn(e);
                }}
                onMouseLeave={(e) => {
                    if (canSave) hoverOut(e);
                }}
                style={{
                    ...baseBtn,
                    padding: "6px 10px",
                    display: "flex",
                    alignItems: "center",
                    ...(canSave
                        ? {}
                        : {
                              opacity: 0.5,
                              cursor: "not-allowed",
                          }),
                }}
                aria-label="Save route"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                </svg>
            </button>
        </div>
    );
}
