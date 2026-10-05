import {
    ArrowDownUp,
    ArrowUpNarrowWide,
    ArrowDownWideNarrow,
} from "lucide-react";
import type { SortState } from "@/lib/hooks/useSort";

interface SortableHeaderProps {
    sortKey: string;
    sortState: SortState | null;
    onToggle: (key: string) => void;
    className?: string;
    children: React.ReactNode;
}

// Clickable header that sorts by ascending/descending on click.
export default function SortableHeader({
    sortKey,
    sortState,
    onToggle,
    className = "",
    children,
}: SortableHeaderProps) {
    const active = sortState?.key === sortKey;
    const dir = sortState?.dir;

    // Always show an icon: unsorted ↔, ascending ↑, descending ↓
    const Icon = !active
        ? ArrowDownUp
        : dir === "asc"
          ? ArrowUpNarrowWide
          : ArrowDownWideNarrow;

    return (
        <th
            className={`cursor-pointer select-none px-4 py-3 text-xs font-bold text-foreground border-b border-card-border 
                hover:bg-secondary dark:hover:text-primary transition ${className}`}
            onClick={() => onToggle(sortKey)}
        >
            <span className="inline-flex items-center gap-1">
                {children}
                <Icon size={14} className="ml-1.5 shrink-0" />
            </span>
        </th>
    );
}
