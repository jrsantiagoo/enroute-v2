"use client";

import {
    Activity,
    CalendarClock,
    Database,
    FileText,
    Hash,
    History,
    PencilLine,
    Sparkles,
    Table2,
    User,
    X,
} from "lucide-react";
import StatusBadge from "../ui/status-badge";
import { MockLogs } from "@/lib/mock/audit-log-mock-data";
import { formatDateTime } from "@/lib/routing/formatters";

interface LogDetailsProps {
    initialData?: MockLogs | null;
    onClose: () => void;
}

export default function LogDetailsModal({
    initialData,
    onClose,
}: LogDetailsProps) {
    const metadata = [
        {
            label: "Timestamp",
            icon: CalendarClock,
            value: initialData?.created_at
                ? formatDateTime(initialData.created_at)
                : "—",
        },
        { label: "Log ID", icon: Hash, value: initialData?.id },
        {
            label: "Action",
            icon: Activity,
            value: initialData?.action ? (
                <StatusBadge status={initialData.action} />
            ) : (
                "—"
            ),
        },
        {
            label: "Action by",
            icon: User,
            value: initialData?.user_id ? (
                <div className="flex flex-col items-end">
                    <span>{initialData.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                        {initialData.user_id}
                    </span>
                </div>
            ) : (
                "—"
            ),
        },
        {
            label: "Table Modified",
            icon: Table2,
            value: initialData?.table_name,
        },
        {
            label: "Record Affected",
            icon: FileText,
            value: initialData?.record_id,
        },
    ];

    const jsonPanels = [
        {
            title: "Old Data",
            icon: History,
            raw: initialData?.old_data,
            empty: "No previous data",
        },
        {
            title: "New Data",
            icon: PencilLine,
            raw: initialData?.new_data,
            empty: "No changes recorded",
        },
    ];

    return (
        // Background Overlay
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => onClose()}
        >
            {/* View Modal */}
            <div
                className="overflow-auto relative mt-2 p-8 h-180 w-160 bg-background border border-card-border rounded-lg shadow shadow-card-border scrollbar-thumb-muted-foreground"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground dark:hover:text-primary transition"
                    title="Close"
                >
                    <X size={20} />
                </button>

                {/* Header Text */}
                <div>
                    <div className="flex items-center gap-2 font-semibold mb-3">
                        <Database
                            size={28}
                            className="text-primary-foreground"
                        />
                        <h2 className="text-2xl text-foreground ">
                            Detailed Log
                        </h2>
                    </div>

                    <p className="-mt-3 text-md text-muted-foreground">
                        Complete log information
                    </p>
                </div>

                {/* Basic Information */}
                <div className="flex flex-col p-6 mt-4 gap-6 rounded-lg bg-card border border-card-border shadow-md">
                    {/* Metadata */}
                    <div className="flex flex-col w-full">
                        {metadata.map((n) => (
                            <div
                                key={n.label}
                                className="flex gap-6 py-2.5 items-center justify-between font-semibold text-base border-b border-card-border last:border-b-0"
                            >
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <n.icon size={19} />
                                    <h2 className="mt-1">{n.label}</h2>
                                </div>
                                <div className="text-foreground text-right">
                                    {n.value ?? "—"}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Description */}
                    <div className="flex flex-col w-full">
                        <div className="text-base font-semibold">
                            Description
                        </div>

                        <div className="flex gap-2 text-sm items-start text-muted-foreground italic">
                            <FileText size={17} className="mt-0.5 shrink-0" />
                            {initialData?.details ?? "—"}
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="flex flex-col p-6 mt-4 gap-4 rounded-lg bg-card border border-card-border shadow-md">
                    {/* Header */}
                    <h2 className="text-xl font-semibold text-foreground -mt-2">
                        Detailed Changes
                    </h2>

                    {/* Data Changes */}
                    <div className="flex flex-col gap-6 w-full">
                        {jsonPanels.map(({ title, icon: Icon, raw, empty }) => (
                            <div key={title} className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
                                    <Icon size={18} />
                                    <span>{title}</span>
                                </div>

                                <pre
                                    className="overflow-auto p-3 min-h-28 max-h-64 leading-relaxed rounded-lg text-xs font-mono bg-background 
                                                border border-card-border text-foreground scrollbar-thumb-muted-foreground"
                                >
                                    {raw && raw.trim() !== "{}" ? (
                                        raw
                                    ) : (
                                        <span className="italic text-muted-foreground">
                                            {empty}
                                        </span>
                                    )}
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
