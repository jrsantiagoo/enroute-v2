"use client";

import { useState, useEffect } from "react";
import FleetTable from "@/components/fleet-management/fleet-table";
import VehicleForm from "@/components/fleet-management/vehicle-form";
import VehicleFormModal from "@/components/fleet-management/vehicle-form-modal";
import VehicleDetailsModal from "@/components/fleet-management/vehicle-details";
import TableSkeleton from "@/components/ui/table-skeleton";
import Toast from "@/components/ui/toast";
import type { Vehicle } from "@/lib/types/vehicle";
import * as vehicleApi from "@/lib/api/vehicles";

const VALID_VEHICLE_TYPES = [
    "VAN",
    "MOTORCYCLE",
    "CAR",
    "TRUCK",
    "BUS",
    "OTHER",
];

function buildVehiclePayload(data: Partial<Vehicle>) {
    const normalizedType = data.vehicleType
        ? data.vehicleType.trim().toUpperCase()
        : null;

    return {
        plate_number: data.plateNumber,
        year: data.year,
        vehicle_type: VALID_VEHICLE_TYPES.includes(normalizedType ?? "")
            ? normalizedType
            : "OTHER",
        weight_capacity: data.weightCapacity ?? null,
        initial_odometer: data.initOdometer,
        expected_kml: data.target,
        make_id_: data.vehicleMakeId ?? null,
        model_id_: data.vehicleModelId ?? null,
        is_active: data.status?.toUpperCase() !== "INACTIVE",
    };
}

export default function FleetManagement() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [editTarget, setEditTarget] = useState<Vehicle | null>(null);
    const [viewTarget, setViewTarget] = useState<Vehicle | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    async function loadVehicles() {
        setIsLoading(true);
        try {
            // Request archived and active vehicles so the table can show both views
            const result = await vehicleApi.getVehicles(true);
            if (result.success) {
                setVehicles(result.data);
            } else {
                setToast(result.message ?? "Failed to load vehicles.");
            }
        } catch (error: any) {
            setToast(error?.message ?? "Failed to load vehicles.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadVehicles();
    }, []);

    async function handleCreateVehicle(data: Partial<Vehicle>) {
        try {
            const payload = buildVehiclePayload(data);
            const result = await vehicleApi.createVehicle(payload);
            if (!result.success) {
                throw new Error(result.message ?? "Failed to create vehicle.");
            }
            await loadVehicles();
            setToast("Vehicle added successfully.");
        } catch (error: any) {
            setToast(error?.message ?? "Failed to create vehicle.");
        }
    }

    async function handleUpdateVehicle(data: Partial<Vehicle>) {
        if (!editTarget) return;
        try {
            const payload = buildVehiclePayload(data);
            const result = await vehicleApi.updateVehicle(
                editTarget.vehicleId_,
                payload,
            );
            if (!result.success) {
                throw new Error(result.message ?? "Failed to update vehicle.");
            }
            await loadVehicles();
            setToast("Vehicle updated successfully.");
            setEditTarget(null);
        } catch (error: any) {
            setToast(error?.message ?? "Failed to update vehicle.");
        }
    }

    async function handleArchive(vehicle: Vehicle) {
        try {
            const result = await vehicleApi.archiveVehicle(vehicle.vehicleId_);
            if (!result.success) {
                throw new Error(result.message ?? "Failed to archive vehicle.");
            }
            await loadVehicles();
            setToast("Vehicle archived.");
        } catch (error: any) {
            setToast(error?.message ?? "Failed to archive vehicle.");
        }
    }

    async function handleUnarchive(vehicle: Vehicle) {
        try {
            const result = await vehicleApi.unarchiveVehicle(
                vehicle.vehicleId_,
            );
            if (!result.success) {
                throw new Error(
                    result.message ?? "Failed to unarchive vehicle.",
                );
            }
            await loadVehicles();
            setToast("Vehicle unarchived.");
        } catch (error: any) {
            setToast(error?.message ?? "Failed to unarchive vehicle.");
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col justify-center">
                    <h1 className="text-2xl font-bold">Fleet Management</h1>
                    <p className="text-md text-muted-foreground">
                        Manage your fleet vehicles
                    </p>
                </div>
            </div>

            <VehicleForm onCreate={handleCreateVehicle} />
            {isLoading ? (
                <TableSkeleton rows={8} />
            ) : (
                <FleetTable
                    vehicles={vehicles}
                    onEdit={setEditTarget}
                    onView={setViewTarget}
                    onArchive={handleArchive}
                    onUnarchive={handleUnarchive}
                />
            )}

            {editTarget && (
                <VehicleFormModal
                    initialData={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSave={handleUpdateVehicle}
                />
            )}

            {viewTarget && (
                <VehicleDetailsModal
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
