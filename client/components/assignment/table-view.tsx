"use client";

import { useState, useCallback } from "react";
import {
    CalendarClock,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Clock,
    Eye,
    Route,
    Search,
    PenLine,
    ArchiveIcon,
    User,
    Fuel,
    Ellipsis,
    Van,
    RotateCcw,
} from "lucide-react";
import type { Trip } from "@/lib/types/schema";
import { useSort } from "@/lib/hooks/useSort";
import SortableHeader from "@/components/ui/sortable-header";
import FilterSelect from "../ui/filter-select";
import { useTableActionsMenu } from "@/lib/hooks/useTableActionsMenu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
import StatusBadge from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/routing/formatters";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20];

interface TableViewProps {
    trips: Trip[];
    archivedIds?: string[];

    onView?: (trip: Trip) => void;
    onEdit?: (trip: Trip) => void;
    onArchive?: (tripId: string) => void;
    onUnarchive?: (tripId: string) => void;
}

export default function TableView({
    trips,
    archivedIds,
    onView,
    onEdit,
    onArchive,
    onUnarchive,
}: TableViewProps) {
    const [search, setSearch] = useState("");
    // Toggles between the Active and Archived views
    const [view, setView] = useState<"active" | "archived">("active");
    const [routeFilter, setRouteFilter] = useState("All");
    const [driverFilter, setDriverFilter] = useState("All");
    const [scheduledFilter, setScheduledFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { activeMenu, setActiveMenu, anchor, menuRef, openMenu } =
        useTableActionsMenu();

    // Needed for filtering options
    const routeOptions = [
        ...new Set(trips.map((t) => t.route?.name).filter(Boolean)),
    ] as string[];
    const driverOptions = [
        ...new Set(
            trips.map((t) => t.agent_profile?.driver_id).filter(Boolean),
        ),
    ] as string[];
    const scheduledOptions = [
        ...new Set(
            trips
                .map((t) => t.scheduled_date)
                .filter(Boolean)
                .map((d) => formatDateTime(d)),
        ),
    ] as string[];
    const statusOptions = [...new Set(trips.map((t) => t.status))];

    // Used to determine whether a trip belongs to the Active or Archived view
    const isArchived = (t: Trip) => archivedIds?.includes(t.id_) ?? false;

    // Filter trips by the selected view, then by route name or driver ID
    const filtered = trips
        .filter((t) => (view === "archived" ? isArchived(t) : !isArchived(t)))
        .filter((t) => {
            const q = search.toLowerCase();
            const matchesSearch =
                t.route?.name?.toLowerCase().includes(q) ||
                t.agent_profile?.driver_id?.toLowerCase().includes(q) ||
                false;
            const matchesRoute =
                routeFilter === "All" || t.route?.name === routeFilter;
            const matchesDriver =
                driverFilter === "All" ||
                t.agent_profile?.driver_id === driverFilter;
            const matchesScheduled =
                scheduledFilter === "All" ||
                formatDateTime(t.scheduled_date) === scheduledFilter;
            const matchesStatus =
                statusFilter === "All" || t.status === statusFilter;
            return (
                matchesSearch &&
                matchesRoute &&
                matchesDriver &&
                matchesScheduled &&
                matchesStatus
            );
        });

    // Sort trips by the currently active column
    const getTripVal = useCallback(
        (t: Trip, key: string) => {
            switch (key) {
                case "route":
                    return t.route?.name ?? "";
                case "driver":
                    return t.agent_profile?.driver_id ?? "";
                case "vehicle":
                    return t.vehicle?.plate_number ?? "";
                case "scheduled_date":
                    return t.scheduled_date ?? "";
                case "created_at":
                    // Ensures that column sorts by last modified if in Active &
                    // by archived date if in Archived
                    return view === "archived"
                        ? (t.deleted_at ?? "")
                        : (t.created_at ?? "");
                case "status":
                    return t.status;
                default:
                    return "";
            }
        },
        [view],
    );
    const {
        sorted: sortedTrips,
        state: sortState,
        toggle: toggleSort,
    } = useSort(filtered, getTripVal);

    // Paginate the sorted, filtered trips into the current page's slice
    const totalPages = Math.max(1, Math.ceil(sortedTrips.length / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const startIdx = (currentPage - 1) * rowsPerPage;
    const pageRows = sortedTrips.slice(startIdx, startIdx + rowsPerPage);
    const showingFrom = sortedTrips.length === 0 ? 0 : startIdx + 1;
    const showingTo = Math.min(startIdx + rowsPerPage, sortedTrips.length);

    return (
        <div className="rounded-xl bg-card p-6 border border-card-border">
            {/* Table Header + Filter + Search */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex -mt-4 items-center gap-2 text-lg font-bold">
                    <ClipboardList
                        size={21}
                        className="text-primary-foreground"
                    />
                    <h2 className="mt-1 text-foreground">All Assignments</h2>
                </div>

                {/* Active / Archived toggle + Filtered Search */}
                <div className="flex items-center gap-2">
                    {/* Active / Archived toggle */}
                    <div className="flex items-center rounded-lg border border-card-border bg-card">
                        {(["active", "archived"] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => {
                                    setView(v);
                                    setPage(1);
                                }}
                                className={`flex items-center px-3.5 py-1.5 text-sm font-semibold rounded-md transition capitalize
                                    ${
                                        view === v
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-secondary dark:hover:text-primary"
                                    }`}
                            >
                                {v}
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
                            placeholder="Search by routes or drivers..."
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
            <div className="-mt-4 mb-3 flex flex-wrap gap-2">
                <FilterSelect
                    label="All Routes"
                    value={routeFilter}
                    options={routeOptions}
                    onChange={(v) => {
                        setRouteFilter(v);
                        setPage(1);
                    }}
                />
                <FilterSelect
                    label="All Drivers"
                    value={driverFilter}
                    options={driverOptions}
                    onChange={(v) => {
                        setDriverFilter(v);
                        setPage(1);
                    }}
                />
                <FilterSelect
                    label="All Scheduled Dates"
                    value={scheduledFilter}
                    options={scheduledOptions}
                    onChange={(v) => {
                        setScheduledFilter(v);
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
            </div>

            {/* Route Assignment Table View */}
            <div className="overflow-auto max-h-128 rounded-lg border border-card-border scrollbar-thumb-muted-foreground">
                <table className="w-full text-left text-sm border-separate border-spacing-0 whitespace-nowrap">
                    <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-900">
                        <tr>
                            <SortableHeader
                                sortKey="route"
                                sortState={sortState}
                                onToggle={toggleSort}
                                className="rounded-tl-lg"
                            >
                                <Route
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Route
                            </SortableHeader>
                            <SortableHeader
                                sortKey="driver"
                                sortState={sortState}
                                onToggle={toggleSort}
                            >
                                <User
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Driver
                            </SortableHeader>
                            <SortableHeader
                                sortKey="vehicle"
                                sortState={sortState}
                                onToggle={toggleSort}
                            >
                                <Van
                                    size={16}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Vehicle
                            </SortableHeader>
                            <SortableHeader
                                sortKey="scheduled_date"
                                sortState={sortState}
                                onToggle={toggleSort}
                            >
                                <CalendarClock
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Scheduled Date
                            </SortableHeader>
                            <SortableHeader
                                sortKey="created_at"
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
                        {pageRows.map((t) => (
                            <tr
                                key={t.id_}
                                className="border-b border-card-border text-foreground hover:bg-muted-foreground/15 transition"
                            >
                                <td
                                    className="px-4 py-3.5 text-[13px] align-middle font-semibold max-w-40 truncate border-b border-card-border"
                                    title={t.route?.name}
                                >
                                    {t.route?.name || "—"}
                                </td>
                                <td className="px-4 py-3.5 text-[13px] align-middle border-b border-card-border">
                                    <div className="font-semibold">
                                        {t.agent_profile?.driver_id || ""}
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 text-[13px] align-middle border-b border-card-border">
                                    {t.vehicle?.plate_number || "—"}
                                </td>
                                <td className="px-4 py-3.5 text-[13px] align-middle border-b border-card-border">
                                    {formatDateTime(t.scheduled_date)}
                                </td>
                                <td className="px-4 py-3.5 text-[13px] align-middle border-b border-card-border">
                                    {view === "archived"
                                        ? t.deleted_at
                                            ? formatDateTime(t.deleted_at)
                                            : "—"
                                        : formatDateTime(t.updated_at)}
                                </td>
                                <td className="px-4 py-3.5 text-[13px] align-middle border-b border-card-border">
                                    <StatusBadge status={t.status} />
                                </td>
                                <td className="pl-7 px-4 py-3.5 align-middle relative border-b border-card-border">
                                    <button
                                        onClick={(e) => openMenu(t.id_, e)}
                                        className="p-1 rounded-md text-muted-foreground bg-card border border-btn-border
                                            hover:bg-secondary hover:text-primary-foreground dark:text-foreground transition
                                            cursor-pointer"
                                        title="More actions"
                                    >
                                        <Ellipsis size={16} />
                                    </button>

                                    {activeMenu === t.id_ && anchor && (
                                        <TableActionsMenu
                                            ref={menuRef}
                                            // Menu renders in a viewport-fixed portal so it pops out of the scroll container
                                            anchor={anchor}
                                            actions={[
                                                {
                                                    label: "View",
                                                    icon: <Eye size={15} />,
                                                    onClick: () => {
                                                        onView?.(t);
                                                        setActiveMenu(null);
                                                    },
                                                },
                                                {
                                                    label: "Edit",
                                                    icon: <PenLine size={15} />,
                                                    onClick: () => {
                                                        onEdit?.(t);
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
                                                            onUnarchive?.(
                                                                t.id_,
                                                            );
                                                        } else {
                                                            onArchive?.(t.id_);
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
                                        ? "No archived assignments."
                                        : "No assignments found."}
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
                        {sortedTrips.length}
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
