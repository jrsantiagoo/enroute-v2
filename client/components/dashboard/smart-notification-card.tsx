import Link from "next/link";
import { ArrowRight, Info, TriangleAlert, X } from "lucide-react";
import type {
    NotificationSeverity,
    SmartNotification,
    SuggestionTarget,
} from "@/lib/types/smart-notifications";

// These match the folders under client/app/(protected). There is no driver page, and drivers are managed on the assignment page.
const SUGGESTION_TARGET_HREFS: Record<SuggestionTarget, string> = {
    assignment: "/assignment",
    routing: "/route-tool",
    fleet: "/fleet-management",
    drivers: "/assignment",
};

// High severity matches the red "unassigned trips" banner so the two read as the same kind of alert.
const SEVERITY_STYLES: Record<
    NotificationSeverity,
    { container: string; icon: string }
> = {
    high: {
        container:
            "border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10",
        icon: "text-red-600 dark:text-red-400",
    },
    medium: {
        container:
            "border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10",
        icon: "text-amber-600 dark:text-amber-400",
    },
    info: {
        container: "border-card-border bg-card",
        icon: "text-primary-foreground",
    },
};

const KIND_LABELS: Record<SmartNotification["kind"], string> = {
    immediate: "Act now",
    future: "Plan ahead",
};

export function formatTimeAgo(iso: string, now: number): string {
    const minutes = Math.max(
        0,
        Math.floor((now - new Date(iso).getTime()) / 60_000),
    );
    if (minutes < 1) return "Updated just now";
    if (minutes < 60) return `Updated ${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 48) return `Updated ${hours} h ago`;
    return `Updated ${Math.floor(hours / 24)} days ago`;
}

interface SmartNotificationCardProps {
    notification: SmartNotification;
    now: number;
    onDismiss: (key: string) => void;
}

// A single notification: what is happening, why, and suggested next steps. Suggestions are advice only.
export default function SmartNotificationCard({
    notification,
    now,
    onDismiss,
}: SmartNotificationCardProps) {
    const styles = SEVERITY_STYLES[notification.severity];
    const Icon = notification.severity === "info" ? Info : TriangleAlert;

    return (
        <article
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${styles.container}`}
        >
            <Icon size={18} className={`mt-0.5 shrink-0 ${styles.icon}`} />

            <div className="min-w-0 flex-1">
                {/* Labels and last-updated time */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-card-border bg-background px-2 py-0.5 text-xs font-semibold text-foreground">
                        {KIND_LABELS[notification.kind]}
                    </span>
                    {notification.updated && (
                        <span className="rounded-full border border-amber-400 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                            Updated
                        </span>
                    )}
                    {notification.stale && (
                        <span className="rounded-full border border-amber-400 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                            Based on older data
                        </span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                        {formatTimeAgo(notification.updatedAt, now)}
                    </span>
                </div>

                <h4 className="mt-1.5 text-sm font-semibold text-foreground">
                    {notification.title}
                </h4>
                <p className="mt-0.5 text-sm text-foreground/80">
                    {notification.message}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Data used: {notification.basis}
                </p>

                {/* Suggested next steps */}
                {notification.suggestions.length > 0 && (
                    <div className="mt-3">
                        <p className="text-xs font-semibold text-muted-foreground">
                            Suggested next steps
                        </p>
                        <ul className="mt-1 flex flex-col gap-1">
                            {notification.suggestions.map((suggestion) => (
                                <li
                                    key={suggestion.label}
                                    className="flex items-start gap-2 text-sm text-foreground"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground"
                                    />
                                    {suggestion.target ? (
                                        <Link
                                            href={
                                                SUGGESTION_TARGET_HREFS[
                                                    suggestion.target
                                                ]
                                            }
                                            className="inline-flex items-center gap-1 font-medium text-primary-foreground hover:underline"
                                        >
                                            {suggestion.label}
                                            <ArrowRight size={14} />
                                        </Link>
                                    ) : (
                                        <span>{suggestion.label}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={() => onDismiss(notification.key)}
                aria-label={`Dismiss: ${notification.title}`}
                className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
                <X size={16} />
            </button>
        </article>
    );
}
