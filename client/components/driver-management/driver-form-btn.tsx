"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import type { DriverPayload } from "@/lib/api/drivers";
import DriverFormModal from "@/components/driver-management/driver-form-modal";

interface DriverFormBtnProps {
    onCreate: (data: DriverPayload) => void | Promise<void>;
}

export default function DriverFormBtn({ onCreate }: DriverFormBtnProps) {
    const [open, setOpen] = useState(false);

    return (
        <div>
            {/* Enables Driver Creation */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center -mt-2 gap-2 px-4.5 py-1.5 text-sm font-semibold rounded-lg border border-btn-border bg-btn
                    text-foreground hover:bg-secondary dark:hover:text-primary transition duration-300 cursor-pointer"
            >
                <Plus size={16} />
                Add Driver
            </button>

            {/* The modal closes itself once onCreate succeeds, so failures keep the input */}
            {open && (
                <DriverFormModal
                    onClose={() => setOpen(false)}
                    onSave={onCreate}
                />
            )}
        </div>
    );
}
