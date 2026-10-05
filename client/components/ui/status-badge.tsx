"use client";

import { useTheme } from "@/lib/theme-context";

interface StatusBadgeProps {
    status: string;
}

const STATUS_COLORS: Record<string, { bg: string; fg: string; bd: string }> = {
    "IN PROGRESS": { bg: "#eff6ff", fg: "#1d4ed8", bd: "#bfdbfe" },
    STANDBY: { bg: "#fefce8", fg: "#a16207", bd: "#fef08a" },
    ACTIVE: { bg: "#f0fdf4", fg: "#15803d", bd: "#bbf7d0" },
    INACTIVE: { bg: "#f8fafc", fg: "#64748b", bd: "#e2e8f0" },
    RESERVED: { bg: "#faf5ff", fg: "#7e22ce", bd: "#e9d5ff" },
    COMPLETED: { bg: "#f0fdf4", fg: "#15803d", bd: "#bbf7d0" },
    CANCELLED: { bg: "#fef2f2", fg: "#b91c1c", bd: "#fecaca" },
    FAILED: { bg: "#fef2f2", fg: "#b91c1c", bd: "#fecaca" },
    PENDING: { bg: "#fffbeb", fg: "#d97706", bd: "#fde68a" },
    PROCESSING: { bg: "#f0f9ff", fg: "#0c4a6e", bd: "#bae6fd" },
    "FULLY UTILIZED": { bg: "#ecfeff", fg: "#0f766e", bd: "#a5f3fc" },
};

const STATUS_COLORS_DARK: Record<
    string,
    { bg: string; fg: string; bd: string }
> = {
    "IN PROGRESS": {
        bg: "rgba(59,130,246,0.15)",
        fg: "#93c5fd",
        bd: "rgba(59,130,246,0.35)",
    },
    STANDBY: {
        bg: "rgba(234,179,8,0.15)",
        fg: "#fde047",
        bd: "rgba(234,179,8,0.35)",
    },
    ACTIVE: {
        bg: "rgba(34,197,94,0.15)",
        fg: "#86efac",
        bd: "rgba(34,197,94,0.35)",
    },
    INACTIVE: {
        bg: "rgba(148,163,184,0.15)",
        fg: "#cbd5e1",
        bd: "rgba(148,163,184,0.35)",
    },
    RESERVED: {
        bg: "rgba(168,85,247,0.15)",
        fg: "#d8b4fe",
        bd: "rgba(168,85,247,0.35)",
    },
    COMPLETED: {
        bg: "rgba(34,197,94,0.15)",
        fg: "#86efac",
        bd: "rgba(34,197,94,0.35)",
    },
    CANCELLED: {
        bg: "rgba(239,68,68,0.15)",
        fg: "#fca5a5",
        bd: "rgba(239,68,68,0.35)",
    },
    FAILED: {
        bg: "rgba(239,68,68,0.15)",
        fg: "#fca5a5",
        bd: "rgba(239,68,68,0.35)",
    },
    PENDING: {
        bg: "rgba(234,179,8,0.15)",
        fg: "#fde047",
        bd: "rgba(234,179,8,0.35)",
    },
    PROCESSING: {
        bg: "rgba(59,130,246,0.15)",
        fg: "#93c5fd",
        bd: "rgba(59,130,246,0.35)",
    },
    "FULLY UTILIZED": {
        bg: "rgba(20,184,166,0.15)",
        fg: "#5eead4",
        bd: "rgba(20,184,166,0.35)",
    },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    const { theme } = useTheme();
    const dark = theme === "dark";

    const normalized = status.toUpperCase();
    const palette = (dark ? STATUS_COLORS_DARK : STATUS_COLORS)[normalized] ?? {
        bg: dark ? "rgba(148,163,184,0.15)" : "#f8fafc",
        fg: dark ? "#cbd5e1" : "#64748b",
        bd: dark ? "rgba(148,163,184,0.35)" : "#e2e8f0",
    };

    return (
        <span
            style={{
                fontSize: "11px",
                fontWeight: 600,
                color: palette.fg,
                background: palette.bg,
                border: `1px solid ${palette.bd}`,
                borderRadius: "9999px",
                padding: "2px 10px",
                whiteSpace: "nowrap",
            }}
        >
            {status}
        </span>
    );
}
