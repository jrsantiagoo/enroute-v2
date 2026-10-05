export function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
}

export function formatDuration(minutes: number): string {
    const total = Math.round(minutes);
    if (total < 60) return `${total} min`;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// "July 07, 2026, 2:22PM"
export function formatDateTime(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const date = d.toLocaleDateString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
    });
    const time = d
        .toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        })
        .replace(/\s/g, "");
    return `${date}, ${time}`;
}

export function formatWeek(isoMonday: string): string {
    const [y, mo, d] = isoMonday.split("-").map(Number);
    const start = new Date(y, mo - 1, d);
    const end = new Date(y, mo - 1, d + 6);
    const short: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
    };
    const full: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
    };
    return `${start.toLocaleDateString("en-PH", short)} – ${end.toLocaleDateString("en-PH", full)}`;
}

function toISODate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
    ).padStart(2, "0")}`;
}

// ISO Mondays (YYYY-MM-DD): current week + the next `count - 1` weeks
export function getUpcomingWeekKeys(count: number = 5): string[] {
    const today = new Date();
    const monday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - ((today.getDay() + 6) % 7),
    );
    return Array.from({ length: count }, (_, i) =>
        toISODate(
            new Date(
                monday.getFullYear(),
                monday.getMonth(),
                monday.getDate() + i * 7,
            ),
        ),
    );
}
