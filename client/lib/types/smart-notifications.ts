export type NotificationSurface = "dashboard" | "route_planning";
export type NotificationSeverity = "high" | "medium" | "info";

// Pages a suggestion can point to. A suggestion only ever links to a page; it never changes data.
export type SuggestionTarget = "assignment" | "routing" | "fleet" | "drivers";

export interface NotificationSuggestion {
    label: string;
    target?: SuggestionTarget;
}

export interface SmartNotification {
    key: string;
    kind: "immediate" | "future";
    severity: NotificationSeverity;
    title: string;
    message: string;
    suggestions: NotificationSuggestion[];
    basis: string;
    updatedAt: string;
    stale: boolean;
    updated: boolean;
}

export interface InsufficientDataNote {
    topic: string;
    have: number;
    need: number;
    unit: string;
}

export interface SmartNotificationsResponse {
    generatedAt: string;
    liveAvailable: boolean;
    immediate: SmartNotification[];
    future: SmartNotification[];
    insufficient: InsufficientDataNote[];
}
