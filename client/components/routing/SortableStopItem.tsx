"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Stop } from "@/lib/types/schema";
import { formatOrderLabel } from "@/lib/routing/orderData";
import { useTheme } from "@/lib/theme-context";
import { DARK } from "./routeTheme";

interface SortableStopItemProps {
    stop: Stop;
    role: "start" | "intermediate" | "end";
    /** 1-based badge number shown for intermediate stops (equals array index) */
    stopNumber: number;
    isEditMode: boolean;
    onRemove: (id: string) => void;
    distanceLabel?: string;
    durationLabel?: string;
}

const ROLE_STYLES = {
    start: {
        badge: "S",
        badgeColor: "#22c55e",
        bg: "#f0fdf4",
        border: "#bbf7d0",
        label: "INITIAL LOCATION",
    },
    end: {
        badge: "E",
        badgeColor: "#ef4444",
        bg: "#fff7f7",
        border: "#fecaca",
        label: "FINAL LOCATION",
    },
    intermediate: {
        badge: null,
        badgeColor: "#3b82f6",
        bg: "#f9fafb",
        border: "#e5e7eb",
        label: null,
    },
};

// Dark-mode box backgrounds/borders per role (badge colors are kept from above).
const ROLE_STYLES_DARK = {
    start: { bg: DARK.startBg, border: DARK.startBorder },
    end: { bg: DARK.endBg, border: DARK.endBorder },
    intermediate: { bg: DARK.midBg, border: DARK.midBorder },
};

export default function SortableStopItem({
    stop,
    role,
    stopNumber,
    isEditMode,
    onRemove,
    distanceLabel,
    durationLabel,
}: SortableStopItemProps) {
    const { theme } = useTheme();
    const dark = theme === "dark";
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: stop.id_, disabled: !isEditMode });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
    };

    const { badge, badgeColor, label } = ROLE_STYLES[role];
    const bg = dark ? ROLE_STYLES_DARK[role].bg : ROLE_STYLES[role].bg;
    const border = dark
        ? ROLE_STYLES_DARK[role].border
        : ROLE_STYLES[role].border;
    const badgeContent = badge ?? String(stopNumber);
    const isEndpoint = role === "start" || role === "end";
    const hasOrders = !!stop.orderIds && stop.orderIds.length > 0;
    const title = hasOrders ? formatOrderLabel(stop.orderIds!) : stop.name;
    const showAddress = hasOrders || !isEndpoint;
    const isUrgent = stop.priority === "urgent";

    return (
        <div ref={setNodeRef} style={style}>
            {/* Segment connector above (skipped for the first stop) */}
            {(distanceLabel || durationLabel) && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "2px 8px 2px 32px",
                        fontSize: "11px",
                        color: dark ? DARK.textMuted : "#9ca3af",
                        gap: "4px",
                    }}
                >
                    <div
                        style={{
                            width: "1px",
                            height: "12px",
                            background: dark ? DARK.connector : "#d1d5db",
                            marginRight: "4px",
                        }}
                    />
                    {distanceLabel && <span>{distanceLabel}</span>}
                    {distanceLabel && durationLabel && <span>·</span>}
                    {durationLabel && <span>{durationLabel}</span>}
                </div>
            )}

            {/* Stop row */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: isEndpoint ? "7px 8px" : "6px 8px",
                    borderRadius: "4px",
                    background: isEndpoint
                        ? bg
                        : isEditMode
                          ? bg
                          : "transparent",
                    border: isEndpoint
                        ? `1px solid ${border}`
                        : isEditMode
                          ? `1px solid ${border}`
                          : "1px solid transparent",
                    marginBottom: "2px",
                }}
            >
                {/* Drag handle — visible in edit mode for all stops */}
                {isEditMode && (
                    <button
                        {...attributes}
                        {...listeners}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: isDragging ? "grabbing" : "grab",
                            color: "#9ca3af",
                            padding: "0 2px",
                            fontSize: "14px",
                            lineHeight: 1,
                            flexShrink: 0,
                            touchAction: "none",
                        }}
                        title="Drag to reorder"
                        aria-label="Drag to reorder stop"
                    >
                        ⠿
                    </button>
                )}

                {/* Badge */}
                <div
                    style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: badgeColor,
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    {badgeContent}
                </div>

                {/* Text content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {label && (
                        <div
                            style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                color: dark ? DARK.textMuted : "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                marginBottom: "1px",
                            }}
                        >
                            {label}
                        </div>
                    )}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            minWidth: 0,
                        }}
                    >
                        <span
                            style={{
                                fontSize: "13px",
                                fontWeight: hasOrders ? 700 : 500,
                                color: dark ? DARK.text : "#111827",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {title}
                        </span>
                        {isUrgent && (
                            <span
                                style={{
                                    flexShrink: 0,
                                    fontSize: "9px",
                                    fontWeight: 600,
                                    color: dark ? "#fca5a5" : "#dc2626",
                                    background: dark
                                        ? "rgba(239,68,68,0.15)"
                                        : "#fef2f2",
                                    border: `1px solid ${dark ? "rgba(239,68,68,0.35)" : "#fecaca"}`,
                                    borderRadius: "9999px",
                                    padding: "1px 6px",
                                }}
                            >
                                Urgent
                            </span>
                        )}
                    </div>
                    {showAddress && stop.address && (
                        <div
                            style={{
                                fontSize: "11px",
                                color: dark ? DARK.textMuted : "#9ca3af",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {stop.address}
                        </div>
                    )}
                </div>

                {/* Remove button — visible in edit mode for all stops */}
                {isEditMode && (
                    <button
                        onClick={() => onRemove(stop.id_)}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#9ca3af",
                            fontSize: "18px",
                            lineHeight: 1,
                            padding: "0 2px",
                            flexShrink: 0,
                        }}
                        title="Remove stop"
                        aria-label={`Remove ${stop.name}`}
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
}
