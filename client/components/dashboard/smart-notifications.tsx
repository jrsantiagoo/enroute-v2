"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown, CloudOff, Sparkles } from "lucide-react";
import { useCollapsedState } from "@/lib/hooks/use-collapsed-state";
import { useSmartNotifications } from "@/lib/hooks/use-smart-notifications";
import type {
    NotificationSurface,
    SmartNotificationsResponse,
} from "@/lib/types/smart-notifications";
import SmartNotificationCard from "./smart-notification-card";

// Keeps the dashboard calm: only the most important notifications show until the manager asks for the rest.
const MAX_COLLAPSED = 2;
const CLOCK_TICK_MS = 30 * 1000;
const COLLAPSED_STORAGE_PREFIX = "smart-notifications:collapsed:";

interface SmartNotificationsViewProps {
    data: SmartNotificationsResponse;
    now: number;
    collapsed: boolean;
    onToggleCollapsed: () => void;
    onDismiss: (key: string) => void;
}

// Presentational part, kept separate from the data fetching so it can be rendered with sample data.
export function SmartNotificationsView({
    data,
    now,
    collapsed,
    onToggleCollapsed,
    onDismiss,
}: SmartNotificationsViewProps) {
    const [showAll, setShowAll] = useState(false);
    const bodyId = useId();

    // Immediate notifications come first because they need action now.
    const notifications = [...data.immediate, ...data.future];
    const visible = showAll
        ? notifications
        : notifications.slice(0, MAX_COLLAPSED);
    const hiddenCount = notifications.length - visible.length;
    const hasHighSeverity = notifications.some((n) => n.severity === "high");

    // A one-line summary so a collapsed panel still tells the manager what is inside.
    const summary = [
        data.immediate.length > 0 && `${data.immediate.length} act now`,
        data.future.length > 0 && `${data.future.length} plan ahead`,
        !data.liveAvailable && "Live conditions unavailable",
    ].filter(Boolean);

    const hasNothingToShow =
        notifications.length === 0 &&
        data.insufficient.length === 0 &&
        data.liveAvailable;
    if (hasNothingToShow) return null;

    return (
        <section
            aria-label="Smart notifications"
            className="flex flex-col gap-3"
        >
            <h3 className="text-sm font-semibold text-foreground">
                <button
                    type="button"
                    onClick={onToggleCollapsed}
                    aria-expanded={!collapsed}
                    aria-controls={bodyId}
                    className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left transition hover:bg-secondary"
                >
                    <Sparkles size={16} className="text-primary-foreground" />
                    Smart notifications
                    {notifications.length > 0 && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                            {notifications.length}
                        </span>
                    )}
                    {collapsed && hasHighSeverity && (
                        <span
                            aria-hidden="true"
                            className="h-2 w-2 rounded-full bg-red-500"
                        />
                    )}
                    {collapsed && hasHighSeverity && (
                        <span className="sr-only">Includes high priority</span>
                    )}
                    {collapsed && summary.length > 0 && (
                        <span className="min-w-0 truncate text-xs font-normal text-muted-foreground">
                            {summary.join(" · ")}
                        </span>
                    )}
                    <ChevronDown
                        size={16}
                        className={`ml-auto shrink-0 text-muted-foreground transition ${collapsed ? "" : "rotate-180"}`}
                    />
                </button>
            </h3>

            {!collapsed && (
                <div id={bodyId} className="flex flex-col gap-3">
                    {/* Live weather or traffic is down, so only plan-ahead notifications are shown */}
                    {!data.liveAvailable && (
                        <div
                            role="status"
                            className="flex items-start gap-3 rounded-lg border border-card-border bg-card px-4 py-3 text-sm text-foreground"
                        >
                            <CloudOff
                                size={18}
                                className="mt-0.5 shrink-0 text-muted-foreground"
                            />
                            <p>
                                Live weather or traffic conditions are
                                unavailable, so act-now notifications are
                                hidden. Plan-ahead notifications below are based
                                on older data.
                            </p>
                        </div>
                    )}

                    {visible.map((notification) => (
                        <SmartNotificationCard
                            key={notification.key}
                            notification={notification}
                            now={now}
                            onDismiss={onDismiss}
                        />
                    ))}

                    {notifications.length > MAX_COLLAPSED && (
                        <button
                            type="button"
                            onClick={() => setShowAll((open) => !open)}
                            aria-expanded={showAll}
                            className="flex items-center gap-1 self-start rounded-lg px-2 py-1 text-sm font-semibold text-primary-foreground transition hover:bg-secondary"
                        >
                            {showAll
                                ? "Show fewer"
                                : `Show ${hiddenCount} more`}
                            <ChevronDown
                                size={16}
                                className={`transition ${showAll ? "rotate-180" : ""}`}
                            />
                        </button>
                    )}

                    {/* Topics with too little history to recommend anything yet */}
                    {data.insufficient.length > 0 && (
                        <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                            {data.insufficient.map((note) => (
                                <li key={note.topic}>
                                    Not enough history yet for “{note.topic}” (
                                    {note.have} of {note.need} {note.unit}).
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </section>
    );
}

interface SmartNotificationsProps {
    surface: NotificationSurface;
    date?: string;
}

// Advisory only. It shows notifications and suggestions, and never changes routes, orders or assignments.
// It renders nothing while loading or if the request fails, so a problem here can never break the page around it.
export default function SmartNotifications({
    surface,
    date,
}: SmartNotificationsProps) {
    const { data, dismiss } = useSmartNotifications(surface, date);
    const [now, setNow] = useState(() => Date.now());
    // Collapsing is remembered per surface, like dismissals, so the dashboard and route planning can differ.
    const [collapsed, toggleCollapsed] = useCollapsedState(
        `${COLLAPSED_STORAGE_PREFIX}${surface}`,
    );

    // Keeps "Updated 3 min ago" accurate between polls.
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
        return () => clearInterval(id);
    }, []);

    if (!data) return null;
    return (
        <SmartNotificationsView
            data={data}
            now={now}
            collapsed={collapsed}
            onToggleCollapsed={toggleCollapsed}
            onDismiss={dismiss}
        />
    );
}
