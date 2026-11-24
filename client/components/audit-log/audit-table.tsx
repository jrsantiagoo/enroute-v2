"use client";

import type { AuditLog, AuditAction } from "@/lib/types/schema";
import { useCallback, useMemo, useState } from "react";
import {
    Search,
    Eye,
    User,
    Server,
    Ellipsis,
    ChevronLeft,
    ChevronRight,
    CalendarClock,
    Table2,
} from "lucide-react";
import { useSort } from "@/lib/hooks/useSort";
import { formatDateTime } from "@/lib/routing/formatters";
import SortableHeader from "../ui/sortable-header";
import StatusBadge from "../ui/status-badge";
import { useTableActionsMenu } from "@/lib/hooks/useTableActionsMenu";
import { TableActionsMenu } from "../ui/table-actions-menu";

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];
const ACTION_LABEL: Record<AuditAction, string> = {
    INSERT: "CREATE",
    UPDATE: "UPDATE",
    DELETE: "DELETE",
};

interface AuditLogProps {
    logs: AuditLog[];
    onView?: (log: AuditLog) => void;
}

export default function AuditTable({ logs, onView }: AuditLogProps) {
    const [search, setSearch] = useState("");
    const [view, setView] = useState<"active" | "archived">("active");
    const { activeMenu, setActiveMenu, anchor, menuRef, openMenu } =
        useTableActionsMenu();
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Combined filtering: search query filter
    const filtered = useMemo(() => {
        return logs.filter((l) => {
            const q = search.toLowerCase();
            const matchesSearch =
                !search ||
                ACTION_LABEL[l.action]?.toLowerCase().includes(q) ||
                l.action.toLowerCase().includes(q) ||
                l.actor?.name.toLowerCase().includes(q) ||
                l.actor_id?.toLowerCase().includes(q) ||
                l.table_name?.toLowerCase().includes(q);

            return matchesSearch;
        });
    }, [logs, view, search]);

    // Sorting column accessor
    const getLogVal = useCallback(
        (l: AuditLog, key: string) => {
            switch (key) {
                case "timestamp":
                    return l.created_at;
                case "user":
                    return l.actor?.name ?? "";
                case "action":
                    return l.action;
                case "transaction_id":
                    return String(l.id);
                case "table_name":
                    return l.table_name;
                default:
                    return "";
            }
        },
        [view],
    );

    const {
        sorted: sortedLogs,
        state: sortState,
        toggle: toggleSort,
    } = useSort(filtered, getLogVal);

    // Pagination slice
    const totalPages = Math.max(1, Math.ceil(sortedLogs.length / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const startIdx = (currentPage - 1) * rowsPerPage;
    const pageRows = sortedLogs.slice(startIdx, startIdx + rowsPerPage);
    const showingFrom = sortedLogs.length === 0 ? 0 : startIdx + 1;
    const showingTo = Math.min(startIdx + rowsPerPage, sortedLogs.length);

    return (
        <div className="rounded-xl bg-card p-6 shadow-lg shadow-primary border border-card-border">
            {/* Header + Search */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-base font-semibold">
                    <Server size={21} className="text-primary-foreground" />
                    <h2 className="mt-1 text-foreground">Recent Logs</h2>
                </div>

                {/* Filtered Search */}
                <div className="relative">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                        type="text"
                        placeholder="Search logs..."
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

            {/* Audit Log Table View */}
            <div className="overflow-auto max-h-128 rounded-lg border border-card-border scrollbar-thumb-muted-foreground">
                <table className="w-full text-left text-sm border-separate border-spacing-0 whitespace-nowrap">
                    <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-900">
                        <tr>
                            <SortableHeader
                                sortKey="timestamp"
                                sortState={sortState}
                                onToggle={toggleSort}
                                className="rounded-tl-lg"
                            >
                                <CalendarClock
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Timestamp
                            </SortableHeader>
                            <SortableHeader
                                sortKey="user"
                                sortState={sortState}
                                onToggle={toggleSort}
                            >
                                <User
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                User
                            </SortableHeader>
                            <SortableHeader
                                sortKey="action"
                                sortState={sortState}
                                onToggle={toggleSort}
                            >
                                Action
                            </SortableHeader>
                            <th className="px-4 py-3 text-xs font-bold text-foreground border-b border-card-border">
                                Details
                            </th>
                            <SortableHeader
                                sortKey="table_name"
                                sortState={sortState}
                                onToggle={toggleSort}
                            >
                                <Table2
                                    size={14}
                                    className="inline mr-0.5 -mt-0.5"
                                />
                                Table Modified
                            </SortableHeader>
                            <th className="px-4 py-3 text-xs font-bold text-foreground border-b border-card-border">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.map((l) => (
                            <tr
                                key={l.id}
                                className="border-b border-card-border text-foreground hover:bg-muted-foreground/15 transition"
                            >
                                <td className="px-4 py-3.5 text-[13px] align-middle max-w-40 truncate border-b border-card-border">
                                    {formatDateTime(l.created_at)}
                                </td>
                                <td className="px-4 py-3.5 text-[13px] align-middle font-medium max-w-40 truncate border-b border-card-border">
                                    <div className="font-semibold">
                                        {l.actor?.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {l.actor?.email ?? "—"}
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 text-[13px] align-middle border-b border-card-border">
                                    <StatusBadge
                                        status={ACTION_LABEL[l.action]}
                                    />
                                </td>

                                <td className="px-4 py-3.5 text-[13px] align-middle max-w-90 truncate border-b border-card-border">
                                    {l.details}
                                </td>
                                <td className="px-4 py-3.5 text-[13px] align-middle font-semibold max-w-30 truncate border-b border-card-border">
                                    <StatusBadge status={l.table_name} />
                                </td>

                                <td className="pl-7 px-4 py-3.5 align-middle relative border-b border-card-border">
                                    <button
                                        onClick={(e) =>
                                            openMenu(String(l.id), e)
                                        }
                                        className="p-1 rounded-md text-muted-foreground bg-btn border border-btn-border 
                                            hover:bg-secondary hover:text-primary-foreground dark:text-foreground transition
                                            cursor-pointer"
                                        title="More actions"
                                    >
                                        <Ellipsis size={16} />
                                    </button>

                                    {activeMenu === String(l.id) && anchor && (
                                        <TableActionsMenu
                                            ref={menuRef}
                                            anchor={anchor}
                                            actions={[
                                                {
                                                    label: "View",
                                                    icon: <Eye size={15} />,
                                                    onClick: () => {
                                                        onView?.(l);
                                                        setActiveMenu(null);
                                                    },
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
                                    "No logs found."
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
                        {sortedLogs.length}
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
