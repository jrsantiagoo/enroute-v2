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
import RouteMap from "./RouteMap";
import RouteOrderingPanel from "./RouteOrderingPanel";
import SuggestRoutesModal from "./SuggestRoutesModal";
import SaveRouteModal from "./SaveRouteModal";
import { createRoute, updateRoute } from "@/lib/api/routes";
import SmartNotifications from "@/components/dashboard/smart-notifications";

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
            className="fixed inset-0 z-99990 flex items-center justify-center bg-black/50"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="flex flex-col w-[min(1120px,96vw)] h-[min(880px,90vh)] rounded-xl bg-card border border-card-border
                    shadow shadow-card-border overflow-hidden"
            >
                {/* Header */}
                <div className="flex shrink-0 px-5 py-4 justify-between items-center">
                    <div className="flex items-center gap-2">
                        <MapPin size={20} className="text-muted-foreground" />
                        <h2 className="text-lg font-bold text-foreground">
                            {isEditing ? "Edit Route" : "Create Route"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex items-center p-1 justify-center rounded-md text-muted-foreground hover:bg-secondary
                            hover:text-foreground  transition cursor-pointer"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Smart Notifications Banner */}
                <div style={{ margin: "0 16px 12px", flexShrink: 0 }}>
                    <SmartNotifications surface="route_planning" />
                </div>

                {/* Body — map with the Route Plan panel overlaid */}
                <div className="flex-1 relative mx-4 rounded-[10px] overflow-hidden">
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
                <div className="flex shrink-0 py-3.5 px-5 gap-2 justify-between items-center">
                    <button
                        onClick={() => setIsSuggestOpen(true)}
                        className="py-2 px-3.5 text-[13px] font-medium text-primary-foreground cursor-pointer"
                    >
                        Suggest Routes
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="py-2.25 px-5 text-[13px] font-medium rounded-md bg-btn border border-btn-border text-foreground 
                                hover:bg-secondary  transition duration-350 cursor-pointer"
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
                            className={`py-2.25 px-5.5 text-[13px] font-semibold rounded-md text-background dark:text-foreground border 
                                bg-[#1e293b] dark:bg-btn border-btn-border transition duration-350 
                                ${
                                    canSave
                                        ? "hover:bg-secondary hover:text-foreground  opacity-100 cursor-pointer"
                                        : "opacity-70 cursor-not-allowed"
                                }`}
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
