"use client";

import {
    Activity,
    Calendar,
    CalendarClock,
    Car,
    Clock,
    Fuel,
    Gauge,
    User,
    X,
} from "lucide-react";
import type { Vehicle } from "@/lib/types/vehicle";
import StatusBadge from "../ui/status-badge";
import { formatDateTime } from "@/lib/routing/formatters";

interface VehicleDetailsProps {
    initialData?: Vehicle | null;
    onClose: () => void;
}

export default function VehicleDetailsModal({
    initialData,
    onClose,
}: VehicleDetailsProps) {
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
                        <Car size={28} className="text-primary-foreground" />
                        <h2 className="text-2xl text-foreground ">
                            Vehicle Details
                        </h2>
                    </div>

                    <p className="-mt-3 text-md text-muted-foreground">
                        Complete vehicle information
                    </p>
                </div>

                {/* Basic Vehicle Details */}
                <div className="flex flex-col p-8 mt-4 gap-3 rounded-xl bg-card border border-card-border shadow-md">
                    <h2 className="text-xl font-semibold text-foreground -mt-2 mb-3">
                        Basic Information
                    </h2>

                    <div className="grid grid-cols-3 gap-6 w-full font-semibold">
                        {/* First Row */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Car size={23} />
                                <h2 className="mt-1">Plate Number</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                {initialData?.plateNumber}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Car size={23} />
                                <h2 className="mt-1">Make, Model, & Type</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                {initialData?.vehicleMaker}{" "}
                                {initialData?.vehicleModel}{" "}
                                <span className="text-sm text-muted-foreground">
                                    ({initialData?.vehicleType})
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Calendar size={21} />
                                <h2 className="mt-1">Year</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                {initialData?.year}
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
                                <User size={21} />
                                <h2 className="mt-1">Last Driver</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                {initialData?.lastDriver == "" ? (
                                    <div className="italic">
                                        No assigned driver
                                    </div>
                                ) : (
                                    initialData?.lastDriver
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Gauge size={21} />
                                <h2 className="mt-1">Initial Odometer</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                {initialData?.initOdometer}
                            </div>
                        </div>

                        {/* Third Row */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Gauge size={21} />
                                <h2 className="mt-1">Current Odometer</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                {initialData?.initOdometer}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Fuel size={21} />
                                <h2 className="mt-1">Target Fuel Efficiency</h2>
                            </div>
                            <div className="ml-8 text-foreground">
                                {initialData?.target} km/L
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
                            <div className="text-foreground">{"—"}</div>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <Clock size={21} />
                                <h2 className="mt-1">Last Modified</h2>
                            </div>
                            <div className="text-foreground">{"—"}</div>
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
