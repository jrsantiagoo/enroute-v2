"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import AssignmentFormModal from "./assignment-form-modal";
import { Driver, RoutePlan, Trip } from "@/lib/types/schema";
import { Vehicle } from "@/lib/types/vehicle";
import { createTrip } from "@/lib/api/trips";

interface AssignmentFormProps {
    routeOptions: RoutePlan[];
    driverOptions: Driver[];
    vehicleOptions: Vehicle[];
    onCreated: (newTrip: Trip) => void;
}

export default function AssignmentForm({
    routeOptions,
    driverOptions,
    vehicleOptions,
    onCreated,
}: AssignmentFormProps) {
    const [open, setOpen] = useState(false);

    // Build a MockTrip from the submitted form values and pass it up
    async function handleSave(data: Partial<Trip>) {
        console.log(data);
        onCreated(data as Trip);
        setOpen(false);
    }

    return (
        <div>
            {/* Enables Assignments */}
            <button
                onClick={() => setOpen((p) => !p)}
                className="flex items-center -mt-2 gap-2 px-3.5 py-1.5 text-sm font-semibold rounded-lg border border-btn-border bg-btn 
                    text-foreground hover:bg-secondary dark:hover:text-primary transition duration-300 cursor-pointer"
            >
                <Plus size={16} />
                New Assignment
            </button>

            {open && (
                <AssignmentFormModal
                    routeOptions={routeOptions}
                    driverOptions={driverOptions}
                    vehicleOptions={vehicleOptions}
                    onClose={() => setOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
