"use client";

import {
    Activity,
    Calendar,
    Car,
    CalendarClock,
    ClipboardList,
    Fuel,
    Gauge,
    Route,
    User,
    X,
    Clock,
} from "lucide-react";
import { Trip } from "@/lib/types/schema";
import StatusBadge from "../ui/status-badge";
import { formatDateTime } from "@/lib/routing/formatters";

interface TripDetailsProps {
    initialData?: Trip | null;
    onClose: () => void;
}

export default function TripDetailsModal({
    initialData,
    onClose,
}: TripDetailsProps) {
    return (
        // Background Overlay
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => onClose()}
        >
            {/* View Modal */}
            <div
                className="relative mt-2 p-8 w-240 bg-background border border-card-border rounded-lg shadow shadow-muted-foreground"
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
                        <Route size={28} className="text-primary-foreground" />
                        <h2 className="text-2xl text-foreground ">
                            Assignment Details
                        </h2>
                    </div>

                    <p className="-mt-3 text-md text-muted-foreground">
                        Complete assignment information
                    </p>
                </div>

                {/* Basic Assignment Details */}
                <div className="flex flex-col p-8 mt-4 gap-3 rounded-xl bg-card border border-card-border shadow-md">
                    <h2 className="text-xl font-semibold text-foreground -mt-2 mb-3">
                        Trip Information
                    </h2>

                    <div className="grid grid-cols-3 gap-6 w-full font-semibold">
                        {/* First Row */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Route size={21} />
                                <h2 className="mt-1">Route Name</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                {initialData?.route?.name}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <User size={21} />
                                <h2 className="mt-1">Assigned Driver</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                {initialData?.agent_profile?.driver_id ?? "—"}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Car size={23} />
                                <h2 className="mt-1">Vehicle</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                {initialData?.vehicle?.plate_number || "—"}
                            </div>
                        </div>

                        {/* Second Row */}
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
                                <CalendarClock size={21} />
                                <h2 className="mt-1">Scheduled Date</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                {initialData?.scheduled_date
                                    ? formatDateTime(
                                          initialData.scheduled_date,
                                      ).slice(0, -8)
                                    : ""}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}

                <div className="flex flex-col p-8 mt-4 gap-3 rounded-xl bg-card border border-card-border shadow-md">
                    <h2 className="text-xl font-semibold text-foreground -mt-2 mb-3">
                        Additional Notes
                    </h2>

                    <div className="grid grid-cols-2 gap-6 w-full font-semibold ">
                        {initialData?.notes || "—"}
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
                                <Clock size={21} />
                                <h2 className="mt-1">Created At</h2>
                            </div>
                            <div className="text-foreground">
                                {initialData?.created_at
                                    ? formatDateTime(initialData.created_at)
                                    : ""}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Clock size={21} />
                                <h2 className="mt-1">Last Modified</h2>
                            </div>
                            <div className="text-foreground">
                                {initialData?.updated_at
                                    ? formatDateTime(initialData.updated_at)
                                    : " "}
                            </div>
                        </div>

                        {initialData?.deleted_at && (
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 text-base text-muted-foreground">
                                    <CalendarClock size={21} />
                                    <h2 className="mt-1">Archived Date</h2>
                                </div>
                                <div className="text-foreground">
                                    {initialData?.deleted_at
                                        ? formatDateTime(initialData.deleted_at)
                                        : ""}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
