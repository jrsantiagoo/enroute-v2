"use client";

import { useCallback, useMemo, useState } from "react";
import {
    Search,
    ArchiveIcon,
    Eye,
    User,
    Van,
    Ellipsis,
    PenLine,
    RotateCcw,
    Clock,
    ChevronLeft,
    ChevronRight,
    Fuel,
    Route,
    X,
} from "lucide-react";
import type { MockDriver } from "@/lib/mock/driver-mock-data";
import { useSort } from "@/lib/hooks/useSort";
import SortableHeader from "@/components/ui/sortable-header";
import FilterSelect from "../ui/filter-select";
import DateRangePicker, {
    type Preset,
    type DateRange,
} from "@/components/dashboard/date-range-picker";
import { useTableActionsMenu } from "@/lib/hooks/useTableActionsMenu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
import StatusBadge from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/routing/formatters";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20];
const DISTANCE_OPTIONS = ["< 50 km", "50 - 100 km", "> 100 km"];
const FUEL_OPTIONS = ["< 5 L", "5 - 15 L", "> 15 L"];
const HOURS_OPTIONS = ["< 4 hrs", "4 - 8 hrs", "> 8 hrs"];

interface DriverProps {
    drivers: MockDriver[];
    onView?: (driver: MockDriver) => void;
    onEdit?: (driver: MockDriver) => void;
    onArchive?: (driver: MockDriver) => void;
    onUnarchive?: (driver: MockDriver) => void;
}

