"use client";

import { useState, useEffect } from "react";
import TableSkeleton from "@/components/ui/table-skeleton";
import AuditTable from "@/components/audit-log/audit-table";
import { getAuditLog } from "@/lib/api/audit-log";
import type { AuditLog } from "@/lib/types/schema";

export default function AuditLog() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [viewTarget, setViewTarget] = useState<AuditLog | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // -----------------------------------------------------------------------------
    // [!!!] - TO IMPLEMENT: loading audit log from database.
    // -----------------------------------------------------------------------------
    async function loadLogs() {
        setIsLoading(true);
        try {
            setLogs(await getAuditLog());
        } catch (error: unknown) {
            setToast(
                error instanceof Error
                    ? error.message
                    : "Failed to load audit logs.",
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadLogs();
    }, []);

    return (
        <div className="flex flex-col gap-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col justify-center">
                    <h1 className="text-2xl font-bold">Audit Log</h1>
                    <p className="text-md text-muted-foreground">
                        Log of recent system activity
                    </p>
                </div>
            </div>

            {isLoading ? (
                <TableSkeleton rows={8} />
            ) : (
                <AuditTable logs={logs} onView={setViewTarget} />
            )}

            {viewTarget && (
                <LogDetailsModal
                    initialData={viewTarget}
                    onClose={() => setViewTarget(null)}
                />
            )}
        </div>
    );
}
