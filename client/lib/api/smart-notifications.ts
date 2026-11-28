import type {
    NotificationSurface,
    SmartNotificationsResponse,
} from "@/lib/types/smart-notifications";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const BASE_PATH = "/api/smart-notifications";

// TODO (paul): Replace this with however the app already attaches the Supabase access token to requests.
function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("access_token");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getAccessToken();
    const response = await fetch(`${API_URL}${BASE_PATH}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...init.headers,
        },
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(body?.message ?? `Request failed (${response.status})`);
    }
    return body as T;
}

export async function fetchSmartNotifications(
    surface: NotificationSurface,
    date?: string,
): Promise<SmartNotificationsResponse> {
    const query = new URLSearchParams({ surface, ...(date ? { date } : {}) });
    const body = await request<{ data: SmartNotificationsResponse }>(
        `/?${query}`,
    );
    return body.data;
}

export async function dismissSmartNotification(
    surface: NotificationSurface,
    key: string,
    date?: string,
): Promise<void> {
    await request(`/dismiss`, {
        method: "POST",
        body: JSON.stringify({ surface, key, date }),
    });
}
