import {
    mean,
    toPercent,
    lateRate,
    fuelStat,
    basisText,
} from "../stats-utils.js";
import { formatDay } from "../time-utils.js";
import { makeNotification } from "../notification-factory.js";

// Future: rain forecast for upcoming days against how rainy days went before (pace, late finishes, fuel).
export function forecastRain({ trips, dates, live, config }) {
    if (!live?.weather) return {};

    // The forecast is only trusted for the next three days; beyond that it is too uncertain to advise on.
    const rainyDays = dates
        .slice(0, 3)
        .filter(
            (d) =>
                (live.weather.daily[d]?.precipMm ?? 0) >=
                config.thresholds.rainyDayMm,
        );
    if (!rainyDays.length) return {};

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

    const paceLift =
        mean(wet.map((t) => t.minPerStop)) /
            mean(dry.map((t) => t.minPerStop)) -
        1;
    const lateWet = lateRate(wet);
    const lateDry = lateRate(dry);
    if (paceLift < 0.05 && lateWet - lateDry < 0.1) return {};

    const fuelWet = fuelStat(wet);
    const fuelDry = fuelStat(dry);
    const fuelWorsePct =
        fuelWet.count >= config.minSamples.fuel &&
        fuelDry.count >= config.minSamples.fuel
            ? (fuelWet.mean / fuelDry.mean - 1) * 100
            : null;

    const facts = [];
    if (paceLift >= 0.05)
        facts.push(`trips took ${toPercent(paceLift)}% longer per stop`);
    if (lateWet - lateDry >= 0.1)
        facts.push(
            `${toPercent(lateWet)}% finished after 6 PM versus ${toPercent(lateDry)}% on dry days`,
        );
    if (fuelWorsePct != null && fuelWorsePct >= config.thresholds.fuelWorsePct)
        facts.push(
            `fuel use per 100 km was ${Math.round(fuelWorsePct)}% higher`,
        );

    return {
        items: rainyDays.map((date) => {
            const mm = live.weather.daily[date].precipMm;
            return makeNotification({
                key: `future:rain:${date}`,
                kind: "future",
                severity: lateWet - lateDry >= 0.2 ? "high" : "medium",
                title: `Rain expected ${formatDay(date)} (about ${Math.round(mm)} mm)`,
                message: `On past rainy days (${config.thresholds.rainyDayMm} mm or more): ${facts.join("; ")}.`,
                suggestions: [
                    {
                        label: "Plan fewer stops per route that day",
                        target: "routing",
                    },
                    { label: "Start the first dispatch earlier" },
                    {
                        label: "Move flexible orders to a drier day",
                        target: "assignment",
                    },
                ],
                basis: `rainy days: ${basisText(wet)}; dry days: ${dry.length} trips; forecast`,
                metric: Math.round(mm),
                metricStep: 5,
            });
        }),
    };
}
