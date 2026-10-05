"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, X } from "lucide-react";
import {
    Stop,
    RouteSegment,
    RoutePlan,
    SuggestedRoute,
} from "@/lib/types/schema";
import { DEFAULT_STOPS } from "@/lib/routing/mockData";
import { fetchRoute } from "@/lib/routing/routingService";
import { saveRoute, isRouteNameTaken } from "@/lib/routing/storageHelper";
import { recommendVehicle } from "@/lib/routing/vehicleLogic";
import { useTheme } from "@/lib/theme-context";
import RouteMap from "./RouteMap";
import RouteOrderingPanel from "./RouteOrderingPanel";
import SuggestRoutesModal from "./SuggestRoutesModal";
import SaveRouteModal from "./SaveRouteModal";
import { DARK } from "./routeTheme";
import { createRoute, updateRoute } from "@/lib/api/routes";

function generateRouteId(): string {
    return `route-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface CreateRouteModalProps {
    // When present the modal edits and overwrites this route; otherwise creates.
    editingRoute?: RoutePlan | null;
    existingNames: string[];
    onClose: () => void;
    onSaved: (name: string) => void;
}

export default function CreateRouteModal({
    editingRoute,
    existingNames,
    onClose,
    onSaved,
}: CreateRouteModalProps) {
    const { theme } = useTheme();
    const dark = theme === "dark";
    const isEditing = !!editingRoute;

    const [stops, setStops] = useState<Stop[]>(
        editingRoute?.stops ?? DEFAULT_STOPS,
    );
    const [segments, setSegments] = useState<RouteSegment[]>([]);
    const [polyline, setPolyline] = useState<[number, number][]>([]);
    const [totalDistanceKm, setTotalDistanceKm] = useState(0);
    const [totalDurationMinutes, setTotalDurationMinutes] = useState(0);

    const [previewStop, setPreviewStop] = useState<Stop | null>(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [routeError, setRouteError] = useState<string | null>(null);
    const [isSuggestOpen, setIsSuggestOpen] = useState(false);
    const [isSaveOpen, setIsSaveOpen] = useState(false);

    const routeIdRef = useRef(editingRoute?.id_ ?? generateRouteId());
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const canSave = stops.length >= 2;

    const loadRoute = useCallback(async (currentStops: Stop[]) => {
        if (currentStops.length < 2) {
            setPolyline([]);
            setSegments([]);
            setTotalDistanceKm(0);
            setTotalDurationMinutes(0);
            setRouteError(null);
            return;
        }
        setIsLoadingRoute(true);
        setRouteError(null);
        try {
            const result = await fetchRoute(currentStops);
            setSegments(result.segments);
            setPolyline(result.polyline);
            setTotalDistanceKm(result.totalDistanceKm);
            setTotalDurationMinutes(result.totalDurationMinutes);
        } catch (err) {
            console.error("[CreateRouteModal] fetchRoute error:", err);
            setRouteError("Could not reach the routing service.");
            setPolyline([]);
            setSegments([]);
        } finally {
            setIsLoadingRoute(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => loadRoute(stops), 650);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [stops, loadRoute]);

    // Close on Escape (unless the nested name/suggest dialogs are open).
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape" && !isSaveOpen && !isSuggestOpen) onClose();
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose, isSaveOpen, isSuggestOpen]);

    function handleAddStop(stop: Stop) {
        setStops((prev) => {
            if (prev.length < 2) return [...prev, stop];
            return [...prev.slice(0, -1), stop, prev[prev.length - 1]];
        });
    }

    function handleApplySuggested(route: SuggestedRoute) {
        setStops(route.stops);
        setIsSuggestOpen(false);
    }

    async function handleConfirmSave(name: string) {
        if (!canSave) return;
        // Guard against a name added in another tab between opening and saving.
        if (isRouteNameTaken(name, routeIdRef.current)) return;

        const plan: RoutePlan = {
            id_: routeIdRef.current,
            name,
            stops,
            segments,
            totalDistanceKm,
            totalDurationMinutes,
            vehicleType: recommendVehicle(stops.length),
            createdAt: editingRoute?.createdAt ?? new Date().toISOString(),
            archivedAt: editingRoute?.archivedAt ?? undefined,
        };

        try {
            const res = isEditing
                ? await updateRoute(plan)
                : await createRoute(plan);
            if (res.success) {
                onSaved("Route saved successfully.");
            } else {
                onSaved(res.message || "Failed to save route.");
            }
        } catch {
            onSaved("Failed to save route to server. Saved locally.");
        }
        setIsSaveOpen(false);
    }

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 99990,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                background: "rgba(0,0,0,0.5)",
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                style={{
                    background: dark ? DARK.panelBg : "#f8fafc",
                    borderRadius: "12px",
                    width: "min(1120px, 96vw)",
                    height: "min(880px, 90vh)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    border: dark ? `1px solid ${DARK.panelBorder}` : "none",
                    boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px 20px",
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <MapPin
                            size={20}
                            color={dark ? DARK.textMuted : "#6b7280"}
                            strokeWidth={2}
                        />
                        <h2
                            style={{
                                margin: 0,
                                fontSize: "18px",
                                fontWeight: 700,
                                color: dark ? DARK.text : "#111827",
                            }}
                        >
                            {isEditing ? "Edit Route" : "Create Route"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: dark ? DARK.textMuted : "#6b7280",
                            lineHeight: 1,
                            padding: "0 4px",
                        }}
                    >
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>

                {/* Body — map with the Route Plan panel overlaid */}
                <div
                    style={{
                        flex: 1,
                        position: "relative",
                        overflow: "hidden",
                        margin: "0 16px",
                        borderRadius: "10px",
                    }}
                >
                    <RouteMap
                        stops={stops}
                        polyline={polyline}
                        previewStop={previewStop}
                    />

                    <RouteOrderingPanel
                        stops={stops}
                        segments={segments}
                        totalDistanceKm={totalDistanceKm}
                        totalDurationMinutes={totalDurationMinutes}
                        isEditMode={true}
                        isLoading={isLoadingRoute}
                        routeError={routeError}
                        onReorder={setStops}
                        onRemoveStop={(id_) =>
                            setStops((prev) =>
                                prev.filter((s) => s.id_ !== id_),
                            )
                        }
                        onAddStop={handleAddStop}
                        onPreview={setPreviewStop}
                    />
                </div>

                {/* Footer */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        padding: "14px 20px",
                        flexShrink: 0,
                    }}
                >
                    <button
                        onClick={() => setIsSuggestOpen(true)}
                        style={{
                            padding: "8px 14px",
                            background: "transparent",
                            color: dark ? DARK.accent : "#2563eb",
                            border: "none",
                            fontSize: "13px",
                            fontWeight: 500,
                            cursor: "pointer",
                        }}
                    >
                        Suggest Routes
                    </button>

                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: "9px 20px",
                                background: dark ? DARK.btnBg : "#fff",
                                color: dark ? DARK.btnText : "#374151",
                                border: `1px solid ${dark ? DARK.btnBorder : "#d1d5db"}`,
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: 500,
                                cursor: "pointer",
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => canSave && setIsSaveOpen(true)}
                            disabled={!canSave}
                            title={
                                canSave
                                    ? undefined
                                    : "Add at least two stops to save"
                            }
                            style={{
                                padding: "9px 22px",
                                background: canSave
                                    ? dark
                                        ? DARK.btnBg
                                        : "#1e293b"
                                    : dark
                                      ? "#1e293b"
                                      : "#9ca3af",
                                color: dark ? DARK.btnText : "#fff",
                                border: dark
                                    ? `1px solid ${DARK.btnBorder}`
                                    : "none",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: 600,
                                cursor: canSave ? "pointer" : "not-allowed",
                                opacity: canSave ? 1 : 0.7,
                            }}
                        >
                            {isEditing ? "Save Changes" : "Create Route"}
                        </button>
                    </div>
                </div>
            </div>

            {isSuggestOpen && (
                <SuggestRoutesModal
                    onClose={() => setIsSuggestOpen(false)}
                    onApply={handleApplySuggested}
                    currentStops={stops}
                />
            )}

            {isSaveOpen && (
                <SaveRouteModal
                    onClose={() => setIsSaveOpen(false)}
                    onSave={handleConfirmSave}
                    existingNames={existingNames}
                    title={isEditing ? "Save Changes" : "Name Your Route"}
                    confirmLabel={isEditing ? "Save Changes" : "Create Route"}
                    initialName={editingRoute?.name ?? ""}
                />
            )}
        </div>
    );
}
