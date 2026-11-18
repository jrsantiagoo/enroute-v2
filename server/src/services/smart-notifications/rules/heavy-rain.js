import { mean, toPercent, basisText } from "../stats-utils.js";
import { makeNotification } from "../notification-factory.js";

// Immediate: it is raining hard now, so compare how past rainy days went against dry days.
export function heavyRain({ trips, active, live, config }) {
    const rainNow = live.weather.currentPrecipMm;
    if (rainNow < config.thresholds.heavyRainMmPerHour || !active.length)
        return {};

    const wet = trips.filter((t) => t.rainy === true);
    const dry = trips.filter((t) => t.rainy === false);
    const needed = config.minSamples.rainComparison;
    if (wet.length < needed || dry.length < needed) {
        return {
            insufficient: [
                {
                    topic: "Rain impact on delivery pace",
                    have: Math.min(wet.length, dry.length),
                    need: needed,
                    unit: "trips on rainy and on dry days (each)",
                },
            ],
        };
    }

    const lift =
        mean(wet.map((t) => t.minPerStop)) /
            mean(dry.map((t) => t.minPerStop)) -
        1;
    if (lift < 0.05) return {};

    return {
        items: [
            makeNotification({
                key: "immediate:heavy-rain",
                kind: "immediate",
                severity: rainNow >= 7.5 ? "high" : "medium",
                title: "Heavy rain may slow active routes",
                message: `Rain is falling at ${rainNow.toFixed(1)} mm/h. On rainy days (${config.thresholds.rainyDayMm} mm or more) trips took ${toPercent(lift)}% longer per stop than on dry days.`,
                suggestions: [
                    {
                        label: "Hold non-urgent dispatches until the rain eases",
                    },
                    {
                        label: "Reduce stops per route for trips starting now",
                        target: "routing",
                    },
                ],
                basis: `rainy days: ${basisText(wet)}; dry days: ${dry.length} trips; live weather now`,
                metric: Math.round(rainNow * 10) / 10,
                metricStep: 2.5,
            }),
        ],
    };
}
