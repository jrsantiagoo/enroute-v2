"use client";

import { X } from "lucide-react";

interface ClearFiltersButtonProps {
    onClick: () => void;
    className?: string;
}

// Renders the "Clear filters" action shown while at least one filter is active.
export default function ClearFiltersButton({
    onClick,
    className = "",
}: ClearFiltersButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-secondary hover:text-red-500 dark:hover:text-red-400 cursor-pointer ${className}`}
            title="Clear all filters"
            aria-label="Clear all filters"
        >
            <X size={14} className="shrink-0" />
            <span>Clear filters</span>
        </button>
    );
}
