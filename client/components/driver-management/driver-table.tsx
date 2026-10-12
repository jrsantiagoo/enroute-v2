"use client";

import { useCallback, useState } from "react";
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
} from "lucide-react";
import type { mockDriver } from "@/lib/mock/driver-mock-data";
import { useSort } from "@/lib/hooks/useSort";
import SortableHeader from "@/components/ui/sortable-header";
import FilterSelect from "../ui/filter-select";
import { useTableActionsMenu } from "@/lib/hooks/useTableActionsMenu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
import StatusBadge from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/routing/formatters";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20];

interface DriverProps {
    drivers: mockDriver[];
    onView?: (drivers: mockDriver) => void;
    onEdit?: (drivers: mockDriver) => void;
    onArchive?: (drivers: mockDriver) => void;
    onUnarchive?: (drivers: mockDriver) => void;
}

export default function DriverTable({
    drivers,
    onEdit,
    onView,
    onArchive,
    onUnarchive,
}: DriverProps) {
    const [search, setSearch] = useState("");
    // Toggles between the Active and Archived views
    const [view, setView] = useState<"active" | "archived">("active");
    const { activeMenu, setActiveMenu, anchor, menuRef, openMenu } =
        useTableActionsMenu();
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Used to determine whether a vehicle belongs to the Active or Archived view
    const isArchived = (d: mockDriver) => Boolean(d.archived || d.archivedAt);

    // Filter trips by the selected view, then by route name or driver ID
    const filtered = drivers
        .filter((d) => (view === "archived" ? isArchived(d) : !isArchived(d)))
        .filter((d) => {
            const q = search.toLowerCase();
            const matchesSearch =
                d.driverName?.toLowerCase().includes(q) ||
                d.driverId?.toLowerCase().includes(q) ||
                false;
            return matchesSearch;
        });

    // Sort records by the currently active column
    const getDriverVal = useCallback(
        (d: mockDriver, key: string) => {
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
                    // The date column sorts by Last Modified in the Active tab and
                    // by Archived At in the Archived tab, matching what it shows.
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

    // Paginate the sorted, filtered vehicles into the current page's slice
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
            {/* Table Header + Filter + Search */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-base font-semibold">
                    <User size={21} className="text-primary-foreground" />
                    <h2 className="mt-1 text-foreground">Driver List</h2>
                </div>

                {/* Active / Archived toggle + Filtered Search */}
                <div className="flex items-center gap-2">
                    {/* Active / Archived toggle */}
                    <div className="flex items-center rounded-lg border border-card-border bg-card">
                        {(["active", "archived"] as const).map((d) => (
                            <button
                                key={d}
                                onClick={() => {
                                    setView(d);
                                    setPage(1);
                                }}
                                className={`flex items-center px-3.5 py-1.5 text-sm font-semibold rounded-md transition capitalize
                                    ${
                                        view === d
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-secondary dark:hover:text-primary"
                                    }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>

                    {/* Filtered Search */}
                    <div className="relative">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                            type="text"
                            placeholder="Search by vehicle..."
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

            {/* Filter Options */}
            {/* <div className="-mt-4 mb-3 flex flex-wrap gap-2">
                <FilterSelect
                    label="All Routes"
                    value={routeFilter}
                    options={routeOptions}
                    onChange={setRouteFilter}
                />
                <FilterSelect
                    label="All Drivers"
                    value={driverFilter}
                    options={driverOptions}
                    onChange={setDriverFilter}
                />
                <FilterSelect
                    label="All Scheduled Dates"
                    value={scheduledFilter}
                    options={scheduledOptions}
                    onChange={setScheduledFilter}
                />
                <FilterSelect
                    label="All Statuses"
                    value={statusFilter}
                    options={statusOptions}
                    onChange={setStatusFilter}
                />
            </div> */}

            {/* Route Assignment Table View */}
            <div className="overflow-auto max-h-128 rounded-lg border border-card-border scrollbar-thumb-muted-foreground">
                <table className="w-full text-left text-sm border-separate border-spacing-0 whitespace-nowrap">
                    <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-900 ">
                        <tr>
                            <SortableHeader
                                sortKey="vehicle_plate"
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
                                sortKey="vehicle_type"
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
                                sortKey="last_driver"
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
                                sortKey="weight_capacity"
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
                                sortKey="target"
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
                                sortKey="avg_performance"
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
                                {/* <td className="px-4 py-3.5 text-[13px] align-middle border-b border-card-border">
                                    {d.lastDriver == "" ? (
                                        <div className="italic text-muted-foreground border-b border-card-border">
                                            No assigned driver
                                        </div>
                                    ) : (
                                        d.lastDriver
                                    )}
                                </td> */}

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
                                            // Menu renders in a viewport-fixed portal so it pops out of the scroll container
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
