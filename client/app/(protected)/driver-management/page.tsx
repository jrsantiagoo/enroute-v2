"use client";

import { useState, useEffect } from "react";
import DriverFormBtn from "@/components/driver-management/driver-form-btn";
import DriverTable from "@/components/driver-management/driver-table";
import DriverFormModal from "@/components/driver-management/driver-form-modal";
import DriverDetailsModal from "@/components/driver-management/driver-details";
import TableSkeleton from "@/components/ui/table-skeleton";
import Toast from "@/components/ui/toast";
import * as driverApi from "@/lib/api/drivers";
import type { Driver, DriverPayload } from "@/lib/api/drivers";

export default function DriverManagement() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [editTarget, setEditTarget] = useState<Driver | null>(null);
    const [viewTarget, setViewTarget] = useState<Driver | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Refreshes skip the skeleton so the table keeps its tab, filters and page after an action.
    async function loadDrivers({ showSkeleton = true } = {}) {
        if (showSkeleton) setIsLoading(true);
        try {
            const result = await driverApi.getDriversWithMetrics();
            setDrivers(result);
            setLoadError(null);
        } catch (error: any) {
            const message = error?.message ?? "Failed to load drivers.";
            if (showSkeleton) {
                setLoadError(message);
            } else {
                setToast(message);
            }
        } finally {
            if (showSkeleton) setIsLoading(false);
        }
    }

    useEffect(() => {
        loadDrivers();
    }, []);

    // Errors are rethrown so the form modal stays open and shows them next to the user's input.
    async function handleCreateDriver(payload: DriverPayload) {
        await driverApi.createDriver(payload);
        await loadDrivers({ showSkeleton: false });
        setToast("Driver added successfully.");
    }

    async function handleUpdateDriver(payload: DriverPayload) {
        if (!editTarget) return;
        await driverApi.updateDriver(editTarget.id_, payload);
        await loadDrivers({ showSkeleton: false });
        setToast("Driver updated successfully.");
    }

    // Archive and unarchive share one flow because they only differ in the API call and messages.
    async function runArchiveAction(
        action: () => Promise<unknown>,
        successMessage: string,
        failureMessage: string,
    ) {
        try {
            await action();
            await loadDrivers({ showSkeleton: false });
            setToast(successMessage);
        } catch (error: any) {
            setToast(error?.message ?? failureMessage);
        }
    }

    function handleArchive(driver: Driver) {
        return runArchiveAction(
            () => driverApi.archiveDriver(driver.id_),
            "Driver archived.",
            "Failed to archive driver.",
        );
    }

    function handleUnarchive(driver: Driver) {
        return runArchiveAction(
            () => driverApi.unarchiveDriver(driver.id_),
            "Driver unarchived.",
            "Failed to unarchive driver.",
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col justify-center">
                    <h1 className="text-2xl font-bold">Driver Management</h1>
                    <p className="text-md text-muted-foreground">
                        Manage your drivers
                    </p>
                </div>
            </div>

            <DriverFormBtn onCreate={handleCreateDriver} />
            {isLoading ? (
                <TableSkeleton rows={8} />
            ) : loadError ? (
                <div
                    role="alert"
                    className="flex flex-col items-center gap-3 rounded-xl border border-card-border bg-card p-10 text-center"
                >
                    <p className="font-semibold text-red-500">{loadError}</p>
                    <button
                        onClick={() => loadDrivers()}
                        className="px-4.5 py-1.5 text-sm font-semibold rounded-lg border border-btn-border bg-btn text-foreground hover:bg-secondary dark:hover:text-primary transition cursor-pointer"
                    >
                        Try again
                    </button>
                </div>
            ) : (
                <DriverTable
                    drivers={drivers}
                    onEdit={setEditTarget}
                    onView={setViewTarget}
                    onArchive={handleArchive}
                    onUnarchive={handleUnarchive}
                />
            )}

            {editTarget && (
                <DriverFormModal
                    initialData={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSave={handleUpdateDriver}
                />
            )}

            {viewTarget && (
                <DriverDetailsModal
                    initialData={viewTarget}
                    onClose={() => setViewTarget(null)}
                />
            )}

            {toast && (
                <Toast
                    message={toast}
                    position="bottom-right"
                    onDismiss={() => setToast(null)}
                />
            )}
        </div>
    );
}
