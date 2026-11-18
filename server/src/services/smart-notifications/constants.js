export const SURFACES = ["dashboard", "route_planning"];

// Every value here is a starting point. The spec leaves them open, so tune them once there is real data.
export const NOTIFICATION_CONFIG = {
    workEndHour: 18,
    refreshMs: {
        immediate: 5 * 60 * 1000,
        future: 24 * 60 * 60 * 1000,
    },
    // Open-Meteo serves at most 92 past days, so a longer window would have no rainfall to compare against.
    lookbackDays: Math.min(
        92,
        Number(process.env.NOTIFICATIONS_LOOKBACK_DAYS ?? 90),
    ),
    depot: {
        lat: Number(process.env.DEPOT_LAT ?? 14.5995),
        lng: Number(process.env.DEPOT_LNG ?? 120.9842),
    },
    // Each notification type needs enough history of its own subject, so there is no single global minimum.
    minSamples: {
        stopPace: 15,
        rainComparison: 10,
        weekday: 8,
        holiday: 5,
        fuel: 10,
    },
    thresholds: {
        heavyRainMmPerHour: 2.5,
        rainyDayMm: 10,
        congestionRatio: 1.5,
        cutoffWarnMinutes: 30,
        lateRateLiftRatio: 1.5,
        fuelWorsePct: 8,
        holidayLookaheadDays: 7,
        // A dismissed notification returns when its severity changes, or its metric moves by at least this percent and its own minimum step.
        materialChangePct: 25,
    },
};
