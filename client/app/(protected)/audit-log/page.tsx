"use client";

import { useState, useEffect } from "react";
import TableSkeleton from "@/components/ui/table-skeleton";
import AuditTable from "@/components/audit-log/audit-table";
import { mockAuditLogData, MockLogs } from "@/lib/mock/audit-log-mock-data";

export default function AuditLog() {
    const [logs, setLogs] = useState<MockLogs[]>([]);
    const [viewTarget, setViewTarget] = useState<MockLogs | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // -----------------------------------------------------------------------------
    // [!!!] - TO IMPLEMENT: loading audit log from database.
    // -----------------------------------------------------------------------------
    async function loadLogs() {
        setIsLoading(true);
        try {
            // // Request archived and active vehicles so the table can show both views
            // const result = await vehicleApi.getDrivers(true);
            // if (result.success) {
            //     setDrivers(result.data);
            // } else {
            //     setToast(result.message ?? "Failed to load drivers.");
            // }
            setLogs(mockAuditLogData);
        } catch (error: any) {
            setToast(error?.message ?? "Failed to load drivers.");
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
        </div>
    );
}
