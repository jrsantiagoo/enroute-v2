"use client";

import { useTheme } from "@/lib/theme-context";

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
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    useTheme();

    return (
        <div
            className="fixed inset-0 z-99998 flex items-center justify-center bg-black/40"
            onClick={(e) => {
                if (e.target === e.currentTarget) onCancel();
            }}
        >
            <div className="w-100 max-w-[92vw] rounded-lg border border-card-border bg-card shadow-2xl shadow-black/40">
                <div className="pt-4.5 px-5 pb-2">
                    <h2 className="m-0 text-base font-bold text-foreground">
                        {title}
                    </h2>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                        {message}
                    </p>
                </div>

                <div className="flex px-5 pt-3 pb-4 gap-2 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 font-medium text-[13px] rounded-sm bg-btn border border-btn-border text-foreground 
                            cursor-pointer"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-5.5 py-2 text-[13px] font-medium rounded-sm text-white bg-btn-danger border border-btn-border
                            hover:bg-btn-danger-hover cursor-pointer"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
