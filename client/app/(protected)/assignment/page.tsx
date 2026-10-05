"use client";

import { useState, useEffect, useCallback } from "react";
import Toast from "@/components/ui/toast";
import { CalendarDays, List, User } from "lucide-react";
import type {
    Trip,
    Driver,
    RoutePlan,
    DriverCapacity,
} from "@/lib/types/schema";
import type { Vehicle } from "@/lib/types/vehicle";
import {
    getAllTrips,
    createTrip,
    deleteTrip,
    updateTrip,
    archiveTrip,
    unarchiveTrip,
} from "@/lib/api/trips";
import { getDrivers, getDriverCapacity } from "@/lib/api/drivers";
import { getVehicles } from "@/lib/api/vehicles";
import { getRoutes } from "@/lib/api/routes";

// import AssignmentForm from "@/components/assignment/assignment-form";
import CalendarView from "@/components/assignment/calendar-view";
import TableView from "@/components/assignment/table-view";
import DriverView from "@/components/assignment/driver-view";
import AssignmentForm from "@/components/assignment/assign-form";
import AssignmentFormModal from "@/components/assignment/assignment-form-modal";
import TripDetailsModal from "@/components/assignment/trip-details";
import TableSkeleton from "@/components/ui/table-skeleton";

export default function Assignment() {
    const [viewMode, setViewMode] = useState<"calendar" | "table" | "driver">(
        "calendar",
    );
    const [trips, setTrips] = useState<Trip[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [driverCapacity, setDriverCapacity] = useState<DriverCapacity[]>([]);
    const [routes, setRoutes] = useState<RoutePlan[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]); // Added state for vehicles
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [editTarget, setEditTarget] = useState<Trip | null>(null);
    const [viewTarget, setViewTarget] = useState<Trip | null>(null);
    // Tracks which trips are archived so the table can split Active/Archived
    const [archivedIds, setArchivedIds] = useState<string[]>([]);

    useEffect(() => {
        async function loadData() {
            try {
                const [
                    tripsRes,
                    driversRes,
                    capacityRes,
                    routesRes,
                    vehicleRes,
                ] = await Promise.all([
                    getAllTrips(),
                    getDrivers(),
                    getDriverCapacity(),
                    getRoutes(),
                    getVehicles(),
                ]);
                setTrips(tripsRes.data);
                setDrivers(driversRes.data);
                setDriverCapacity(capacityRes.data);
                setRoutes(routesRes.data);
                setVehicles(vehicleRes.data);

                setArchivedIds(
                    tripsRes.data
                        .filter((t: Trip) => t.deleted_at)
                        .map((t: Trip) => t.id_),
                );
            } catch (err) {
                console.error("Failed to load assignment data:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Add a newly created trip to the shared trips list
    const handleCreateTrip = useCallback(async (newTrip: Trip) => {
        try {
            const res = await createTrip(
                newTrip.route_id_!,
                newTrip.driver_id_!,
                newTrip.scheduled_date,
                newTrip.notes,
                newTrip.vehicle_id_,
            );
            if (res.success) {
                setTrips((prev) => [...prev, res.data]);
                setToast("Assignment created successfully.");
            } else {
                console.error("Failed to create trip:", res);
                alert("Failed to create trip. Please try again.");
            }
        } catch (error) {
            console.error("Failed to add new trip:", error);
            alert("Failed to add new trip. Please try again.");
        }
    }, []);

    // Remove a trip by ID from the shared trips list
    const handleDeleteTrip = useCallback(async (tripId: string) => {
        try {
            const res = await deleteTrip(tripId);
            if (res.success) {
                setTrips((prev) => prev.filter((t) => t.id_ !== tripId));
                setToast("Assignment deleted.");
            } else {
                console.error("Failed to delete trip:", res);
                alert("Failed to delete trip. Please try again.");
            }
        } catch (error) {
            console.error("Failed to delete trip:", error);
            alert("Failed to delete trip. Please try again.");
        }
    }, []);

    // Move a trip to the archived list
    const handleArchiveTrip = useCallback(async (tripId: string) => {
        try {
            const res = await archiveTrip(tripId);
            if (res.success) {
                setTrips((prev) =>
                    prev.map((t) =>
                        t.id_ === tripId
                            ? { ...t, deleted_at: new Date().toISOString() }
                            : t,
                    ),
                );
                setArchivedIds((prev) => [...prev, tripId]);
                setToast("Assignment archived.");
            } else {
                console.error("Failed to archive trip:", res);
                alert("Failed to archive trip. Please try again.");
            }
        } catch (error) {
            console.error("Failed to archive trip:", error);
            alert("Failed to archive trip. Please try again.");
        }
    }, []);

    // Restore a trip from the archived list
    const handleUnarchiveTrip = useCallback(async (tripId: string) => {
        try {
            const res = await unarchiveTrip(tripId);
            if (res.success) {
                setTrips((prev) =>
                    prev.map((t) =>
                        t.id_ === tripId ? { ...t, deleted_at: undefined } : t,
                    ),
                );
                setArchivedIds((prev) => prev.filter((id) => id !== tripId));
                setToast("Assignment unarchived.");
            } else {
                console.error("Failed to unarchive trip:", res);
                alert("Failed to unarchive trip. Please try again.");
            }
        } catch (error) {
            console.error("Failed to unarchive trip:", error);
            alert("Failed to unarchive trip. Please try again.");
        }
    }, []);

    // Close the edit modal and confirm the update
    const handleSaveTrip = useCallback(
        async (_data: Partial<Trip>) => {
            try {
                const response = await updateTrip(editTarget!.id_, _data);
                if (response.success) {
                    setTrips((prev) =>
                        prev.map((t) =>
                            t.id_ === editTarget!.id_ ? response.data : t,
                        ),
                    );
                    setEditTarget(null);
                    setToast("Assignment updated successfully.");
                } else {
                    console.error("Failed to update trip:", response);
                    alert("Failed to update trip. Please try again.");
                }
            } catch (error) {
                console.error("Failed to update trip:", error);
                alert("Failed to update trip. Please try again.");
            }
        },
        [editTarget],
    );

    return (
        <div className="flex flex-col gap-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col justify-center">
                    <h1 className="text-2xl font-bold">Route Assignment</h1>
                    <p className="text-md text-muted-foreground">
                        Assign routes and plan trips
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <AssignmentForm
                    driverOptions={drivers}
                    routeOptions={routes}
                    vehicleOptions={vehicles}
                    onCreated={handleCreateTrip}
                />

                {/* Enables Calendar/Table/Driver views toggle */}
                <div className="flex items-center rounded-lg border border-card-border bg-card p-px">
                    <button
                        onClick={() => setViewMode("calendar")}
                        className={`flex items-center gap-2 px-3.5 py-1 text-sm font-semibold rounded-md transition 
                            ${
                                viewMode === "calendar"
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-secondary dark:hover:text-primary"
                            }`}
                    >
                        <CalendarDays size={16} />
                        Calendar
                    </button>
                    <button
                        onClick={() => setViewMode("table")}
                        className={`flex items-center gap-2 px-3.5 py-1 text-sm font-semibold rounded-md transition 
                            ${
                                viewMode === "table"
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-secondary dark:hover:text-primary"
                            }`}
                    >
                        <List size={16} />
                        Table
                    </button>
                    <button
                        onClick={() => setViewMode("driver")}
                        className={`flex items-center gap-2 px-3.5 py-1 text-sm font-semibold rounded-md transition 
                            ${
                                viewMode === "driver"
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-secondary dark:hover:text-primary"
                            }`}
                    >
                        <User size={16} />
                        Driver
                    </button>
                </div>
            </div>

            {/* Displays views one-by-one */}
            {loading ? (
                <TableSkeleton rows={7} />
            ) : (
                <>
                    {viewMode === "calendar" && (
                        <CalendarView
                            trips={trips}
                            drivers={drivers}
                            onDeleted={handleDeleteTrip}
                        />
                    )}
                    {viewMode === "table" && (
                        <TableView
                            trips={trips}
                            archivedIds={archivedIds}
                            onEdit={setEditTarget}
                            onView={setViewTarget}
                            onArchive={handleArchiveTrip}
                            onUnarchive={handleUnarchiveTrip}
                        />
                    )}
                    {viewMode === "driver" && (
                        <DriverView items={driverCapacity} />
                    )}
                </>
            )}

            {editTarget && (
                <AssignmentFormModal
                    initialData={editTarget}
                    routeOptions={routes}
                    driverOptions={drivers}
                    vehicleOptions={vehicles}
                    onClose={() => setEditTarget(null)}
                    onSave={handleSaveTrip}
                />
            )}

            {viewTarget && (
                <TripDetailsModal
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
