"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme-context";
import { DARK } from "./routeTheme";

interface SaveRouteModalProps {
    onClose: () => void;
    onSave: (name: string) => void;
    existingNames: string[];
    title?: string;
    confirmLabel?: string;
    initialName?: string;
}

const DUPLICATE_MESSAGE =
    "A route with this name already exists. Please enter a different name.";
const REQUIRED_MESSAGE = "Route name is required.";

export default function SaveRouteModal({
    onClose,
    onSave,
    existingNames,
    title = "Save Route",
    confirmLabel = "Save Route",
    initialName = "",
}: SaveRouteModalProps) {
    const { theme } = useTheme();
    const dark = theme === "dark";
    const [name, setName] = useState(initialName);
    const [touched, setTouched] = useState(false);

    const trimmed = name.trim();
    const isEmpty = trimmed.length === 0;
    const isDuplicate =
        !isEmpty &&
        existingNames.some(
            (n) => n.trim().toLowerCase() === trimmed.toLowerCase(),
        );
    const canSave = !isEmpty && !isDuplicate;

    const error = isEmpty
        ? touched
            ? REQUIRED_MESSAGE
            : ""
        : isDuplicate
          ? DUPLICATE_MESSAGE
          : "";

    function handleSave() {
        setTouched(true);
        if (!canSave) return;
        onSave(trimmed);
    }

    return (
        /* Backdrop */
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 99998,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.4)",
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Dialog */}
            <div
                style={{
                    background: dark ? DARK.panelBg : "#fff",
                    borderRadius: "8px",
                    width: "420px",
                    maxWidth: "92vw",
                    display: "flex",
                    flexDirection: "column",
                    border: dark ? `1px solid ${DARK.panelBorder}` : "none",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        padding: "16px 20px",
                        borderBottom: `1px solid ${dark ? DARK.panelBorder : "#e5e7eb"}`,
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "16px",
                            fontWeight: 700,
                            color: dark ? DARK.text : "#111827",
                        }}
                    >
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "20px",
                            cursor: "pointer",
                            color: dark ? DARK.textMuted : "#6b7280",
                            lineHeight: 1,
                            padding: "0 4px",
                        }}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: "16px 20px" }}>
                    <label
                        htmlFor="route-name"
                        style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: dark ? DARK.text : "#374151",
                            marginBottom: "6px",
                        }}
                    >
                        Route name
                    </label>
                    <input
                        id="route-name"
                        type="text"
                        autoFocus
                        value={name}
                        placeholder="e.g. Manila North Route"
                        onChange={(e) => {
                            setName(e.target.value);
                            setTouched(true);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave();
                        }}
                        style={{
                            width: "100%",
                            padding: "8px 10px",
                            border: `1px solid ${
                                error
                                    ? "#ef4444"
                                    : dark
                                      ? DARK.panelBorder
                                      : "#d1d5db"
                            }`,
                            borderRadius: "4px",
                            fontSize: "13px",
                            color: dark ? DARK.text : "#111827",
                            background: dark ? DARK.elevatedBg : "#fff",
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                    {error && (
                        <p
                            style={{
                                margin: "8px 0 0",
                                fontSize: "12px",
                                color: "#ef4444",
                            }}
                        >
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "8px",
                        padding: "12px 20px 16px",
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            padding: "8px 16px",
                            background: dark ? DARK.btnBg : "#fff",
                            color: dark ? DARK.btnText : "#374151",
                            border: `1px solid ${dark ? DARK.btnBorder : "#d1d5db"}`,
                            borderRadius: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!canSave}
                        style={{
                            padding: "8px 22px",
                            background: !canSave
                                ? dark
                                    ? "#1e293b"
                                    : "#9ca3af"
                                : dark
                                  ? DARK.btnBg
                                  : "#374151",
                            color: dark ? DARK.btnText : "#fff",
                            border: dark ? `1px solid ${DARK.btnBorder}` : "none",
                            borderRadius: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            cursor: canSave ? "pointer" : "not-allowed",
                            opacity: canSave ? 1 : 0.7,
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
