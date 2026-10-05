"use client";

import { CalendarDays, Route, User, Van, X } from "lucide-react";
import { useState } from "react";
import FormSelect from "../ui/form-select";
import { Driver, RoutePlan, Trip } from "@/lib/types/schema";
import { Vehicle } from "@/lib/types/vehicle";

interface AssignmentFormModalProps {
    initialData?: Trip | null;
    routeOptions: RoutePlan[];
    driverOptions: Driver[];
    vehicleOptions: Vehicle[];
    onClose: () => void;
    onSave: (data: Partial<Trip>) => void | Promise<void>;
}

export default function AssignmentFormModal({
    initialData,
    routeOptions,
    driverOptions,
    vehicleOptions,
    onClose,
    onSave,
}: AssignmentFormModalProps) {
    const isEdit = !!initialData;

    const [selectedRoute, setSelectedRoute] = useState(
        initialData?.route?.name ?? "",
    );
    const [selectedDriver, setSelectedDriver] = useState(
        initialData?.agent_profile?.driver_id ?? "",
    );
    const [selectedVehicle, setSelectedVehicle] = useState(
        initialData?.vehicle?.plate_number ?? "",
    );
    const [notes, setNotes] = useState(initialData?.notes ?? "");
    const [date, setDate] = useState(
        initialData?.scheduled_date
            ? initialData.scheduled_date.split("T")[0]
            : new Date().toISOString().split("T")[0],
    );
    const [status, setStatus] = useState(initialData?.status ?? "");
    const [saving, setSaving] = useState(false);

    // Used to help identify if all required fields are filled
    const allFieldsFilled = selectedRoute && selectedDriver && date;

    // Ensures inputs aren't saved when form closes
    function handleClose() {
        setSelectedRoute("");
        setSelectedDriver("");
        setSelectedVehicle("");
        setDate("");
        onClose();
    }

    function handleCancel() {
        handleClose();
    }

    // Build a partial Trip from the selected form values and pass it up
    async function handleSubmit(e: React.SubmitEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave({
                route_id_:
                    routeOptions.find((r) => r.name === selectedRoute)?.id_ ||
                    undefined,
                driver_id_: driverOptions.find(
                    (d) => d.driver_id === selectedDriver,
                )?.id_,
                scheduled_date: date,
                vehicle_id_:
                    vehicleOptions.find(
                        (v) => v.plateNumber === selectedVehicle,
                    )?.id_ || undefined,
                notes: notes || undefined,
                status: status || undefined,
            });
        } catch (error) {
            console.error("Failed to save assignment: ", error);
            alert("Failed to save assignment. Please try again.");
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
                className="relative mt-2 p-8 w-160 bg-card border border-card-border rounded-lg shadow shadow-card-border"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                    title="Close"
                >
                    <X size={20} />
                </button>

                {/* Header Text */}
                <div>
                    <h2 className="text-2xl font-semibold text-foreground mb-3">
                        {isEdit ? "Edit assignment" : "Create new assignment"}
                    </h2>
                    <p className="-mt-3 text-md text-muted-foreground">
                        {isEdit
                            ? "Update the assignment details."
                            : "Assign a trip to a driver. Fill in all required details."}
                    </p>
                </div>

                {/* Form Details */}
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col mt-4 gap-3"
                >
                    {/* Date Picker */}
                    <div className="flex flex-col gap-1">
                        <div className="flex gap-1 items-center">
                            <CalendarDays
                                size={17}
                                className="text-muted-foreground"
                            />
                            <label className="pt-0.5 text-sm font-semibold text-foreground">
                                Scheduled Date{" "}
                                <span className="text-red-500">*</span>
                            </label>
                        </div>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-background border border-btn-border rounded-md px-3 py-1.5 text-sm text-foreground 
                                focus:outline-none focus:ring-2 focus:ring-primary-foreground dark:scheme-dark"
                        />
                    </div>

                    {/* Selection Fields */}
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1 w-50">
                            <div className="flex gap-1 items-center">
                                <Route
                                    size={17}
                                    className="text-muted-foreground"
                                />
                                <label className="text-sm font-semibold text-foreground">
                                    Route{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                            </div>
                            <FormSelect
                                value={selectedRoute}
                                onChange={setSelectedRoute}
                                options={routeOptions.map((r) => r.name)}
                                placeholder="Select a route"
                            />
                        </div>
                        <div className="flex gap-10">
                            <div className="flex flex-col gap-1 w-50">
                                <div className="flex gap-1 items-center">
                                    <User
                                        size={17}
                                        className="text-muted-foreground"
                                    />
                                    <label className="text-sm font-semibold text-foreground">
                                        Driver{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                </div>
                                <FormSelect
                                    value={selectedDriver}
                                    onChange={setSelectedDriver}
                                    options={driverOptions.map(
                                        (d) => d.driver_id,
                                    )}
                                    placeholder="Select a driver"
                                />
                            </div>
                            <div className="flex flex-col gap-1 w-50">
                                <div className="flex gap-1 items-center">
                                    <Van
                                        size={19}
                                        className="text-muted-foreground"
                                    />
                                    <label className="text-sm font-semibold text-foreground">
                                        Vehicle
                                        <span className="ml-1.5 text-xs text-muted-foreground">
                                            (Optional)
                                        </span>
                                    </label>
                                </div>
                                <FormSelect
                                    value={selectedVehicle}
                                    onChange={setSelectedVehicle}
                                    options={vehicleOptions.map(
                                        (v) => v.plateNumber,
                                    )}
                                    placeholder="Select a vehicle"
                                />
                            </div>
                        </div>

                        {isEdit && (
                            <div className="flex flex-col gap-1 w-50">
                                <label className="text-sm font-semibold text-foreground">
                                    Status{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <FormSelect
                                    value={status}
                                    onChange={setStatus}
                                    options={[
                                        "PENDING",
                                        "PROCESSING",
                                        "COMPLETED",
                                        "FAILED",
                                        "CANCELLED",
                                    ]}
                                    placeholder="Select status"
                                />
                            </div>
                        )}
                    </div>

                    {/* Optional Notes */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-foreground">
                            Notes
                            <span className="ml-1.5 text-xs text-muted-foreground">
                                (Optional)
                            </span>
                        </label>
                        <textarea
                            placeholder="Any special instructions"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="bg-background border border-btn-border rounded-md px-3 py-1.5 text-sm text-foreground 
                                focus:outline-none focus:ring-2 focus:ring-primary-foreground dark:scheme-dark resize-none"
                        ></textarea>
                    </div>

                    {/* Form Buttons */}
                    <div className="flex font-semibold justify-end gap-2 mt-3.5">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-5 py-1.5 text-md rounded-md bg-btn border border-btn-border text-foreground hover:bg-secondary dark:hover:text-primary transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!allFieldsFilled || saving}
                            className={`px-5.5 py-1.5 text-md rounded-md transition duration-350 
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
                                  : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
