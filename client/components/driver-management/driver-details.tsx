"use client";

import {
    Activity,
    Calendar,
    CalendarClock,
    CreditCard,
    Phone,
    Clock,
    Fuel,
    Route,
    User,
    X,
} from "lucide-react";
import type { Driver } from "@/lib/api/drivers";
import StatusBadge from "../ui/status-badge";
import { formatDateTime } from "@/lib/routing/formatters";

interface DriverDetailsProps {
    initialData?: Driver | null;
    onClose: () => void;
}

export default function DriverDetailsModal({
    initialData,
    onClose,
}: DriverDetailsProps) {
    return (
        // Background Overlay
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => onClose()}
        >
            {/* View Modal */}
            <div
                className="relative mt-2 p-8 w-240 bg-background border border-card-border rounded-lg shadow shadow-card-border"
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
                        <User size={28} className="text-primary-foreground" />
                        <h2 className="text-2xl text-foreground ">
                            Driver Details
                        </h2>
                    </div>

                    <p className="-mt-3 text-md text-muted-foreground">
                        Complete driver information
                    </p>
                </div>

                {/* Basic Driver Details */}
                <div className="flex flex-col p-8 mt-4 gap-3 rounded-xl bg-card border border-card-border shadow-md">
                    <h2 className="text-xl font-semibold text-foreground -mt-2 mb-3">
                        Basic Information
                    </h2>

                    <div className="grid grid-cols-3 gap-6 w-full font-semibold">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <User size={23} />
                                <h2 className="mt-1">Driver ID</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                {initialData?.driverId}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Activity size={21} />
                                <h2 className="mt-1">Status</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                <StatusBadge
                                    status={initialData?.status ?? ""}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Phone size={21} />
                                <h2 className="mt-1">Contact Number</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                {initialData?.contactNumber || "—"}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <CreditCard size={21} />
                                <h2 className="mt-1">License Number</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                {initialData?.licenseNumber || "—"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metric Details */}
                <div className="flex flex-col p-8 mt-4 gap-3 rounded-xl bg-card border border-card-border shadow-md">
                    <h2 className="text-xl font-semibold text-foreground -mt-2 mb-3">
                        Driver Metrics
                    </h2>

                    <div className="grid grid-cols-3 gap-6 w-full font-semibold">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Clock size={23} />
                                <h2 className="mt-1">Active Hours</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                {initialData?.activeHours} hrs
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Fuel size={21} />
                                <h2 className="mt-1">Fuel Consumed</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                {initialData?.fuelConsumed} L
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Route size={21} />
                                <h2 className="mt-1">Distance Travelled</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                {initialData?.distanceTraveled} km
                            </div>
                        </div>
                    </div>
                </div>

                {/* Record Details */}
                <div className="flex flex-col p-8 mt-4 gap-3 rounded-xl bg-card border border-card-border shadow-md">
                    <h2 className="text-xl font-semibold text-foreground -mt-2 mb-3">
                        Record Information
                    </h2>

                    <div className="grid grid-cols-2 gap-6 w-full font-semibold ">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Calendar size={21} />
                                <h2 className="mt-1">Created At</h2>
                            </div>
                            <div className="text-foreground">
                                {initialData?.createdAt
                                    ? formatDateTime(initialData.createdAt)
                                    : "—"}
                            </div>
                        </div>
                        {initialData?.archivedAt && (
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 text-base text-muted-foreground">
                                    <CalendarClock size={21} />
                                    <h2 className="mt-1">Archived Date</h2>
                                </div>
                                <div className="text-foreground">
                                    {initialData?.archivedAt
                                        ? formatDateTime(initialData.archivedAt)
                                        : "—"}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
