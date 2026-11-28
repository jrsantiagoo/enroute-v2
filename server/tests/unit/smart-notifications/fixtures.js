import { NOTIFICATION_CONFIG } from "../../../src/services/smart-notifications/constants.js";
import {
    addDays,
    manilaParts,
} from "../../../src/services/smart-notifications/time-utils.js";

// Tuesday 2026-11-10 at 15:00 Manila time.
export const NOW = new Date("2026-11-10T15:00:00+08:00");
export const MIN = 60 * 1000;
export const HOUR = 60 * MIN;
export { NOTIFICATION_CONFIG };

// History for the last N days, excluding today. Every fourth day is rainy; rainy trips are slower and the first one each rainy day finishes late.
export function makeHistory(days = 60, perDay = 2) {
    const trips = [];
    const weather = [];
    const today = manilaParts(NOW).dateKey;

    for (let i = 1; i <= days; i++) {
        const dateKey = addDays(today, -i);
        const rainy = i % 4 === 0;
        weather.push({ dateKey, precipMm: rainy ? 20 : 1 });

        for (let j = 0; j < perDay; j++) {
            const stops = 8;
            const minutesPerStop = rainy ? 30 : 20;
            const late = rainy && j === 0;
            const startedAt = new Date(
                `${dateKey}T${late ? "10" : "08"}:00:00+08:00`,
            );
            const completedAt = late
                ? new Date(`${dateKey}T18:30:00+08:00`)
                : new Date(startedAt.getTime() + stops * minutesPerStop * MIN);

            trips.push({
                id: `t${i}-${j}`,
                startedAt,
                completedAt,
                stops,
                distanceKm: 60,
                fuelLiters: rainy ? 8 : 6,
                driverId: `d${j + 1}`,
                vehicleId: `v${j + 1}`,
            });
        }
    }
    return { trips, weather };
}

export function makeRepository({ trips, weather, active = [], events = [] }) {
    return {
        saved: [],
        loadCompletedTrips: async () => trips,
        loadActiveTrips: async () => active,
        loadDailyWeather: async () => weather,
        saveDailyWeather: async function (rows) {
            this.saved.push(...rows);
        },
        loadKnownEvents: async () => events,
    };
}

// Minimal in-memory stand-in for the SmartNotificationDismissal Prisma delegate.
export function makePrisma() {
    const rows = [];
    let counter = 0;

    return {
        rows,
        smartNotificationDismissal: {
            findMany: async ({ where }) =>
                rows.filter(
                    (r) =>
                        r.manager_id_ === where.manager_id_ &&
                        r.surface === where.surface,
                ),
            deleteMany: async ({ where }) => {
                for (const id of where.id_.in)
                    rows.splice(
                        rows.findIndex((r) => r.id_ === id),
                        1,
                    );
            },
            upsert: async ({ where, create, update }) => {
                const scope = where.dismissal_scope;
                const hit = rows.find(
                    (r) =>
                        r.manager_id_ === scope.manager_id_ &&
                        r.surface === scope.surface &&
                        r.notification_key === scope.notification_key,
                );
                if (hit) Object.assign(hit, update);
                else rows.push({ id_: `x${++counter}`, ...create });
            },
        },
    };
}

export function makeProviders({
    rainNow = 0,
    ratio = 1.2,
    forecastRainDate,
    down = false,
} = {}) {
    const providers = {
        calls: { weather: 0, traffic: 0 },
        down,
        ratio,
        rainNow,
        weather: async () => {
            providers.calls.weather++;
            if (providers.down) throw new Error("provider down");

            const daily = {};
            for (let i = 0; i < 16; i++) {
                const day = addDays("2026-11-10", i);
                daily[day] = {
                    precipMm: day === forecastRainDate ? 25 : 0,
                    probMax: 80,
                };
            }
            return { currentPrecipMm: providers.rainNow, daily };
        },
        traffic: async () => {
            providers.calls.traffic++;
            if (providers.down) throw new Error("provider down");
            return {
                samples: 3,
                worstRatio: providers.ratio,
                avgRatio: providers.ratio,
            };
        },
        dailyWeatherHistory: async () => [],
    };
    return providers;
}

export function makeClock(start) {
    const clock = {
        time: start.getTime(),
        now: () => new Date(clock.time),
        advance: (ms) => {
            clock.time += ms;
        },
    };
    return clock;
}
