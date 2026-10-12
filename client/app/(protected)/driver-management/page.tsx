"use client";

import { useState, useEffect } from "react";
import DriverFormBtn from "@/components/driver-management/driver-form";
import DriverTable from "@/components/driver-management/driver-table";

import DriverDetailsModal from "@/components/driver-management/driver-details";
import TableSkeleton from "@/components/ui/table-skeleton";
import Toast from "@/components/ui/toast";
import { mockDriverData, type mockDriver } from "@/lib/mock/driver-mock-data";

export default function DriverManagement() {
    const [drivers, setDrivers] = useState<mockDriver[]>([]);
    const [editTarget, setEditTarget] = useState<mockDriver | null>(null);
    const [viewTarget, setViewTarget] = useState<mockDriver | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // -----------------------------------------------------------------------------
    // [!!!] - TO IMPLEMENT: loading driver data from database.
    // -----------------------------------------------------------------------------
    async function loadDrivers() {
        setIsLoading(true);
        try {
            // // Request archived and active vehicles so the table can show both views
            // const result = await vehicleApi.getDrivers(true);
            // if (result.success) {
            //     setDrivers(result.data);
            // } else {
            //     setToast(result.message ?? "Failed to load drivers.");
            // }
            setDrivers(mockDriverData);
        } catch (error: any) {
            setToast(error?.message ?? "Failed to load drivers.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadDrivers();
    }, []);

    // -----------------------------------------------------------------------------
    // [!!!] - TO IMPLEMENT: creating driver record.
    // -----------------------------------------------------------------------------
    async function handleCreateDriver(data: Partial<mockDriver>) {
        // try {
        //     const payload = buildVehiclePayload(data);
        //     const result = await vehicleApi.createVehicle(payload);
        //     if (!result.success) {
        //         throw new Error(result.message ?? "Failed to create vehicle.");
        //     }
        //     await loadVehicles();
        //     setToast("Vehicle added successfully.");
        // } catch (error: any) {
        //     setToast(error?.message ?? "Failed to create vehicle.");
        // }
    }

    // -----------------------------------------------------------------------------
    // [!!!] - TO IMPLEMENT: updating driver record.
    // -----------------------------------------------------------------------------
    async function handleUpdateVehicle(data: Partial<mockDriver>) {
        // if (!editTarget) return;
        // try {
        //     const payload = buildVehiclePayload(data);
        //     const result = await vehicleApi.updateVehicle(
        //         editTarget.vehicleId_,
        //         payload,
        //     );
        //     if (!result.success) {
        //         throw new Error(result.message ?? "Failed to update vehicle.");
        //     }
        //     await loadVehicles();
        //     setToast("Vehicle updated successfully.");
        //     setEditTarget(null);
        // } catch (error: any) {
        //     setToast(error?.message ?? "Failed to update vehicle.");
        // }
    }

    // -----------------------------------------------------------------------------
    // [!!!] - TO IMPLEMENT: driver arhiving function.
    // -----------------------------------------------------------------------------
    async function handleArchive(driver: mockDriver) {
        // try {
        //     const result = await vehicleApi.archiveVehicle(vehicle.vehicleId_);
        //     if (!result.success) {
        //         throw new Error(result.message ?? "Failed to archive vehicle.");
        //     }
        //     await loadVehicles();
        //     setToast("Vehicle archived.");
        // } catch (error: any) {
        //     setToast(error?.message ?? "Failed to archive vehicle.");
        // }
    }

    // -----------------------------------------------------------------------------
    // [!!!] - TO IMPLEMENT: driver unarchive function.
    // -----------------------------------------------------------------------------
    async function handleUnarchive(driver: mockDriver) {
        // try {
        //     const result = await vehicleApi.unarchiveVehicle(
        //         vehicle.vehicleId_,
        //     );
        //     if (!result.success) {
        //         throw new Error(
        //             result.message ?? "Failed to unarchive vehicle.",
        //         );
        //     }
        //     await loadVehicles();
        //     setToast("Vehicle unarchived.");
        // } catch (error: any) {
        //     setToast(error?.message ?? "Failed to unarchive vehicle.");
        // }
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

            <DriverFormBtn /*onCreate={handleCreateVehicle}*/ />
            {isLoading ? (
                <TableSkeleton rows={8} />
            ) : (
                <DriverTable
                    drivers={drivers}
                    onEdit={setEditTarget}
                    onView={setViewTarget}
                    onArchive={handleArchive}
                    onUnarchive={handleUnarchive}
                />
            )}

            {/* {editTarget && (
                <VehicleFormModal
                    initialData={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSave={handleUpdateVehicle}
                />
            )} */}

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
