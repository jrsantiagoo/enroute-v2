import { lateRate, toPercent, basisText } from "../stats-utils.js";
import { DAY_NAMES, dayOfWeekOf, formatDay } from "../time-utils.js";
import { makeNotification } from "../notification-factory.js";
import { isLateModelUsable } from "../model-scorer.js";

// Future: weekdays on which routes have finished after 6 PM noticeably more often than on other days.
// Steps aside while the trained late-finish model is usable, because late-risk.js covers the same question.
export function weekdayPattern({ trips, dates, config, model }) {
    if (isLateModelUsable(model)) return {};

    const targets = dates.slice(0, 3);
    const needed = config.minSamples.weekday;
    const overall = lateRate(trips);
    const items = [];
    let anyHasEnough = false;

    for (const date of targets) {
        const dayOfWeek = dayOfWeekOf(date);
        const sameDay = trips.filter((t) => t.dayOfWeek === dayOfWeek);
        if (sameDay.length < needed) continue;

        anyHasEnough = true;
        const rate = lateRate(sameDay);
        const clearlyWorse =
            rate - overall >= 0.1 &&
            rate >= overall * config.thresholds.lateRateLiftRatio;
        if (!clearlyWorse) continue;

        items.push(
            makeNotification({
                key: `future:weekday:${date}`,
                kind: "future",
                severity: rate >= 0.4 ? "high" : "medium",
                title: `${DAY_NAMES[dayOfWeek]}s often run late (${formatDay(date)})`,
                message: `${toPercent(rate)}% of ${DAY_NAMES[dayOfWeek]} trips finished after 6 PM, against ${toPercent(overall)}% across all days.`,
                suggestions: [
                    { label: "Start earlier on this day" },
                    {
                        label: "Lighten the load for orders scheduled this day",
                        target: "assignment",
                    },
                ],
                basis: `${DAY_NAMES[dayOfWeek]} trips: ${basisText(sameDay)}`,
                metric: toPercent(rate),
                metricStep: 10,
            }),
        );
    }

    if (!anyHasEnough && targets.length) {
        const best = Math.max(
            ...targets.map(
                (d) =>
                    trips.filter((t) => t.dayOfWeek === dayOfWeekOf(d)).length,
            ),
        );
        return {
            insufficient: [
                {
                    topic: "Weekday late-finish pattern",
                    have: best,
                    need: needed,
                    unit: "trips on the same weekday",
                },
            ],
        };
    }
    return { items };
}
