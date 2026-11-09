"use client";

import { CreditCard, Phone, User, X } from "lucide-react";
import { useState } from "react";
import type { Driver, DriverPayload } from "@/lib/api/drivers";

// Mirrors the backend limit so users see the problem before the request is sent.
const MAX_FIELD_LENGTH = 100;

interface DriverFormModalProps {
    initialData?: Driver | null;
    onClose: () => void;
    onSave: (data: DriverPayload) => void | Promise<void>;
}

export default function DriverFormModal({
    initialData,
    onClose,
    onSave,
}: DriverFormModalProps) {
    const isEdit = !!initialData;

    const [driverId, setDriverId] = useState(initialData?.driverId ?? "");
    const [contactNumber, setContactNumber] = useState(
        initialData?.contactNumber ?? "",
    );
    const [licenseNumber, setLicenseNumber] = useState(
        initialData?.licenseNumber ?? "",
    );
    const [saving, setSaving] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Only the driver ID is required by the backend; contact and license are optional.
    const isTooLong = [driverId, contactNumber, licenseNumber].some(
        (value) => value.trim().length > MAX_FIELD_LENGTH,
    );
    const canSubmit = driverId.trim() !== "" && !isTooLong;

    // Empty optional fields are sent as null so an existing value can be cleared on edit.
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setSubmitError(null);
        try {
            await onSave({
                driver_id: driverId.trim(),
                contact_number: contactNumber.trim() || null,
                license_number: licenseNumber.trim() || null,
            });
            onClose();
        } catch (error: any) {
            setSubmitError(error?.message ?? "Failed to save driver.");
        } finally {
            setSaving(false);
        }
    }

    return (
        // Background Overlay
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => onClose()}
        >
            {/* Form Modal */}
            <div
                className="relative mt-2 p-8 w-240 bg-card border border-card-border rounded-lg shadow shadow-card-border"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
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
                        <div className="flex flex-col gap-1">
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

                        <div className="flex flex-col gap-1">
                            <label className="text-md font-semibold text-foreground">
                                Contact Number
                            </label>
                            <div className="relative">
                                <Phone
                                    size={19}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                                />
                                <input
                                    id="contact-number"
                                    type="text"
                                    placeholder="e.g. 0917 123 4567"
                                    value={contactNumber}
                                    onChange={(e) =>
                                        setContactNumber(e.target.value)
                                    }
                                    className="bg-background border border-btn-border rounded-lg pl-9 pr-2 py-2 text-sm text-foreground w-full
                                        focus:outline-none focus:ring-2 focus:ring-primary-foreground"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-md font-semibold text-foreground">
                                License Number
                            </label>
                            <div className="relative">
                                <CreditCard
                                    size={19}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                                />
                                <input
                                    id="license-number"
                                    type="text"
                                    placeholder="e.g. N01-23-456789"
                                    value={licenseNumber}
                                    onChange={(e) =>
                                        setLicenseNumber(e.target.value)
                                    }
                                    className="bg-background border border-btn-border rounded-lg pl-9 pr-2 py-2 text-sm text-foreground w-full
                                        focus:outline-none focus:ring-2 focus:ring-primary-foreground"
                                />
                            </div>
                        </div>
                    </div>

                    {isTooLong && (
                        <p className="text-xs text-red-500">
                            Fields must be {MAX_FIELD_LENGTH} characters or
                            fewer.
                        </p>
                    )}

                    {submitError && (
                        <p role="alert" className="text-sm text-red-500">
                            {submitError}
                        </p>
                    )}

                    <div className="flex font-semibold justify-end gap-2 mt-3.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-1.5 text-md rounded-md bg-btn border border-btn-border text-foreground hover:bg-secondary dark:hover:text-primary transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit || saving}
                            className={`px-5 py-1.5 text-md rounded-md transition duration-350
                                ${
                                    canSubmit
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
                                  : "Add driver"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
