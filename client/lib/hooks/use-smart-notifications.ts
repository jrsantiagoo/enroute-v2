import { useCallback, useEffect, useRef, useState } from "react";
import {
    dismissSmartNotification,
    fetchSmartNotifications,
} from "@/lib/api/smart-notifications";
import type {
    NotificationSurface,
    SmartNotificationsResponse,
} from "@/lib/types/smart-notifications";

// The server only recomputes immediate notifications every 5 minutes, so polling this often just picks the result up promptly.
const POLL_INTERVAL_MS = 60 * 1000;

export function useSmartNotifications(
    surface: NotificationSurface,
    date?: string,
) {
    const [data, setData] = useState<SmartNotificationsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const requestId = useRef(0);

    const load = useCallback(async () => {
        // Guards against a slow response for an old date overwriting a newer one.
        const thisRequest = ++requestId.current;
        try {
            const result = await fetchSmartNotifications(surface, date);
            if (thisRequest !== requestId.current) return;
            setData(result);
            setError(null);
        } catch (e) {
            if (thisRequest !== requestId.current) return;
            setError(e instanceof Error ? e.message : "Request failed");
        } finally {
            if (thisRequest === requestId.current) setLoading(false);
        }
    }, [surface, date]);

    useEffect(() => {
        setLoading(true);
        void load();
        const id = setInterval(() => void load(), POLL_INTERVAL_MS);
        return () => clearInterval(id);
    }, [load]);

    // Hides the notification right away, then reloads from the server if saving the dismissal fails.
    const dismiss = useCallback(
        async (key: string) => {
            setData(
                (current) =>
                    current && {
                        ...current,
                        immediate: current.immediate.filter(
                            (n) => n.key !== key,
                        ),
                        future: current.future.filter((n) => n.key !== key),
                    },
            );
            try {
                await dismissSmartNotification(surface, key, date);
            } catch {
                void load();
            }
        },
        [surface, date, load],
    );

    return { data, error, loading, dismiss };
}
