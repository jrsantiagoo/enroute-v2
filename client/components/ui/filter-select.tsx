"use client";

import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface FilterSelectProps {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
    className?: string;
}

// Filter Component
export default function FilterSelect({
    label,
    value,
    options,
    onChange,
}: FilterSelectProps) {
    const [open, setOpen] = useState(false);
    const isActive = value !== "All";
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div ref={ref} className="relative">
            {/* Filter Button */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`
                    flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs text-foreground
                    outline-none focus:ring-1 focus:ring-primary-foreground 
                    hover:bg-secondary dark:hover:text-primary transition group
                    ${
                        isActive
                            ? "border-primary-foreground bg-primary dark:bg-primary-foreground/40"
                            : "border-gray-300 dark:bg-card"
                    }
                `}
            >
                <span>{value === "All" ? label : value}</span>
                <ChevronDown
                    size={14}
                    className={`transition group-hover:text-foreground dark:group-hover:text-primary
                        ${open ? "rotate-180" : ""} 
                        ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                />
            </button>

            {/* Collapsable Dropdown Options */}
            {open && (
                <div
                    className="overflow-auto flex flex-col absolute left-0 top-full z-20 mt-1 w-max min-w-full max-h-72 rounded-lg border border-border 
                        bg-card shadow shadow-muted-foreground scrollbar-thumb-muted-foreground"
                >
                    <button
                        type="button"
                        onClick={() => {
                            onChange("All");
                            setOpen(false);
                        }}
                        className="rounded-t-lg px-3 py-1.5 text-left text-xs transition hover:bg-secondary dark:hover:text-primary"
                    >
                        {label}
                    </button>
                    {options.map((opt) => (
                        <button
                            type="button"
                            key={opt}
                            onClick={() => {
                                onChange(opt);
                                setOpen(false);
                            }}
                            className={`
                                px-3 py-1.5 text-left text-xs transition hover:bg-secondary dark:hover:text-primary
                                last:rounded-b-lg
                                ${value === opt ? "bg-primary dark:bg-primary-foreground/35 text-foreground" : ""}
                            `}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
