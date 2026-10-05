"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import type { Vehicle } from "@/lib/types/vehicle";
import VehicleFormModal from "./vehicle-form-modal";

interface VehicleFormProps {
    onCreate?: (data: Partial<Vehicle>) => void;
}

export default function VehicleForm({ onCreate }: VehicleFormProps) {
    const [open, setOpen] = useState(false);

    return (
        <div>
            {/* Enables Vehicle Creation */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center -mt-2 gap-2 px-4.5 py-1.5 text-sm font-semibold rounded-lg border border-btn-border bg-btn 
                    text-foreground hover:bg-secondary dark:hover:text-primary transition duration-300 cursor-pointer"
            >
                <Plus size={16} />
                Add Vehicle
            </button>

            {open && (
                <VehicleFormModal
                    onClose={() => setOpen(false)}
                    onSave={(data) => {
                        setOpen(false);
                        onCreate?.(data);
                    }}
                />
            )}
        </div>
    );
}
