"use client";

import { useState, useCallback } from "react";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Search,
    User,
    X,
} from "lucide-react";
import { useSort } from "@/lib/hooks/useSort";
import SortableHeader from "@/components/ui/sortable-header";
import type { Trip } from "@/lib/types/schema";
import type { Driver } from "@/lib/types/schema";

interface CalendarViewProps {
    trips: Trip[];
    drivers: Driver[];
    onDeleted: (tripId: string) => void;
}

// Compute the Monday–Sunday range for a given date
function getWeekRange(date: Date) {
    const dayOfWeek = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { monday, sunday };
}

function formatDate(d: Date) {
    return d.toISOString().slice(0, 10);
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];
const ROWS_PER_PAGE_OPTIONS = [5, 10, 20];

export default function CalendarView({
    trips,
    drivers,
    onDeleted,
}: CalendarViewProps) {
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        return getWeekRange(new Date()).monday;
    });
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const weekRange = getWeekRange(currentWeekStart);
    const weekDates = DAYS.map((_, i) => {
        const d = new Date(weekRange.monday);
        d.setDate(weekRange.monday.getDate() + i);
        return d;
    });

    const weekStartStr = formatDate(weekRange.monday);
    const weekEndStr = formatDate(weekRange.sunday);

    // Filter trips that fall within the current week
    const weekTrips = trips.filter((t) => {
        if (!t.scheduled_date || !t.driver_id_ || !t.route) return false;
        const d = t.scheduled_date.split("T")[0];
        return d >= weekStartStr && d <= weekEndStr;
    });

    // Build a grid keyed by driver_id -> day name -> assignments
    const grid: Record<
        string,
        Record<string, { tripId: string; routeName: string }[]>
    > = {};
    for (const trip of weekTrips) {
        const driverKey =
            trip.agent_profile?.driver_id || trip.driver_id_ || "";
        const dayIndex = new Date(trip.scheduled_date).getDay();
        const dayName = DAYS[(dayIndex + 6) % 7];
        if (!grid[driverKey]) grid[driverKey] = {};
        if (!grid[driverKey][dayName]) grid[driverKey][dayName] = [];
        grid[driverKey][dayName].push({
            tripId: trip.id_,
            routeName: trip.route?.name || "",
        });
    }

    // Filter drivers by the search query (matches against driver code)
    const filteredDrivers = drivers.filter((d) => {
        if (!search) return true;
        return d.driver_id.toLowerCase().includes(search.toLowerCase());
    });

    // Sort drivers by the selected column (only driver_id for calendar)
    const getDriverVal = useCallback(
        (d: Driver, _key: string) => d.driver_id,
        [],
    );
    const {
        sorted: sortedDrivers,
        state: sortState,
        toggle: toggleSort,
    } = useSort(filteredDrivers, getDriverVal);

    function prevWeek() {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() - 7);
        setCurrentWeekStart(d);
    }

    function nextWeek() {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + 7);
        setCurrentWeekStart(d);
    }

    const todayStr = formatDate(new Date());

    const startMonth = MONTH_NAMES[weekRange.monday.getMonth()];
    const endMonth = MONTH_NAMES[weekRange.sunday.getMonth()];
    const weekLabel =
        startMonth === endMonth
            ? `${startMonth} ${weekRange.monday.getDate()} - ${weekRange.sunday.getDate()}, ${weekRange.monday.getFullYear()}`
            : `${startMonth} ${weekRange.monday.getDate()} - ${endMonth} ${weekRange.sunday.getDate()}, ${weekRange.monday.getFullYear()}`;

    // Paginate the sorted, filtered trips into the current page's slice
    const totalPages = Math.max(
        1,
        Math.ceil(sortedDrivers.length / rowsPerPage),
    );
    const currentPage = Math.min(page, totalPages);
    const startIdx = (currentPage - 1) * rowsPerPage;
    const pageRows = sortedDrivers.slice(startIdx, startIdx + rowsPerPage);
    const showingFrom = sortedDrivers.length === 0 ? 0 : startIdx + 1;
    const showingTo = Math.min(startIdx + rowsPerPage, sortedDrivers.length);

    return (
        <div className="rounded-xl bg-card p-6 shadow-lg shadow-primary border border-card-border">
            {/* Calendar View Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="flex -mt-2 items-center gap-2 text-lg font-bold">
                        <Calendar
                            size={21}
                            className="text-primary-foreground"
                        />
                        <h2 className="mt-1 text-foreground">Weekly View</h2>
                    </div>
                    <p className="-mb-2 text-[13px] text-muted-foreground">
                        {weekLabel}
                    </p>
                </div>

                <div className="flex items-center gap-1">
                    {/* Enables calendar to view previous week */}
                    <button
                        onClick={prevWeek}
                        className="p-1 rounded-md hover:bg-secondary dark:hover:text-primary transition"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    {/* Enables calendar to view current week */}
                    <button
                        onClick={() =>
                            setCurrentWeekStart(getWeekRange(new Date()).monday)
                        }
                        className="px-3 py-1 text-xs font-semibold rounded-md border border-btn-border 
                            dark:border-foreground hover:bg-secondary dark:hover:text-primary transition"
                    >
                        Today
                    </button>
                    {/* Enables calendar to view next week */}
                    <button
                        onClick={nextWeek}
                        className="p-1 rounded-md hover:bg-secondary dark:hover:text-primary transition"
                    >
                        <ChevronRight size={18} />
                    </button>

                    {/* Filtered Search */}
                    <div className="ml-1.5 relative">
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
            </div>

            <div className="overflow-auto max-h-128 rounded-lg border border-card-border scrollbar-thumb-muted-foreground">
                <table className="w-full text-sm border-separate border-spacing-0">
                    <thead className="sticky top-0 z-20 bg-gray-50 dark:bg-slate-900 ">
                        <tr>
                            <SortableHeader
                                sortKey="driver_id"
                                sortState={sortState}
                                onToggle={toggleSort}
                                className="sticky left-0 z-30 min-w-30 text-sm! border-r border-b border-card-border rounded-tl-lg"
                            >
                                <User
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Driver
                            </SortableHeader>
                            {/* Creates Days of the Week Columns */}
                            {weekDates.map((d, i) => {
                                const dateStr = formatDate(d);
                                const isToday = dateStr === todayStr;
                                return (
                                    <th
                                        key={i}
                                        className={`px-2 py-2 text-center font-semibold border-r border-b border-card-border min-w-25 
                                            ${i === 6 ? "rounded-tr-lg" : ""} ${
                                                isToday
                                                    ? "bg-primary/10 text-primary-foreground"
                                                    : "text-foreground"
                                            }`}
                                    >
                                        <div>{DAYS[i]}</div>
                                        <div className="text-xs font-normal">
                                            {d.getMonth() + 1}/{d.getDate()}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {drivers.length === 0 && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-3 py-8 text-center text-muted-foreground"
                                >
                                    No drivers available.
                                </td>
                            </tr>
                        )}
                        {pageRows.map((driver) => (
                            <tr key={driver.id_}>
                                <td className="sticky left-0 bg-card z-10 px-2 py-2 font-semibold text-foreground border-r border-b border-card-border">
                                    <div className="font-semibold">
                                        {driver.driver_id}
                                    </div>
                                </td>
                                {DAYS.map((day) => {
                                    const assignments =
                                        grid[driver.driver_id]?.[day] || [];
                                    return (
                                        <td
                                            key={day}
                                            className={`px-1 py-1 border-r border-b border-card-border align-top ${
                                                assignments.length === 0
                                                    ? "text-muted-foreground"
                                                    : ""
                                            }`}
                                        >
                                            {assignments.length === 0 ? (
                                                <span className="text-xs px-1">
                                                    —
                                                </span>
                                            ) : (
                                                <div className="flex flex-col gap-0.5">
                                                    {assignments.map((a) => (
                                                        <div
                                                            key={a.tripId}
                                                            className="group flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5 text-xs gap-1"
                                                        >
                                                            <span className="truncate">
                                                                {a.routeName}
                                                            </span>
                                                            <button
                                                                onClick={() =>
                                                                    onDeleted(
                                                                        a.tripId,
                                                                    )
                                                                }
                                                                className="rounded-full w-3 h-3 text-center text-red-500 hover:text-red-700 font-semibold 
                                                                    dark:hover:bg-muted-foreground transition shrink-0 leading-none"
                                                                title="Remove assignment"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
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
                        {sortedDrivers.length}
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
