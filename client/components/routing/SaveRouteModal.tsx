"use client";

import { useState } from "react";
import { X } from "lucide-react";

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
            className="fixed inset-0 z-99998 flex justify-center items-center bg-black/40"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Dialog */}
            <div className="flex flex-col w-105 max-w-[92vw] rounded-lg bg-card border border-card-border shadow shadow-card-border">
                {/* Header */}
                <div className="flex px-5 py-4 justify-between items-start border-b border-b-card-border">
                    <h2 className="text-base font-bold text-foreground">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md text-muted-foreground leading-none hover:bg-secondary
                            hover:text-foreground  transition cursor-pointer"
                        aria-label="Close"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4">
                    <label
                        htmlFor="route-name"
                        className="block mb-1.5 text-xs font-semibold text-foreground"
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
                        className={`px-2.5 py-2 w-full rounded-sm text-[13px] text-foreground dark:bg-[#0f2237] border outline-none box-border
                            ${error ? "border-red-500" : "border-card-border"}`}
                    />
                    {error && (
                        <p className="mt-2 text-sm text-red-500">{error}</p>
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
                        className="px-4 py-2 text-[13px] font-medium rounded-sm bg-btn border border-btn-border text-foreground 
                            hover:bg-secondary  transition duration-350 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!canSave}
                        className={`py-2 px-5.5 text-[13px] font-semibold rounded-sm text-background dark:text-foreground border 
                                bg-[#1e293b] dark:bg-btn border-btn-border transition duration-250 
                                ${
                                    canSave
                                        ? "hover:bg-secondary hover:text-foreground  opacity-100 cursor-pointer"
                                        : "opacity-70 cursor-not-allowed"
                                }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
