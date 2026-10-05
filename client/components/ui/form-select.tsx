"use client";

import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, type ReactNode } from "react";

type SelectOption = string | { label: string; value: string };

interface FormSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder: string;
    icon?: ReactNode;
    displayLabel?: string;
}

export default function FormSelect({
    value,
    onChange,
    options,
    placeholder,
    icon,
    displayLabel,
}: FormSelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const selectedOption = options.find((opt) => {
        const optionValue = typeof opt === "string" ? opt : opt.value;
        return optionValue === value;
    });

    const selectedLabel =
        displayLabel ||
        (selectedOption
            ? typeof selectedOption === "string"
                ? selectedOption
                : selectedOption.label
            : value);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 w-full rounded-lg border border-btn-border 
                    px-3 py-2 text-sm text-foreground bg-background
                    focus:outline-none focus:ring-2 focus:ring-primary-foreground
                    hover:bg-secondary dark:hover:text-primary transition group"
            >
                {icon && (
                    <span
                        className="shrink-0 text-muted-foreground group-hover:text-foreground
                            dark:group-hover:text-primary"
                    >
                        {icon}
                    </span>
                )}
                <span
                    className={`flex-1 text-left 
                        ${!value ? "text-muted-foreground group-hover:text-foreground dark:group-hover:text-primary" : ""}`}
                >
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown
                    size={14}
                    className={`shrink-0 text-muted-foreground group-hover:text-foreground 
                        dark:group-hover:text-primary transition 
                        ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div
                    className="overflow-auto absolute left-0 top-full z-10 mt-1 w-full max-h-48 
                    rounded-lg border border-border bg-card shadow shadow-muted-foreground
                    scrollbar-thumb-muted-foreground"
                >
                    {options.map((opt) => {
                        const optionValue =
                            typeof opt === "string" ? opt : opt.value;
                        const optionLabel =
                            typeof opt === "string" ? opt : opt.label;
                        return (
                            <button
                                type="button"
                                key={optionValue}
                                onClick={() => {
                                    onChange(optionValue);
                                    setOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-sm text-left transition 
                                    hover:bg-secondary dark:hover:text-primary
                                    first:rounded-t-lg last:rounded-b-lg
                                    ${
                                        value === optionValue
                                            ? "bg-primary dark:bg-primary-foreground/35 text-foreground"
                                            : ""
                                    }`}
                            >
                                {optionLabel}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
