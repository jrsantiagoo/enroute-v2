"use client";

import { useState, useCallback } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Fuel,
    Route,
    Search,
    User,
} from "lucide-react";
import { useSort } from "@/lib/hooks/useSort";
import SortableHeader from "@/components/ui/sortable-header";
import { DriverCapacity } from "@/lib/types/schema";
import StatusBadge from "../ui/status-badge";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20];

interface DriverViewProps {
    items: DriverCapacity[];
}

export default function DriverView({ items }: DriverViewProps) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const filtered = items.filter((d) => {
        const q = search.toLowerCase();
        return d.driverId.toLowerCase().includes(q);
    });

    const getItemVal = useCallback((d: DriverCapacity, key: string) => {
        switch (key) {
            case "activeHours":
                return d.activeHours.toString().padStart(5, "0");
            case "fuelConsumed":
                return d.fuelConsumed.toString().padStart(5, "0");
            case "distanceTraveled":
                return d.distanceTraveled.toString().padStart(5, "0");
            case "status":
                return d.status;
            default:
                return "";
        }
    }, []);

    const {
        sorted: sortedItems,
        state: sortState,
        toggle: toggleSort,
    } = useSort(filtered, getItemVal);

    // Paginate the sorted, filtered trips into the current page's slice
    const totalPages = Math.max(1, Math.ceil(sortedItems.length / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const startIdx = (currentPage - 1) * rowsPerPage;
    const pageRows = sortedItems.slice(startIdx, startIdx + rowsPerPage);
    const showingFrom = sortedItems.length === 0 ? 0 : startIdx + 1;
    const showingTo = Math.min(startIdx + rowsPerPage, sortedItems.length);

    return (
        <div className="rounded-xl bg-card p-6 shadow-lg shadow-primary border border-card-border">
            {/* Table Header + Search */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex -mt-4 items-center gap-2 text-lg font-bold">
                    <User size={21} className="text-primary-foreground" />
                    <h3 className="mt-1 text-foreground">
                        Driver Capacity Overview
                    </h3>
                </div>

                {/* Filtered Search */}
                <div className="relative">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                        type="text"
                        placeholder="Search drivers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-64 rounded-lg border border-card-border pl-8 pr-4 py-1.5 text-sm text-foreground outline-none transition 
                            focus:border-primary-foreground dark:bg-card placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            <div className="overflow-auto max-h-128 rounded-lg border border-card-border scrollbar-thumb-muted-foreground">
                <table className="w-full text-left text-sm border-separate border-spacing-0 whitespace-nowrap">
                    <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-900 ">
                        <tr>
                            <SortableHeader
                                sortKey="driverName"
                                sortState={sortState}
                                onToggle={toggleSort}
                                className="rounded-tl-lg"
                            >
                                <User
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Driver
                            </SortableHeader>
                            <SortableHeader
                                sortKey="activeHours"
                                sortState={sortState}
                                onToggle={toggleSort}
                            >
                                <Clock
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Active Hours
                            </SortableHeader>
                            <SortableHeader
                                sortKey="fuelConsumed"
                                sortState={sortState}
                                onToggle={toggleSort}
                            >
                                <Fuel
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Fuel Consumed
                            </SortableHeader>
                            <SortableHeader
                                sortKey="distanceTraveled"
                                sortState={sortState}
                                onToggle={toggleSort}
                            >
                                <Route
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Distance Traveled
                            </SortableHeader>
                            <SortableHeader
                                sortKey="status"
                                sortState={sortState}
                                onToggle={toggleSort}
                            >
                                Status
                            </SortableHeader>
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.map((d) => (
                            <tr
                                key={d.id_}
                                className="border-t border-card-border text-foreground hover:bg-muted-foreground/15 transition"
                            >
                                <td className="px-3 py-2 text-[13px] align-middle w-60 truncate border-b border-card-border">
                                    <div className="font-semibold">
                                        {d.driverId}
                                    </div>
                                </td>
                                <td className="px-3 py-2 text-[13px] align-middle border-b border-card-border">
                                    {d.activeHours.toFixed(1)} hrs
                                </td>
                                <td className="px-3 py-2 text-[13px] align-middle border-b border-card-border">
                                    {d.fuelConsumed.toFixed(1)} L
                                </td>
                                <td className="px-3 py-2 text-[13px] align-middle border-b border-card-border">
                                    {d.distanceTraveled.toFixed(1)} km
                                </td>
                                <td className="px-3 py-2 text-[13px] align-middle w-40 truncate border-b border-card-border">
                                    <StatusBadge status={d.status} />
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-3 py-8 text-center text-foreground"
                                >
                                    No drivers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span>Rows per page</span>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setPage(1);
                        }}
                        className="px-2 py-1 border border-btn-border rounded-md bg-card text-foreground text-xs cursor-pointer"
                    >
                        {ROWS_PER_PAGE_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                    <span>
                        | Showing {showingFrom}-{showingTo} of{" "}
                        {sortedItems.length}
                    </span>
                </div>

                {/* Change pages */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        aria-label="Previous page"
                        className="flex items-center justify-center w-7 h-7 rounded-full border border-btn-border bg-card text-muted-foreground
                            transition hover:bg-secondary dark:hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <ChevronLeft size={15} strokeWidth={2} />
                    </button>
                    <span className="text-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage >= totalPages}
                        aria-label="Next page"
                        className="flex items-center justify-center w-7 h-7 rounded-full border border-btn-border bg-card text-muted-foreground
                            transition hover:bg-secondary dark:hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <ChevronRight size={15} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </div>
    );
}
