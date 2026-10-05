"use client";

import { useTheme } from "@/lib/theme-context";
import { DARK } from "./routeTheme";

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    danger = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const { theme } = useTheme();
    const dark = theme === "dark";

    return (
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
                if (e.target === e.currentTarget) onCancel();
            }}
        >
            <div
                style={{
                    background: dark ? DARK.panelBg : "#fff",
                    borderRadius: "8px",
                    width: "400px",
                    maxWidth: "92vw",
                    border: dark ? `1px solid ${DARK.panelBorder}` : "none",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
                }}
            >
                <div style={{ padding: "18px 20px 8px" }}>
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
                    <p
                        style={{
                            margin: "8px 0 0",
                            fontSize: "13px",
                            lineHeight: 1.5,
                            color: dark ? DARK.textMuted : "#6b7280",
                        }}
                    >
                        {message}
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "8px",
                        padding: "12px 20px 16px",
                    }}
                >
                    <button
                        onClick={onCancel}
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
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: "8px 22px",
                            background: danger
                                ? "#dc2626"
                                : dark
                                  ? DARK.btnBg
                                  : "#374151",
                            color: "#fff",
                            border: danger
                                ? "none"
                                : dark
                                  ? `1px solid ${DARK.btnBorder}`
                                  : "none",
                            borderRadius: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            cursor: "pointer",
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
