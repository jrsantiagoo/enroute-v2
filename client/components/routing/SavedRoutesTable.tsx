"use client";

/**
 * SavedRoutesTable — the Active/Archived table on the Route Creation page.
 *
 * Section map:
 *   1. IMPORTS & TYPES
 *   2. TABLE CONFIG & CELL FORMATTERS
 *   3. ACTIVE / ARCHIVED FILTERING + PAGINATION
 *   4. DARK MODE STYLES
 *   5. REUSABLE TABLE STYLES
 *   6. TABLE LAYOUT (header, columns, rows, pagination)
 *   7. ROW COMPONENT + ROUTE ACTION BUTTONS
 *   8. REUSABLE PRESENTATIONAL HELPERS (Tag, IconButton, PagerButton)
 *
 * Action rules: active routes can be edited, archived, and deleted. Archived
 * routes are read-only — Restore is the only action offered (see ROW COMPONENT).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. IMPORTS & TYPES
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import {
    Search,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Archive,
    ArchiveRestore,
    Trash2,
} from "lucide-react";
import { RoutePlan } from "@/lib/types/schema";
import { formatDateTime } from "@/lib/routing/formatters";
import { getRouteAreaTags, formatOrderLabel } from "@/lib/routing/orderData";
import { useTheme } from "@/lib/theme-context";
import { DARK } from "./routeTheme";

interface SavedRoutesTableProps {
    routes: RoutePlan[];
    onEdit: (route: RoutePlan) => void;
    onArchive: (route: RoutePlan) => void;
    onUnarchive: (route: RoutePlan) => void;
    onDelete: (route: RoutePlan) => void;
}

type View = "active" | "archived";

// ─────────────────────────────────────────────────────────────────────────────
// 2. TABLE CONFIG & CELL FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20];

/** Compact Stops cell: "3 stops". Full list lives in the expanded row. */
function stopsSummary(route: RoutePlan): string {
    const n = route.stops.length;
    if (n === 0) return "No stops";
    return `${n} ${n === 1 ? "stop" : "stops"}`;
}

function stopDisplay(stop: RoutePlan["stops"][number]): string {
    return stop.orderIds && stop.orderIds.length > 0
        ? formatOrderLabel(stop.orderIds)
        : stop.name;
}

/**
 * Date cell. Active rows show Date Created; archived rows show Date Archived,
 * falling back to "N/A" for routes archived before `archivedAt` was stored.
 */
function routeDateLabel(route: RoutePlan, view: View): string {
    if (view === "active") return formatDateTime(route.createdAt);
    return route.archivedAt ? formatDateTime(route.archivedAt) : "N/A";
}

