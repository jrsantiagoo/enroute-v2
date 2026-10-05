"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

export type Preset =
    | "today"
    | "thisWeek"
    | "thisMonth"
    | "thisYear"
    | "allTime"
    | "custom";

export interface DateRange {
    start: string;
    end: string;
}

export interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    preset: Preset;
    onChange: (range: DateRange & { preset: Preset }) => void;
}

function getPresetRange(preset: Preset): DateRange {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    switch (preset) {
        case "today":
            return { start: today, end: today };
        case "thisWeek": {
            const dayOfWeek = now.getDay();
            const monday = new Date(now);
            monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
            return {
                start: monday.toISOString().slice(0, 10),
                end: today,
            };
        }
        case "thisMonth": {
            const first = new Date(now.getFullYear(), now.getMonth(), 1);
            return {
                start: first.toISOString().slice(0, 10),
                end: today,
            };
        }
        case "thisYear": {
            const first = new Date(now.getFullYear(), 0, 1);
            return {
                start: first.toISOString().slice(0, 10),
                end: today,
            };
        }
        case "allTime":
            return { start: "2024-01-01", end: today };
        case "custom":
            return { start: today, end: today };
    }
}

const presetLabels: Record<Preset, string> = {
    today: "Today",
    thisWeek: "This Week",
    thisMonth: "This Month",
    thisYear: "This Year",
    allTime: "All Time",
    custom: "Custom",
};

export default function DateRangePicker({
    startDate,
    endDate,
    preset,
    onChange,
}: DateRangePickerProps) {
    const [open, setOpen] = useState(false);
    const [customStart, setCustomStart] = useState(startDate);
    const [customEnd, setCustomEnd] = useState(endDate);
    const ref = useRef<HTMLDivElement>(null);

    // Sync local custom inputs when controlled values change
    useEffect(() => {
        setCustomStart(startDate);
        setCustomEnd(endDate);
    }, [startDate, endDate]);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function handlePresetClick(p: Preset) {
        if (p === "custom") {
            onChange({ start: customStart, end: customEnd, preset: "custom" });
        } else {
            const range = getPresetRange(p);
            onChange({ ...range, preset: p });
        }
    }

    const label =
        preset === "custom"
            ? `${startDate || "…"} – ${endDate || "…"}`
            : presetLabels[preset];

    return (
        <div className="relative" ref={ref}>
            {/* Date Range Picker button */}
            <button
                onClick={() => setOpen((p) => !p)}
                className="flex items-center rounded-lg gap-2 px-3 py-1.5 bg-btn text-sm font-semibold 
                    border border-btn-border text-foreground hover:bg-secondary dark:hover:text-primary transition"
            >
                <CalendarDays size={16} />
                {label}
                <ChevronDown
                    size={16}
                    className={`text-muted-foreground dark:text-primary-foreground transition ${open ? "rotate-180" : ""}`}
                />
            </button>

            {/* Collapsable date range picker widget */}
            {open && (
                <div className="absolute right-0 mt-2 p-4 w-72 z-30 bg-card border border-border rounded-md shadow shadow-muted-foreground">
                    <h4 className="text-sm font-semibold text-foreground mb-3">
                        Date Range
                    </h4>

                    {/* Maps preset buttons for date ranges */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {(
                            [
                                "today",
                                "thisWeek",
                                "thisMonth",
                                "thisYear",
                                "allTime",
                            ] as Preset[]
                        ).map((p) => (
                            <button
                                key={p}
                                onClick={() => handlePresetClick(p)}
                                className={`px-2 py-1 text-sm rounded-md transition ${
                                    preset === p
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-background text-foreground hover:bg-secondary dark:hover:text-primary"
                                }`}
                            >
                                {presetLabels[p]}
                            </button>
                        ))}
                    </div>

                    {/* Custom Range Picker */}
                    <div className="border-t border-border pt-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                            Custom Range
                        </p>
                        <div className="flex flex-col gap-2">
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => {
                                    setCustomStart(e.target.value);
                                }}
                                className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground w-full 
                                    focus:outline-none focus:ring-2 focus:ring-primary-foreground dark:scheme-dark"
                            />
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => {
                                    setCustomEnd(e.target.value);
                                }}
                                className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground w-full 
                                    focus:outline-none focus:ring-2 focus:ring-primary-foreground dark:scheme-dark"
                            />
                        </div>
                        <div className="flex justify-end mt-3">
                            <button
                                onClick={() => {
                                    handlePresetClick("custom");
                                    setOpen(false);
                                }}
                                className="px-3.5 py-1 text-sm font-medium text-primary-foreground bg-primary rounded-md 
                                    hover:bg-secondary transition"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
