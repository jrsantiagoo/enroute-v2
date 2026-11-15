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
            className="flex flex-col absolute z-9999 rounded-md bg-card border border-card-border shadow-lg shadow-black/10 dark:shadow-black/50"
            style={{
                top: `${PANEL_TOP}px`,
                left: `${PANEL_LEFT}px`,
                width: `${PANEL_WIDTH}px`,
            }}
        >
            {/* Header */}
            <div className="flex px-3.5 py-2.5 justify-between items-center border-b border-solid border-card-border">
                <span className="font-bold text-[13px] text-foreground">
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
            <div className="route-scrollbar px-2.5 pt-2.5 pb-2 max-h-107.5 overflow-y-auto">
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
                    className="px-3.5 py-1.75 text-[11px] rounded-b-md border-t border-solid bg-background dark:bg-[#ef4444]/12 
                        border-[#fee2e2] dark:border-[#ef4444]/40 text-[#dc2626] dark:text-[#fca5a5]"
                >
                    Could not reach OSRM. Showing stops only.
                </div>
            )}
        </div>
    );
}
