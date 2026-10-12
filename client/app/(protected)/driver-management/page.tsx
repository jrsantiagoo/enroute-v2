"use client";

import AddDriverButton from "@/components/driver-management/driver-form";
import { useState, useEffect } from "react";

export default function DriverManagement() {
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

            <AddDriverButton /*onCreate={handleCreateVehicle}*/ />
            {/* {isLoading ? (
                <TableSkeleton rows={8} />
            ) : (
                <FleetTable
                    vehicles={vehicles}
                    onEdit={setEditTarget}
                    onView={setViewTarget}
                    onArchive={handleArchive}
                    onUnarchive={handleUnarchive}
                />
            )} */}

            {/* {editTarget && (
                <VehicleFormModal
                    initialData={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSave={handleUpdateVehicle}
                />
            )} */}

            {/* {viewTarget && (
                <VehicleDetailsModal
                    initialData={viewTarget}
                    onClose={() => setViewTarget(null)}
                />
            )} */}

            {/* {toast && (
                <Toast
                    message={toast}
                    position="bottom-right"
                    onDismiss={() => setToast(null)}
                />
            )} */}
        </div>
    );
}