export default function SavedRoutesTable({
    routes,
    onEdit,
    onArchive,
    onUnarchive,
    onDelete,
}: SavedRoutesTableProps) {
    const { theme } = useTheme();
    const dark = theme === "dark";

    const [view, setView] = useState<View>("active");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // ─────────────────────────────────────────────────────────────────────────
    // 3. ACTIVE / ARCHIVED FILTERING + PAGINATION
    // Tab decides the pool (archived flag), search narrows it by name or area
    // tag, then the result is sliced into the current page.
    // ─────────────────────────────────────────────────────────────────────────
    const isArchived = (r: RoutePlan) => r.archivedAt != null;
    const filtered = useMemo(() => {
        const inView = routes.filter((r) =>
            view === "archived" ? isArchived(r) : !isArchived(r),
        );
        const q = query.trim().toLowerCase();
        if (!q) return inView;
        return inView.filter((r) => {
            const areas = getRouteAreaTags(r).join(" ").toLowerCase();
            return r.name.toLowerCase().includes(q) || areas.includes(q);
        });
    }, [routes, view, query]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const startIdx = (currentPage - 1) * rowsPerPage;
    const pageRows = filtered.slice(startIdx, startIdx + rowsPerPage);
    const showingFrom = filtered.length === 0 ? 0 : startIdx + 1;
    const showingTo = Math.min(startIdx + rowsPerPage, filtered.length);

    // ─────────────────────────────────────────────────────────────────────────
    // 4. DARK MODE STYLES
    // Resolved once here, then threaded down to the row/helper components so
    // each one doesn't re-read the theme context. Palette: ./routeTheme.ts
    // ─────────────────────────────────────────────────────────────────────────

    const border = dark ? DARK.panelBorder : "#e5e7eb";
    const muted = dark ? DARK.textMuted : "#6b7280";
    const text = dark ? DARK.text : "#111827";

    // ─────────────────────────────────────────────────────────────────────────
    // 5. REUSABLE TABLE STYLES
    // Shared header/body cell styles — copy this pair when building a table on
    // another page, then override per-cell with {...tdStyle, ...}.
    // ─────────────────────────────────────────────────────────────────────────

    const thStyle: React.CSSProperties = {
        textAlign: "left",
        padding: "12px 16px",
        fontSize: "12px",
        fontWeight: 700,
        color: text,
        whiteSpace: "nowrap",
    };
    const tdStyle: React.CSSProperties = {
        padding: "14px 16px",
        fontSize: "13px",
        color: text,
        verticalAlign: "middle",
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 6. TABLE LAYOUT
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <section
            style={{
                background: dark ? DARK.panelBg : "#fff",
                border: `1px solid ${border}`,
                borderRadius: "12px",
                padding: "20px 22px",
            }}
        >
            {/* Header row — title, Active/Archived toggle, search */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    flexWrap: "wrap",
                    marginBottom: "16px",
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "20px",
                            fontWeight: 700,
                            color: text,
                        }}
                    >
                        Saved Routes
                    </h2>
                    <p
                        style={{
                            margin: "4px 0 0",
                            fontSize: "13px",
                            color: muted,
                        }}
                    >
                        View, review, archive, or delete previously created
                        routes.
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                    }}
                >
                    {/* Active / Archived toggle */}
                    <div
                        style={{
                            display: "inline-flex",
                            border: `1px solid ${border}`,
                            borderRadius: "8px",
                            overflow: "hidden",
                        }}
                    >
                        {(["active", "archived"] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => {
                                    setView(v);
                                    setPage(1);
                                    setExpandedId(null);
                                }}
                                style={{
                                    padding: "6px 14px",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    textTransform: "capitalize",
                                    border: "none",
                                    cursor: "pointer",
                                    background:
                                        view === v
                                            ? "var(--primary)"
                                            : "transparent",
                                    color:
                                        view === v
                                            ? "var(--primary-foreground)"
                                            : "var(--muted-foreground)",
                                }}
                            >
                                {v}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 12px",
                            border: `1px solid ${border}`,
                            borderRadius: "8px",
                            background: dark ? DARK.elevatedBg : "#fff",
                            minWidth: "240px",
                        }}
                    >
                        <Search size={15} color={muted} strokeWidth={2} />
                        <input
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search Route Name or Area/s…"
                            style={{
                                border: "none",
                                outline: "none",
                                background: "transparent",
                                fontSize: "13px",
                                color: text,
                                flex: 1,
                                minWidth: 0,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Table — the date column header swaps with the active tab */}
            <div style={{ overflowX: "auto" }}>
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: "760px",
                    }}
                >
                    <thead>
                        <tr
                            style={{
                                background: dark ? DARK.elevatedBg : "#f9fafb",
                                borderTop: `1px solid ${border}`,
                                borderBottom: `1px solid ${border}`,
                            }}
                        >
                            <th style={thStyle}>Route Name</th>
                            <th style={thStyle}>Stops</th>
                            <th style={thStyle}>Tags</th>
                            <th style={thStyle}>
                                {view === "archived"
                                    ? "Date Archived"
                                    : "Date Created"}
                            </th>
                            <th style={{ ...thStyle, textAlign: "right" }}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    style={{
                                        ...tdStyle,
                                        textAlign: "center",
                                        color: muted,
                                        padding: "40px 16px",
                                    }}
                                >
                                    {query.trim()
                                        ? "No routes match your search."
                                        : view === "archived"
                                          ? "No archived routes."
                                          : "No saved routes yet. Click “Create New Route” to add one."}
                                </td>
                            </tr>
                        ) : (
                            pageRows.map((route) => {
                                const areaTags = getRouteAreaTags(route);
                                const vehicleTag =
                                    route.vehicleType === "car"
                                        ? "Car"
                                        : "Motor";
                                const expanded = expandedId === route.id_;
                                return (
                                    <RouteRow
                                        key={route.id_}
                                        route={route}
                                        expanded={expanded}
                                        onToggleExpand={() =>
                                            setExpandedId(
                                                expanded ? null : route.id_,
                                            )
                                        }
                                        vehicleTag={vehicleTag}
                                        areaTags={areaTags}
                                        dark={dark}
                                        view={view}
                                        onEdit={() => onEdit(route)}
                                        onArchive={() => onArchive(route)}
                                        onUnarchive={() => onUnarchive(route)}
                                        onDelete={() => onDelete(route)}
                                        tdStyle={tdStyle}
                                        border={border}
                                        muted={muted}
                                        text={text}
                                    />
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginTop: "16px",
                    fontSize: "13px",
                    color: muted,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <span>Rows per page</span>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setPage(1);
                        }}
                        style={{
                            padding: "4px 8px",
                            border: `1px solid ${border}`,
                            borderRadius: "6px",
                            background: dark ? DARK.elevatedBg : "#fff",
                            color: text,
                            fontSize: "13px",
                            cursor: "pointer",
                        }}
                    >
                        {ROWS_PER_PAGE_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                    <span>
                        | Showing {showingFrom}-{showingTo} of {filtered.length}
                    </span>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                    }}
                >
                    <PagerButton
                        dark={dark}
                        border={border}
                        muted={muted}
                        disabled={currentPage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        dir="prev"
                    />
                    <span style={{ color: text }}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <PagerButton
                        dark={dark}
                        border={border}
                        muted={muted}
                        disabled={currentPage >= totalPages}
                        onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                        }
                        dir="next"
                    />
                </div>
            </div>
        </section>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ROW COMPONENT + ROUTE ACTION BUTTONS
// One table row plus its expandable stop list. The Actions cell is where the
// archived-route restrictions live.
// ─────────────────────────────────────────────────────────────────────────────

interface RouteRowProps {
    route: RoutePlan;
    expanded: boolean;
    onToggleExpand: () => void;
    vehicleTag: string;
    areaTags: string[];
    dark: boolean;
    view: View;
    onEdit: () => void;
    onArchive: () => void;
    onUnarchive: () => void;
    onDelete: () => void;
    tdStyle: React.CSSProperties;
    border: string;
    muted: string;
    text: string;
}

function RouteRow({
    route,
    expanded,
    onToggleExpand,
    vehicleTag,
    areaTags,
    dark,
    view,
    onEdit,
    onArchive,
    onUnarchive,
    onDelete,
    tdStyle,
    border,
    muted,
    text,
}: RouteRowProps) {
    // Archived routes are read-only: no editing, no permanent delete. Restore
    // them to Active first if either is needed.
    const isArchived = view === "archived";

    return (
        <>
            <tr style={{ borderBottom: `1px solid ${border}` }}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{route.name}</td>

                {/* Stops — compact count; expand to see the full list */}
                <td style={tdStyle}>
                    <button
                        onClick={onToggleExpand}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: text,
                            fontSize: "13px",
                            padding: 0,
                        }}
                        aria-expanded={expanded}
                        title={expanded ? "Hide stops" : "Show all stops"}
                    >
                        <span>{stopsSummary(route)}</span>
                        <ChevronDown
                            size={14}
                            color={muted}
                            strokeWidth={2}
                            style={{
                                transform: expanded ? "rotate(180deg)" : "none",
                                transition: "transform 0.15s",
                                flexShrink: 0,
                            }}
                        />
                    </button>
                </td>

                <td style={tdStyle}>
                    <div
                        style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                        }}
                    >
                        <Tag label={vehicleTag} kind="vehicle" dark={dark} />
                        {areaTags.map((a, i) => (
                            <Tag
                                key={a}
                                label={a}
                                kind={i % 2 === 0 ? "area1" : "area2"}
                                dark={dark}
                            />
                        ))}
                    </div>
                </td>

                {/* Date Created (Active) / Date Archived (Archived) */}
                <td style={{ ...tdStyle, color: muted, whiteSpace: "nowrap" }}>
                    {routeDateLabel(route, view)}
                </td>

                {/* Actions — Restore only when archived; full set when active */}
                <td style={tdStyle}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "6px",
                        }}
                    >
                        {isArchived ? (
                            <IconButton
                                title="Restore route"
                                onClick={onUnarchive}
                                dark={dark}
                                border={border}
                                muted={muted}
                            >
                                <ArchiveRestore size={15} />
                            </IconButton>
                        ) : (
                            <>
                                <IconButton
                                    title="Edit route"
                                    onClick={onEdit}
                                    dark={dark}
                                    border={border}
                                    muted={muted}
                                >
                                    <Pencil size={15} />
                                </IconButton>
                                <IconButton
                                    title="Archive route"
                                    onClick={onArchive}
                                    dark={dark}
                                    border={border}
                                    muted={muted}
                                >
                                    <Archive size={15} />
                                </IconButton>
                                <IconButton
                                    title="Delete route"
                                    onClick={onDelete}
                                    dark={dark}
                                    border={border}
                                    muted={muted}
                                    danger
                                >
                                    <Trash2 size={15} />
                                </IconButton>
                            </>
                        )}
                    </div>
                </td>
            </tr>

            {/* Expanded stop list — full detail, kept out of the compact row */}
            {expanded && (
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                    <td
                        colSpan={5}
                        style={{
                            padding: "0 16px 14px",
                            background: dark ? DARK.elevatedBg : "#f9fafb",
                        }}
                    >
                        <ol
                            style={{
                                margin: "12px 0 0",
                                padding: 0,
                                listStyle: "none",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                            }}
                        >
                            {route.stops.map((stop, i) => (
                                <li
                                    key={stop.id_}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "10px",
                                    }}
                                >
                                    <span
                                        style={{
                                            flexShrink: 0,
                                            width: "20px",
                                            height: "20px",
                                            borderRadius: "50%",
                                            background:
                                                i === 0
                                                    ? "#22c55e"
                                                    : i ===
                                                        route.stops.length - 1
                                                      ? "#ef4444"
                                                      : "#3b82f6",
                                            color: "#fff",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {i === 0
                                            ? "S"
                                            : i === route.stops.length - 1
                                              ? "E"
                                              : i}
                                    </span>
                                    <div style={{ minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                color: text,
                                            }}
                                        >
                                            {stopDisplay(stop)}
                                        </div>
                                        {stop.address && (
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: muted,
                                                }}
                                            >
                                                {stop.address}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </td>
                </tr>
            )}
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. REUSABLE PRESENTATIONAL HELPERS
// Tag / IconButton / PagerButton — self-contained, no data dependencies.
// Reusable on other pages: pass the resolved dark-mode colors down as props.
// ─────────────────────────────────────────────────────────────────────────────

function Tag({
    label,
    kind,
    dark,
}: {
    label: string;
    kind: "vehicle" | "area1" | "area2";
    dark: boolean;
}) {
    const palette = {
        vehicle: dark
            ? {
                  bg: "rgba(148,163,184,0.15)",
                  fg: "#cbd5e1",
                  bd: "rgba(148,163,184,0.35)",
              }
            : { bg: "#f1f5f9", fg: "#475569", bd: "#e2e8f0" },
        area1: dark
            ? {
                  bg: "rgba(59,130,246,0.15)",
                  fg: "#93c5fd",
                  bd: "rgba(59,130,246,0.35)",
              }
            : { bg: "#eff6ff", fg: "#2563eb", bd: "#dbeafe" },
        area2: dark
            ? {
                  bg: "rgba(34,197,94,0.15)",
                  fg: "#86efac",
                  bd: "rgba(34,197,94,0.35)",
              }
            : { bg: "#f0fdf4", fg: "#16a34a", bd: "#dcfce7" },
    }[kind];

    return (
        <span
            style={{
                fontSize: "11px",
                fontWeight: 600,
                color: palette.fg,
                background: palette.bg,
                border: `1px solid ${palette.bd}`,
                borderRadius: "9999px",
                padding: "2px 10px",
                whiteSpace: "nowrap",
            }}
        >
            {label}
        </span>
    );
}

/**
 * 32px square action button. Pass a Lucide icon as the child — it inherits the
 * button's color via `currentColor`, so `danger` recolors the icon for free.
 */
function IconButton({
    title,
    onClick,
    dark,
    border,
    muted,
    danger = false,
    children,
}: {
    title: string;
    onClick: () => void;
    dark: boolean;
    border: string;
    muted: string;
    danger?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            aria-label={title}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: `1px solid ${border}`,
                background: dark ? DARK.btnBg : "#fff",
                color: danger ? "#dc2626" : muted,
                cursor: "pointer",
            }}
        >
            {children}
        </button>
    );
}

function PagerButton({
    dark,
    border,
    muted,
    disabled,
    onClick,
    dir,
}: {
    dark: boolean;
    border: string;
    muted: string;
    disabled: boolean;
    onClick: () => void;
    dir: "prev" | "next";
}) {
    const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={dir === "prev" ? "Previous page" : "Next page"}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                border: `1px solid ${border}`,
                background: dark ? DARK.btnBg : "#fff",
                color: muted,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
            }}
        >
            <Icon size={15} strokeWidth={2} />
        </button>
    );
}
