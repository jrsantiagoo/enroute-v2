"use client";

import {
    Activity,
    Building2,
    Calendar,
    Car,
    Fuel,
    Gauge,
    User,
    Weight,
    X,
} from "lucide-react";
import { useState, useEffect } from "react";
import FormSelect from "../ui/form-select";
// import type { Vehicle } from "@/lib/types/vehicle";
import { mockDriver } from "@/lib/mock/driver-mock-data";
// import * as vehicleApi from "@/lib/api/vehicles";

interface DriverFormModalProps {
    initialData?: mockDriver | null;
    onClose: () => void;
    onSave: (data: Partial<mockDriver>) => void | Promise<void>;
}

export default function DriverFormModal({
    initialData,
    onClose,
    onSave,
}: DriverFormModalProps) {
    const isEdit = !!initialData;

    const [driverId, setDriverId] = useState(initialData?.driverId ?? "");
    const [driverName, setDriverName] = useState(initialData?.driverName ?? "");
    const [vehicleType, setVehicleType] = useState(
        initialData?.mostDrivenVehicleType ?? "",
    );
    const [activeHours, setActiveHours] = useState(
        initialData?.activeHours ? String(initialData.activeHours) : "",
    );
    const [fuelConsumed, setFuelConsumed] = useState(
        initialData?.fuelConsumed ? String(initialData.fuelConsumed) : "",
    );
    const [distTravelled, setDistTravelled] = useState(
        initialData?.distanceTraveled
            ? String(initialData.distanceTraveled)
            : "",
    );

    const [status, setStatus] = useState(initialData?.status ?? "");
    const [saving, setSaving] = useState(false);

    // Used to help identify if all required fields are filled
    const allFieldsFilled =
        driverId &&
        driverName &&
        vehicleType &&
        Number(activeHours) >= 0 &&
        Number(fuelConsumed) >= 0 &&
        Number(distTravelled) >= 0;

    // Used to help check if target efficiency & odometer values are valid
    const isActiveHoursInvalid = activeHours && Number(activeHours) <= 0;
    const isFuelConsumedInvalid = fuelConsumed && Number(fuelConsumed) <= 0;
    const isDistTravelledInvalid = distTravelled && Number(distTravelled) <= 0;

    // Ensures inputs aren't saved when form closes
    function handleClose() {
        setDriverId("");
        setDriverName("");
        setVehicleType("");
        setActiveHours("");
        setFuelConsumed("");
        setDistTravelled("");
        setStatus("");
        onClose();
    }

    // -----------------------------------------------------------------------------
    // [!!!] - TO IMPLEMENT: submit form
    // -----------------------------------------------------------------------------
    async function handleSubmit(e: React.SubmitEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave({
                // driverId,
                // driverName,
                // vehicleType,
                // activeHours: initialData?.activeHours ?? 0,
                // fuelConsumed: initialData?.fuelConsumed ?? 0,
                // distTravelled: initialData?.distanceTraveled ?? 0,
                // topThreeVehicles: initialData?.topThreeVehicles ?? "",
                // ...(isEdit && { status }),
            });
        } finally {
            // Closes Modal if saving is successful.
            setSaving(false);
        }
    }

    return (
        // Background Overlay
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => handleClose()}
        >
            {/* Form Modal */}
            <div
                className="relative mt-2 p-8 w-240 bg-card border border-card-border rounded-lg shadow shadow-card-border"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:bg-secondary 
                        hover:text-foreground dark:hover:text-primary transition"
                    title="Close"
                >
                    <X size={20} />
                </button>

                {/* Header Text */}
                <div>
                    <h2 className="text-2xl font-semibold text-foreground mb-3">
                        {isEdit ? "Edit driver" : "Add new driver"}
                    </h2>
                    <p className="-mt-3 text-md text-muted-foreground">
                        {isEdit
                            ? "Update driver details."
                            : "Add a new driver. Fill in all required details."}
                    </p>
                </div>

                {/* Form Details */}
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col mt-4 gap-3"
                >
                    <div className="grid grid-cols-3 gap-6 w-full">
                        <div className="flex flex-col w- gap-1">
                            <label className="text-md font-semibold text-foreground">
                                Driver ID{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <User
                                    size={21}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                                />
                                <input
                                    id="driver-id"
                                    type="text"
                                    placeholder="e.g. DRV-1002"
                                    value={driverId}
                                    onChange={(e) =>
                                        setDriverId(e.target.value)
                                    }
                                    className="bg-background border border-btn-border rounded-lg pl-9 pr-2 py-2 text-sm text-foreground w-full 
                                        focus:outline-none focus:ring-2 focus:ring-primary-foreground"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col w- gap-1">
                            <label className="text-md font-semibold text-foreground">
                                Driver Name{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <User
                                    size={21}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                                />
                                <input
                                    id="driver-name"
                                    type="text"
                                    placeholder="Enter driver name"
                                    value={driverName}
                                    onChange={(e) =>
                                        setDriverName(e.target.value)
                                    }
                                    className="bg-background border border-btn-border rounded-lg pl-9 pr-2 py-2 text-sm text-foreground w-full 
                                        focus:outline-none focus:ring-2 focus:ring-primary-foreground"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-md font-semibold text-foreground">
                                Preferred Vehicle Type{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <FormSelect
                                value={vehicleType}
                                onChange={setVehicleType}
                                options={[
                                    "VAN",
                                    "CAR",
                                    "MOTORCYCLE",
                                    "TRUCK",
                                    "BUS",
                                    "OTHER",
                                ]}
                                placeholder="Select vehicle type"
                                icon={<Car size={21} />}
                            />
                        </div>

                        {isEdit && (
                            <div className="flex flex-col gap-1">
                                <label className="text-md font-semibold text-foreground">
                                    Active Hours (hr){" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Fuel
                                        size={19}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    />
                                    <input
                                        id="active-hours"
                                        type="number"
                                        min="0"
                                        placeholder="Enter target efficiency"
                                        value={activeHours}
                                        onChange={(e) =>
                                            setActiveHours(e.target.value)
                                        }
                                        className="bg-background border border-btn-border rounded-lg pl-9 pr-2 py-2 text-sm text-foreground w-full 
                                        focus:outline-none focus:ring-2 focus:ring-primary-foreground"
                                    />
                                </div>
                                {isActiveHoursInvalid && (
                                    <p className="text-xs text-red-500 mt-0.5">
                                        Target efficiency must be greater than 0
                                    </p>
                                )}
                            </div>
                        )}

                        {isEdit && (
                            <div className="flex flex-col gap-1">
                                <label className="text-md font-semibold text-foreground">
                                    Fuel Consumed (L){" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Gauge
                                        size={19}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    />
                                    <input
                                        id="fuel-consumed"
                                        type="number"
                                        min="0"
                                        placeholder="Enter liters"
                                        value={fuelConsumed}
                                        onChange={(e) =>
                                            setFuelConsumed(e.target.value)
                                        }
                                        className="bg-background border border-btn-border rounded-lg pl-9 pr-2 py-2 text-sm text-foreground w-full 
                                        focus:outline-none focus:ring-2 focus:ring-primary-foreground"
                                    />
                                </div>
                                {isFuelConsumedInvalid && (
                                    <p className="text-xs text-red-500 mt-0.5">
                                        Initial odometer must be greater than 0
                                    </p>
                                )}
                            </div>
                        )}

                        {isEdit && (
                            <div className="flex flex-col gap-1">
                                <label className="text-md font-semibold text-foreground">
                                    Distance Travelled (km){" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Weight
                                        size={19}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    />
                                    <input
                                        id="distance-travelled"
                                        type="number"
                                        min="0"
                                        placeholder="Enter weight"
                                        value={distTravelled}
                                        onChange={(e) =>
                                            setDistTravelled(e.target.value)
                                        }
                                        className="bg-background border border-btn-border rounded-lg pl-9 pr-2 py-2 text-sm text-foreground w-full 
                                        focus:outline-none focus:ring-2 focus:ring-primary-foreground"
                                    />
                                </div>
                                {isDistTravelledInvalid && (
                                    <p className="text-xs text-red-500 mt-0.5">
                                        Initial odometer must be greater than 0
                                    </p>
                                )}
                            </div>
                        )}

                        {isEdit && (
                            <div className="flex flex-col gap-1">
                                <label className="text-md font-semibold text-foreground">
                                    Status{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <FormSelect
                                    value={status}
                                    onChange={setStatus}
                                    options={["ACTIVE", "INACTIVE"]}
                                    placeholder="Select status"
                                    icon={<Activity size={19} />}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex font-semibold justify-end gap-2 mt-3.5">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-5 py-1.5 text-md rounded-md bg-btn border border-btn-border text-foreground hover:bg-secondary dark:hover:text-primary transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!allFieldsFilled || saving}
                            className={`px-5 py-1.5 text-md rounded-md transition duration-350 
                                ${
                                    allFieldsFilled
                                        ? "bg-primary border border-btn-border text-primary-foreground hover:bg-secondary"
                                        : "bg-muted-foreground text-background cursor-not-allowed"
                                }
                                ${saving ? "cursor-not-allowed" : ""}
                            `}
                        >
                            {/* Swaps label if 'submit' is clicked or in edit mode*/}
                            {saving
                                ? "Saving..."
                                : isEdit
                                  ? "Save changes"
                                  : "Add vehicle"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
