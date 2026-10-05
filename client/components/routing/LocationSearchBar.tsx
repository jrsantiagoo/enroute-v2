"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Stop } from "@/lib/types/schema";
import {
    groupOrdersByLocation,
    orderLocationToStop,
    formatOrderLabel,
} from "@/lib/routing/orderData";
import {
    GeocodingResult,
    searchLocation,
} from "@/lib/routing/geocodingService";
import { useTheme } from "@/lib/theme-context";
import { DARK } from "./routeTheme";

interface AddStopPopoverProps {
    stops: Stop[];
    onAddStop: (stop: Stop) => void;
    onPreview: (stop: Stop | null) => void;
}

type View = "closed" | "saved" | "geo";
type GeoStatus = "idle" | "loading" | "done" | "error";

function geocodingResultToStop(result: GeocodingResult): Stop {
    return {
        id_: `search-${result.id}-${Date.now()}`,
        name: result.name,
        address: result.address,
        lat: result.lat,
        lng: result.lng,
    };
}

export default function AddStopPopover({
    stops,
    onAddStop,
    onPreview,
}: AddStopPopoverProps) {
    const { theme } = useTheme();
    const dark = theme === "dark";
    const [view, setView] = useState<View>("closed");
    const [savedQuery, setSavedQuery] = useState("");
    const [geoQuery, setGeoQuery] = useState("");
    const [geoResults, setGeoResults] = useState<GeocodingResult[]>([]);
    const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
    const [geoError, setGeoError] = useState("");

    const containerRef = useRef<HTMLDivElement>(null);
    const savedInputRef = useRef<HTMLInputElement>(null);
    const geoInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Close on outside click — only active when open
    useEffect(() => {
        if (view === "closed") return;
        function handleOutside(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                closePopover();
            }
        }
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-focus the active input when view changes
    useEffect(() => {
        if (view === "saved")
            setTimeout(() => savedInputRef.current?.focus(), 0);
        if (view === "geo") setTimeout(() => geoInputRef.current?.focus(), 0);
    }, [view]);

    function closePopover() {
        setView("closed");
        setSavedQuery("");
        setGeoQuery("");
        setGeoResults([]);
        setGeoStatus("idle");
        setGeoError("");
        onPreview(null);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (abortRef.current) abortRef.current.abort();
    }

    // ── Order locations ──────────────────────────────────────────────────────

    const orderStops = groupOrdersByLocation().map(orderLocationToStop);
    const alreadyAdded = new Set(stops.map((s) => s.id_));
    const filteredSaved = orderStops.filter((loc) => {
        if (alreadyAdded.has(loc.id_)) return false;
        if (!savedQuery.trim()) return true;
        const q = savedQuery.toLowerCase();
        return (
            loc.name.toLowerCase().includes(q) ||
            loc.address.toLowerCase().includes(q)
        );
    });

    function handleSelectSaved(loc: Stop) {
        onAddStop(loc);
        closePopover();
    }

    // ── Geo search ────────────────────────────────────────────────────────────

    const runGeoSearch = useCallback(async (q: string) => {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();
        setGeoStatus("loading");
        setGeoError("");
        try {
            const found = await searchLocation(q, abortRef.current.signal);
            setGeoResults(found);
            setGeoStatus("done");
        } catch (err) {
            if ((err as Error).name === "AbortError") return;
            setGeoError("Search failed. Please try again.");
            setGeoStatus("error");
        }
    }, []);

    function handleGeoQueryChange(value: string) {
        setGeoQuery(value);
        onPreview(null);
        if (!value.trim()) {
            setGeoResults([]);
            setGeoStatus("idle");
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (abortRef.current) abortRef.current.abort();
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => runGeoSearch(value.trim()), 600);
    }

    function handleSelectGeo(result: GeocodingResult) {
        onAddStop(geocodingResultToStop(result));
        onPreview(null);
        closePopover();
    }

    function clearGeoQuery() {
        setGeoQuery("");
        setGeoResults([]);
        setGeoStatus("idle");
        onPreview(null);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (abortRef.current) abortRef.current.abort();
    }

    // ── Shared styles ─────────────────────────────────────────────────────────

    const rowBase: React.CSSProperties = {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "7px 10px",
        background: "none",
        cursor: "pointer",
        textAlign: "left",
        boxSizing: "border-box",
    };

    // ── Render ────────────────────────────────────────────────────────────────

    if (view === "closed") {
        return (
            <div ref={containerRef} style={{ padding: "4px 0" }}>
                <button
                    onClick={() => setView("saved")}
                    style={{
                        width: "100%",
                        padding: "7px 10px",
                        border: `1px dashed ${dark ? DARK.addBorder : "#d1d5db"}`,
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: dark ? DARK.textMuted : "#6b7280",
                        background: dark ? DARK.addBg : "#fafafa",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        boxSizing: "border-box",
                    }}
                >
                    <span>+ Add a stop…</span>
                    <span style={{ fontSize: "10px", opacity: 0.7 }}>▾</span>
                </button>
            </div>
        );
    }

    return (
        <div ref={containerRef} style={{ padding: "4px 0" }}>
            <div
                style={{
                    border: `1px solid ${dark ? DARK.panelBorder : "#d1d5db"}`,
                    borderRadius: "6px",
                    background: dark ? DARK.elevatedBg : "#fff",
                    overflow: "hidden",
                    boxShadow: dark
                        ? "0 2px 8px rgba(0,0,0,0.5)"
                        : "0 2px 8px rgba(0,0,0,0.08)",
                }}
            >
                {/* ── Saved locations view ── */}
                {view === "saved" && (
                    <>
                        {/* Filter input */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 8px",
                                borderBottom: `1px solid ${dark ? DARK.divider : "#f3f4f6"}`,
                            }}
                        >
                            <span
                                style={{
                                    color: dark ? DARK.textMuted : "#9ca3af",
                                    fontSize: "12px",
                                    flexShrink: 0,
                                }}
                            >
                                🔍
                            </span>
                            <input
                                ref={savedInputRef}
                                type="text"
                                value={savedQuery}
                                onChange={(e) => setSavedQuery(e.target.value)}
                                placeholder="Search order locations…"
                                style={{
                                    flex: 1,
                                    border: "none",
                                    outline: "none",
                                    fontSize: "12px",
                                    color: dark ? DARK.text : "#111827",
                                    background: "transparent",
                                    padding: "2px 0",
                                }}
                            />
                            <button
                                onClick={closePopover}
                                aria-label="Close"
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: dark ? DARK.textMuted : "#9ca3af",
                                    fontSize: "16px",
                                    lineHeight: 1,
                                    padding: "0 2px",
                                    flexShrink: 0,
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Saved location list — 5 rows visible, scroll for more */}
                        <div
                            className="route-scrollbar"
                            style={{ maxHeight: "200px", overflowY: "auto" }}
                        >
                            {filteredSaved.length === 0 ? (
                                <div
                                    style={{
                                        padding: "10px",
                                        fontSize: "12px",
                                        color: dark
                                            ? DARK.textMuted
                                            : "#9ca3af",
                                    }}
                                >
                                    {savedQuery.trim()
                                        ? "No matching order locations."
                                        : "All order locations are already added."}
                                </div>
                            ) : (
                                filteredSaved.map((loc, i) => (
                                    <div
                                        key={loc.id_}
                                        style={{
                                            borderBottom:
                                                i < filteredSaved.length - 1
                                                    ? `1px solid ${dark ? DARK.divider : "#f3f4f6"}`
                                                    : "none",
                                        }}
                                    >
                                        <button
                                            onClick={() =>
                                                handleSelectSaved(loc)
                                            }
                                            style={{
                                                ...rowBase,
                                                flexDirection: "column",
                                                alignItems: "flex-start",
                                                gap: "1px",
                                                padding: "8px 10px",
                                            }}
                                            onMouseEnter={(e) => {
                                                (
                                                    e.currentTarget as HTMLElement
                                                ).style.background = dark
                                                    ? DARK.rowHover
                                                    : "#f9fafb";
                                            }}
                                            onMouseLeave={(e) => {
                                                (
                                                    e.currentTarget as HTMLElement
                                                ).style.background = "none";
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    width: "100%",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        color: dark
                                                            ? DARK.text
                                                            : "#111827",
                                                    }}
                                                >
                                                    {loc.orderIds
                                                        ? formatOrderLabel(
                                                              loc.orderIds,
                                                          )
                                                        : loc.name}
                                                </span>
                                                {loc.priority === "urgent" && (
                                                    <span
                                                        style={{
                                                            flexShrink: 0,
                                                            fontSize: "9px",
                                                            fontWeight: 600,
                                                            color: dark
                                                                ? "#fca5a5"
                                                                : "#dc2626",
                                                            background: dark
                                                                ? "rgba(239,68,68,0.15)"
                                                                : "#fef2f2",
                                                            border: `1px solid ${dark ? "rgba(239,68,68,0.35)" : "#fecaca"}`,
                                                            borderRadius:
                                                                "9999px",
                                                            padding: "1px 6px",
                                                        }}
                                                    >
                                                        Urgent
                                                    </span>
                                                )}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: "11px",
                                                    color: dark
                                                        ? DARK.textMuted
                                                        : "#6b7280",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    maxWidth: "240px",
                                                }}
                                            >
                                                {loc.address}
                                            </span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer: open geo search */}
                        <div
                            style={{
                                borderTop: `1px solid ${dark ? DARK.divider : "#f3f4f6"}`,
                            }}
                        >
                            <button
                                onClick={() => {
                                    clearGeoQuery();
                                    setView("geo");
                                }}
                                style={{
                                    ...rowBase,
                                    padding: "8px 10px",
                                    gap: "7px",
                                    color: dark ? DARK.accent : "#2563eb",
                                    fontSize: "12px",
                                }}
                                onMouseEnter={(e) => {
                                    (
                                        e.currentTarget as HTMLElement
                                    ).style.background = dark
                                        ? DARK.accentHover
                                        : "#eff6ff";
                                }}
                                onMouseLeave={(e) => {
                                    (
                                        e.currentTarget as HTMLElement
                                    ).style.background = "none";
                                }}
                            >
                                <span style={{ fontSize: "11px" }}>🔍</span>
                                <span>
                                    Search for a new location or enter
                                    coordinates
                                </span>
                            </button>
                        </div>
                    </>
                )}

                {/* ── Geo search view ── */}
                {view === "geo" && (
                    <>
                        {/* Search input with back button */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 8px",
                                borderBottom: `1px solid ${dark ? DARK.divider : "#f3f4f6"}`,
                            }}
                        >
                            <button
                                onClick={() => setView("saved")}
                                aria-label="Back to saved locations"
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: dark ? DARK.textMuted : "#6b7280",
                                    fontSize: "14px",
                                    lineHeight: 1,
                                    padding: "0 4px 0 0",
                                    flexShrink: 0,
                                }}
                            >
                                ←
                            </button>
                            <span
                                style={{
                                    color: dark ? DARK.textMuted : "#9ca3af",
                                    fontSize: "12px",
                                    flexShrink: 0,
                                    minWidth: "14px",
                                    textAlign: "center",
                                }}
                            >
                                {geoStatus === "loading" ? "⟳" : "🔍"}
                            </span>
                            <input
                                ref={geoInputRef}
                                type="text"
                                value={geoQuery}
                                onChange={(e) =>
                                    handleGeoQueryChange(e.target.value)
                                }
                                placeholder="Search address or lat, lng…"
                                style={{
                                    flex: 1,
                                    border: "none",
                                    outline: "none",
                                    fontSize: "12px",
                                    color: dark ? DARK.text : "#111827",
                                    background: "transparent",
                                    padding: "2px 0",
                                }}
                            />
                            {geoQuery && (
                                <button
                                    onClick={clearGeoQuery}
                                    aria-label="Clear search"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: dark
                                            ? DARK.textMuted
                                            : "#9ca3af",
                                        fontSize: "16px",
                                        lineHeight: 1,
                                        padding: "0 2px",
                                        flexShrink: 0,
                                    }}
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        {/* Geo results */}
                        <div
                            className="route-scrollbar"
                            style={{ maxHeight: "200px", overflowY: "auto" }}
                        >
                            {geoStatus === "idle" && (
                                <div
                                    style={{
                                        padding: "10px",
                                        fontSize: "12px",
                                        color: dark
                                            ? DARK.textMuted
                                            : "#9ca3af",
                                    }}
                                >
                                    Type an address, or paste coordinates (lat,
                                    lng)
                                </div>
                            )}
                            {geoStatus === "loading" && (
                                <div
                                    style={{
                                        padding: "10px",
                                        fontSize: "12px",
                                        color: dark
                                            ? DARK.textMuted
                                            : "#6b7280",
                                    }}
                                >
                                    Searching…
                                </div>
                            )}
                            {geoStatus === "error" && (
                                <div
                                    style={{
                                        padding: "10px",
                                        fontSize: "12px",
                                        color: "#dc2626",
                                    }}
                                >
                                    {geoError}
                                </div>
                            )}
                            {geoStatus === "done" &&
                                geoResults.length === 0 && (
                                    <div
                                        style={{
                                            padding: "10px",
                                            fontSize: "12px",
                                            color: dark
                                                ? DARK.textMuted
                                                : "#9ca3af",
                                        }}
                                    >
                                        No results found.
                                    </div>
                                )}
                            {geoStatus === "done" &&
                                geoResults.map((result, i) => (
                                    <div
                                        key={result.id}
                                        style={{
                                            borderBottom:
                                                i < geoResults.length - 1
                                                    ? `1px solid ${dark ? DARK.divider : "#f3f4f6"}`
                                                    : "none",
                                        }}
                                        onMouseEnter={() =>
                                            onPreview(
                                                geocodingResultToStop(result),
                                            )
                                        }
                                        onMouseLeave={() => onPreview(null)}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                padding: "7px 10px",
                                            }}
                                        >
                                            <div
                                                style={{ flex: 1, minWidth: 0 }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        color: dark
                                                            ? DARK.text
                                                            : "#111827",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {result.name}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "11px",
                                                        color: dark
                                                            ? DARK.textMuted
                                                            : "#6b7280",
                                                        marginTop: "1px",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {result.address}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handleSelectGeo(result)
                                                }
                                                style={{
                                                    flexShrink: 0,
                                                    padding: "3px 10px",
                                                    background: dark
                                                        ? DARK.btnBg
                                                        : "#374151",
                                                    color: dark
                                                        ? DARK.btnText
                                                        : "#fff",
                                                    border: dark
                                                        ? `1px solid ${DARK.btnBorder}`
                                                        : "none",
                                                    borderRadius: "4px",
                                                    fontSize: "11px",
                                                    fontWeight: 500,
                                                    cursor: "pointer",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
