const TIME_ZONE = "Asia/Manila";

const PARTS_FORMAT = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
});
const CLOCK_FORMAT = new Intl.DateTimeFormat("en-PH", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
});
const DAY_FORMAT = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "long",
    month: "short",
    day: "numeric",
});
const WEEKDAY_INDEX = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
};

export const DAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

// Noon is used for date math so a one-hour shift can never move the date across midnight.
const noonOf = (dateKey) => new Date(`${dateKey}T12:00:00+08:00`);

export function manilaParts(date) {
    const parts = Object.fromEntries(
        PARTS_FORMAT.formatToParts(date).map((part) => [part.type, part.value]),
    );
    return {
        dateKey: `${parts.year}-${parts.month}-${parts.day}`,
        hour: Number(parts.hour),
        minute: Number(parts.minute),
        dayOfWeek: WEEKDAY_INDEX[parts.weekday],
    };
}

export const dateKeyOf = (date) => manilaParts(date).dateKey;
export const dayOfWeekOf = (dateKey) => noonOf(dateKey).getUTCDay();

export function addDays(dateKey, days) {
    const date = noonOf(dateKey);
    date.setUTCDate(date.getUTCDate() + days);
    return dateKeyOf(date);
}

export function cutoffAt(dateKey, hour) {
    return new Date(`${dateKey}T${String(hour).padStart(2, "0")}:00:00+08:00`);
}

export const formatClock = (date) => CLOCK_FORMAT.format(date);
export const formatDay = (dateKey) => DAY_FORMAT.format(noonOf(dateKey));
