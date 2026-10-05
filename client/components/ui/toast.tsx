"use client";
import { useEffect } from "react";

interface ToastProps {
    message: string;
    onDismiss: () => void;
    durationMs?: number;
    position?: "bottom-right" | "top-right";
}

export default function Toast({
    message,
    onDismiss,
    durationMs = 3000,
    position = "bottom-right",
}: ToastProps) {
    useEffect(() => {
        const t = setTimeout(onDismiss, durationMs);
        return () => clearTimeout(t);
    }, [onDismiss, durationMs]);

    const positionStyle = {
        bottom: "24px",
        top: "auto" as const,
        right: "24px",
    };

    return (
        <div
            style={{
                position: "fixed",
                ...positionStyle,
                zIndex: 99999,
                background: "#1f2937",
                color: "#fff",
                padding: "10px 18px",
                borderRadius: "6px",
                fontSize: "14px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
            }}
        >
            <span style={{ color: "#4ade80", fontWeight: 700 }}>✓</span>
            {message}
            <button
                onClick={onDismiss}
                style={{
                    background: "none",
                    border: "none",
                    color: "#9ca3af",
                    cursor: "pointer",
                    fontSize: "18px",
                    lineHeight: 1,
                    padding: 0,
                    marginLeft: "4px",
                }}
                aria-label="Dismiss"
            >
                x
            </button>
        </div>
    );
}
