"use client";
import {
    DndContext,
    closestCenter,
    DragEndEvent,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Stop, RouteSegment } from "@/lib/types/schema";
import { formatDistance, formatDuration } from "@/lib/routing/formatters";
import { useTheme } from "@/lib/theme-context";
import SortableStopItem from "./SortableStopItem";
import AddStopPopover from "./LocationSearchBar";
import { DARK } from "./routeTheme";
import { PANEL_TOP, PANEL_LEFT, PANEL_WIDTH } from "./layout";

interface RouteOrderingPanelProps {
    stops: Stop[];
    segments: RouteSegment[];
    totalDistanceKm: number;
    totalDurationMinutes: number;
    isEditMode: boolean;
    isLoading: boolean;
    routeError: string | null;
    onReorder: (newStops: Stop[]) => void;
    onRemoveStop: (id: string) => void;
    onAddStop: (stop: Stop) => void;
    onPreview: (stop: Stop | null) => void;
}

export default function RouteOrderingPanel({
    stops,
    segments,
    totalDistanceKm,
    totalDurationMinutes,
    isEditMode,
    isLoading,
    routeError,
    onReorder,
    onRemoveStop,
    onAddStop,
    onPreview,
}: RouteOrderingPanelProps) {
    const { theme } = useTheme();
    const dark = theme === "dark";
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIdx = stops.findIndex((s) => s.id_ === active.id);
        const newIdx = stops.findIndex((s) => s.id_ === over.id);
        if (oldIdx < 0 || newIdx < 0) return;
        onReorder(arrayMove(stops, oldIdx, newIdx));
    }

    function segmentBefore(stopId: string): RouteSegment | undefined {
        return segments.find((seg) => seg.toId === stopId);
    }

    function getRole(idx: number): "start" | "intermediate" | "end" {
        if (idx === 0) return "start";
        if (idx === stops.length - 1 && stops.length > 1) return "end";
        return "intermediate";
    }

    return (
        <div
            style={{
                position: "absolute",
                top: `${PANEL_TOP}px`,
                left: `${PANEL_LEFT}px`,
                zIndex: 9999,
                width: `${PANEL_WIDTH}px`,
                background: dark ? DARK.panelBg : "#fff",
                border: `1px solid ${dark ? DARK.panelBorder : "#e5e7eb"}`,
                borderRadius: "6px",
                boxShadow: dark
                    ? "0 4px 20px rgba(0,0,0,0.5)"
                    : "0 4px 20px rgba(0,0,0,0.12)",
                fontFamily: "inherit",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: "10px 14px",
                    borderBottom: `1px solid ${dark ? DARK.panelBorder : "#e5e7eb"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <span
                    style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: dark ? DARK.text : "#111827",
                    }}
                >
                    Route Plan
                </span>
                <span
                    style={{
                        fontSize: "11px",
                        color: routeError
                            ? "#ef4444"
                            : dark
                              ? DARK.textMuted
                              : "#6b7280",
                    }}
                >
                    {isLoading
                        ? "Calculating…"
                        : routeError
                          ? "Route unavailable"
                          : totalDistanceKm > 0
                            ? `${formatDistance(totalDistanceKm)} · ${formatDuration(totalDurationMinutes)}`
                            : ""}
                </span>
            </div>

            {/* Scrollable stops list */}
            <div
                className="route-scrollbar"
                style={{
                    maxHeight: "430px",
                    overflowY: "auto",
                    padding: "10px 10px 8px",
                }}
            >
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={stops.map((s) => s.id_)}
                        strategy={verticalListSortingStrategy}
                    >
                        {stops.map((stop, idx) => {
                            const seg =
                                idx > 0 ? segmentBefore(stop.id_) : undefined;
                            return (
                                <SortableStopItem
                                    key={stop.id_}
                                    stop={stop}
                                    role={getRole(idx)}
                                    stopNumber={idx}
                                    isEditMode={isEditMode}
                                    onRemove={onRemoveStop}
                                    distanceLabel={
                                        seg
                                            ? formatDistance(seg.distanceKm)
                                            : undefined
                                    }
                                    durationLabel={
                                        seg
                                            ? formatDuration(
                                                  seg.durationMinutes,
                                              )
                                            : undefined
                                    }
                                />
                            );
                        })}
                    </SortableContext>
                </DndContext>

                {/* Add stop popover — saved locations + geo search in one entry point */}
                {isEditMode && (
                    <AddStopPopover
                        stops={stops}
                        onAddStop={onAddStop}
                        onPreview={onPreview}
                    />
                )}
            </div>

            {/* Error footer */}
            {routeError && (
                <div
                    style={{
                        padding: "7px 14px",
                        borderTop: `1px solid ${dark ? "rgba(239,68,68,0.4)" : "#fee2e2"}`,
                        background: dark ? "rgba(239,68,68,0.12)" : "#fff7f7",
                        fontSize: "11px",
                        color: dark ? "#fca5a5" : "#dc2626",
                        borderRadius: "0 0 6px 6px",
                    }}
                >
                    Could not reach OSRM. Showing stops only.
                </div>
            )}
        </div>
    );
}