export default function DriverTable({
    drivers,
    onEdit,
    onView,
    onArchive,
    onUnarchive,
}: DriverProps) {
    const [search, setSearch] = useState("");
    const [view, setView] = useState<"active" | "archived">("active");
    const { activeMenu, setActiveMenu, anchor, menuRef, openMenu } =
        useTableActionsMenu();
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Date Range state
    const [range, setRange] = useState<{
        start: string;
        end: string;
        preset: Preset;
    }>(() => {
        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - diff,
        );
        const firstOfWeek = `${monday.getFullYear()}-${String(
            monday.getMonth() + 1,
        ).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
        return { start: firstOfWeek, end: today, preset: "thisWeek" };
    });

    // Filter states
    const [distanceFilter, setDistanceFilter] = useState("All");
    const [fuelFilter, setFuelFilter] = useState("All");
    const [hoursFilter, setHoursFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    const hasActiveFilters =
        distanceFilter !== "All" ||
        fuelFilter !== "All" ||
        hoursFilter !== "All" ||
        statusFilter !== "All";

    const handleClearFilters = () => {
        setDistanceFilter("All");
        setFuelFilter("All");
        setHoursFilter("All");
        setStatusFilter("All");
        setPage(1);
    };

    const isArchived = (d: MockDriver) => Boolean(d.archived || d.archivedAt);

    const statusOptions = useMemo(() => {
        const statuses = Array.from(
            new Set(drivers.map((d) => d.status).filter(Boolean)),
        );
        return statuses.length > 0 ? statuses : ["ACTIVE", "INACTIVE"];
    }, [drivers]);

    // Combined filtering: tab view, date range, search query, and numeric/status filters
    const filtered = useMemo(() => {
        return drivers
            .filter((d) =>
                view === "archived" ? isArchived(d) : !isArchived(d),
            )
            .filter((d) => {
                const q = search.toLowerCase();
                const matchesSearch =
                    !search ||
                    d.driverName?.toLowerCase().includes(q) ||
                    d.driverId?.toLowerCase().includes(q);

                let matchesDate = true;
                if (range.preset !== "allTime" && d.date) {
                    const itemDate = d.date.split("T")[0];
                    matchesDate =
                        itemDate >= range.start && itemDate <= range.end;
                }

                let matchesDistance = true;
                if (distanceFilter === "< 50 km") {
                    matchesDistance = d.distanceTraveled < 50;
                } else if (distanceFilter === "50 - 100 km") {
                    matchesDistance =
                        d.distanceTraveled >= 50 && d.distanceTraveled <= 100;
                } else if (distanceFilter === "> 100 km") {
                    matchesDistance = d.distanceTraveled > 100;
                }

                let matchesFuel = true;
                if (fuelFilter === "< 5 L") {
                    matchesFuel = d.fuelConsumed < 5;
                } else if (fuelFilter === "5 - 15 L") {
                    matchesFuel = d.fuelConsumed >= 5 && d.fuelConsumed <= 15;
                } else if (fuelFilter === "> 15 L") {
                    matchesFuel = d.fuelConsumed > 15;
                }

                let matchesHours = true;
                if (hoursFilter === "< 4 hrs") {
                    matchesHours = d.activeHours < 4;
                } else if (hoursFilter === "4 - 8 hrs") {
                    matchesHours = d.activeHours >= 4 && d.activeHours <= 8;
                } else if (hoursFilter === "> 8 hrs") {
                    matchesHours = d.activeHours > 8;
                }

                const matchesStatus =
                    statusFilter === "All" ||
                    d.status.toUpperCase() === statusFilter.toUpperCase();

                return (
                    matchesSearch &&
                    matchesDate &&
                    matchesDistance &&
                    matchesFuel &&
                    matchesHours &&
                    matchesStatus
                );
            });
    }, [
        drivers,
        view,
        search,
        range,
        distanceFilter,
        fuelFilter,
        hoursFilter,
        statusFilter,
    ]);

    // Sorting column accessor
    const getDriverVal = useCallback(
        (d: MockDriver, key: string) => {
            switch (key) {
                case "driver_name":
                    return d.driverName;
                case "active_hours":
                    return d.activeHours.toString().padStart(5, "0");
                case "fuel_consumed":
                    return d.fuelConsumed.toString().padStart(5, "0");
                case "distance_traveled":
                    return d.distanceTraveled.toString().padStart(5, "0");
                case "most_driven":
                    return d.mostDrivenVehicleType;
                case "top3_vehicles":
                    return d.topThreeVehicles;
                case "archivedAt":
                    return view === "archived"
                        ? (d.archivedAt ?? "")
                        : (d.lastModified ?? "");
                case "status":
                    return d.status;
                default:
                    return "";
            }
        },
        [view],
    );

    const {
        sorted: sortedDrivers,
        state: sortState,
        toggle: toggleSort,
    } = useSort(filtered, getDriverVal);

    // Pagination slice
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
            {/* Header + View Toggle + DateRangePicker + Search */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-base font-semibold">
                    <User size={21} className="text-primary-foreground" />
                    <h2 className="mt-1 text-foreground">Driver List</h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Active / Archived toggle */}
                    <div className="flex items-center rounded-lg border border-card-border bg-card">
                        {(["active", "archived"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setView(tab);
                                    setPage(1);
                                }}
                                className={`flex items-center px-3.5 py-1.5 text-sm font-semibold rounded-md transition capitalize
                                    ${
                                        view === tab
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-secondary dark:hover:text-primary"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Time Period Selector */}
                    <DateRangePicker
                        startDate={range.start}
                        endDate={range.end}
                        preset={range.preset}
                        onChange={(newRange) => {
                            setRange(newRange);
                            setPage(1);
                        }}
                    />

                    {/* Filtered Search */}
                    <div className="relative">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                            type="text"
                            placeholder="Search by driver..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-64 rounded-lg border border-card-border pl-8 pr-4 py-1.5 text-sm text-foreground outline-none transition 
                                focus:border-primary-foreground dark:bg-card placeholder:text-muted-foreground"
                        />
                    </div>
                </div>
            </div>

            {/* Filter Options + Clear Filters Button */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <FilterSelect
                    label="All Distance Traveled"
                    value={distanceFilter}
                    options={DISTANCE_OPTIONS}
                    onChange={(v) => {
                        setDistanceFilter(v);
                        setPage(1);
                    }}
                />
                <FilterSelect
                    label="All Fuel Consumed"
                    value={fuelFilter}
                    options={FUEL_OPTIONS}
                    onChange={(v) => {
                        setFuelFilter(v);
                        setPage(1);
                    }}
                />
                <FilterSelect
                    label="All Active Hours"
                    value={hoursFilter}
                    options={HOURS_OPTIONS}
                    onChange={(v) => {
                        setHoursFilter(v);
                        setPage(1);
                    }}
                />
                <FilterSelect
                    label="All Statuses"
                    value={statusFilter}
                    options={statusOptions}
                    onChange={(v) => {
                        setStatusFilter(v);
                        setPage(1);
                    }}
                />

                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={handleClearFilters}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-secondary hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
                        title="Clear all filters"
                        aria-label="Clear all filters"
                    >
                        <X size={14} className="shrink-0" />
                        <span>Clear filters</span>
                    </button>
                )}
            </div>

            {/* Drivers Table View */}
            <div className="overflow-auto max-h-128 rounded-lg border border-card-border scrollbar-thumb-muted-foreground">
                <table className="w-full text-left text-sm border-separate border-spacing-0 whitespace-nowrap">
                    <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-900">
                        <tr>
                            <SortableHeader
                                sortKey="driver_name"
                                sortState={sortState}
                                onToggle={toggleSort}
                                className="rounded-tl-lg"
                            >
                                <User
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Drivers
                            </SortableHeader>
                            <SortableHeader
                                sortKey="active_hours"
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
                                sortKey="fuel_consumed"
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
                                sortKey="distance_traveled"
                                sortState={sortState}
                                onToggle={toggleSort}
                            >
                                <Route
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Distance Travelled
                            </SortableHeader>
                            <SortableHeader
                                sortKey="most_driven"
                                sortState={sortState}
                                onToggle={toggleSort}
                            >
                                <Van
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Freq Vehicle Type
                            </SortableHeader>
                            <SortableHeader
                                sortKey="top3_vehicles"
                                sortState={sortState}
                                onToggle={toggleSort}
                            >
                                <Van
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Top 3 Vehicles
                            </SortableHeader>
                            <SortableHeader
                                sortKey="archivedAt"
                                sortState={sortState}
                                onToggle={toggleSort}
                            >
                                <Clock
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                {view === "archived"
                                    ? "Archived At"
                                    : "Last Modified"}
                            </SortableHeader>
                            <SortableHeader
                                sortKey="status"
                                sortState={sortState}
                                onToggle={toggleSort}
                            >
                                Status
                            </SortableHeader>
                            <th className="px-4 py-3 text-xs font-bold text-foreground border-b border-card-border">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.map((d) => (
                            <tr
                                key={d.id_}
                                className="border-b border-card-border text-foreground hover:bg-muted-foreground/15 transition"
                            >
                                <td className="px-4 py-3.5 text-[13px] align-middle font-medium max-w-40 truncate border-b border-card-border">
                                    <div className="font-semibold">
                                        {d.driverName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {d.driverId}
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 text-[13px] align-middle font-medium border-b border-card-border">
                                    {d.activeHours} hrs
                                </td>
                                <td className="px-4 py-3.5 text-[13px] align-middle border-b border-card-border">
                                    {d.fuelConsumed} L
                                </td>
                                <td className="px-4 py-3.5 text-[13px] align-middle font-semibold border-b border-card-border">
                                    {d.distanceTraveled} km
                                </td>
                                <td className="px-4 py-3.5 text-[13px] align-middle border-b border-card-border">
                                    {d.mostDrivenVehicleType ?? "—"}
                                </td>
                                <td className="px-4 py-3.5 text-[13px] align-middle border-b border-card-border">
                                    {d.topThreeVehicles ?? "—"}
                                </td>
                                <td className="px-4 py-3.5 text-[13px] align-middle border-b border-card-border">
                                    {view === "archived"
                                        ? d.archivedAt
                                            ? formatDateTime(d.archivedAt)
                                            : "—"
                                        : d.lastModified
                                          ? formatDateTime(d.lastModified)
                                          : "—"}
                                </td>
                                <td className="px-4 py-3.5 text-[13px] align-middle border-b border-card-border">
                                    <StatusBadge status={d.status} />
                                </td>
                                <td className="pl-7 px-4 py-3.5 align-middle relative border-b border-card-border">
                                    <button
                                        onClick={(e) => openMenu(d.id_, e)}
                                        className="p-1 rounded-md text-muted-foreground bg-btn border border-btn-border 
                                            hover:bg-secondary hover:text-primary-foreground dark:text-foreground transition
                                            cursor-pointer"
                                        title="More actions"
                                    >
                                        <Ellipsis size={16} />
                                    </button>

                                    {activeMenu === d.id_ && anchor && (
                                        <TableActionsMenu
                                            ref={menuRef}
                                            anchor={anchor}
                                            actions={[
                                                {
                                                    label: "View",
                                                    icon: <Eye size={15} />,
                                                    onClick: () => {
                                                        onView?.(d);
                                                        setActiveMenu(null);
                                                    },
                                                },
                                                {
                                                    label: "Edit",
                                                    icon: <PenLine size={15} />,
                                                    onClick: () => {
                                                        onEdit?.(d);
                                                        setActiveMenu(null);
                                                    },
                                                },
                                                {
                                                    label:
                                                        view === "archived"
                                                            ? "Unarchive"
                                                            : "Archive",
                                                    icon:
                                                        view === "archived" ? (
                                                            <RotateCcw
                                                                size={15}
                                                            />
                                                        ) : (
                                                            <ArchiveIcon
                                                                size={15}
                                                            />
                                                        ),
                                                    onClick: () => {
                                                        if (
                                                            view === "archived"
                                                        ) {
                                                            onUnarchive?.(d);
                                                        } else {
                                                            onArchive?.(d);
                                                        }
                                                        setActiveMenu(null);
                                                    },
                                                    variant: "danger",
                                                },
                                            ]}
                                        />
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    {view === "archived"
                                        ? "No archived drivers."
                                        : "No drivers found."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
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

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        aria-label="Previous page"
                        className="flex items-center justify-center w-7 h-7 rounded-full border border-btn-border bg-btn text-muted-foreground
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
                        className="flex items-center justify-center w-7 h-7 rounded-full border border-btn-border bg-btn text-muted-foreground
                            transition hover:bg-secondary dark:hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <ChevronRight size={15} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </div>
    );
}
