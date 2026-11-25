import { toPercent } from "../stats-utils.js";
import { dayOfWeekOf, formatDay } from "../time-utils.js";
import { makeNotification } from "../notification-factory.js";
import { isLateModelUsable, predictLate, modelBasis } from "../model-scorer.js";

const MIN_PROBABILITY = 0.35;
const MIN_LIFT = 1.5;

// Future: days the trained model expects to run past 6 PM, using the weekday, forecast rain and holidays.
// It replaces the weekday-pattern rule while the model is usable. Without a usable model it returns nothing.
export function lateRisk({ dates, events, live, model }) {
    if (!isLateModelUsable(model)) return {};

    const eventDays = new Set(events.map((e) => e.date));
    const baseRate = model.late.baseRate;
    const items = [];

    for (const date of dates.slice(0, 3)) {
        const prediction = predictLate(model, {
            dayOfWeek: dayOfWeekOf(date),
            precipMm: live?.weather?.daily[date]?.precipMm,
            eventDay: eventDays.has(date),
        });
        const p = prediction.probability;
        if (p < MIN_PROBABILITY || p < baseRate * MIN_LIFT) continue;

        const because = prediction.factors.length
            ? ` Mostly because it is ${prediction.factors.join(" and ")}.`
            : "";
        items.push(
            makeNotification({
                key: `future:late-risk:${date}`,
                kind: "future",
                severity: p >= 0.5 ? "high" : "medium",
                title: `Trips may run late on ${formatDay(date)}`,
                message: `The model puts the chance of a trip finishing after 6 PM at ${toPercent(p)}%, against ${toPercent(baseRate)}% on a typical day.${because}`,
                suggestions: [
                    { label: "Start earlier on this day" },
                    {
                        label: "Lighten the load for orders scheduled this day",
                        target: "assignment",
                    },
                ],
                basis: `late-finish model ${modelBasis(model, "late")}`,
                metric: toPercent(p),
                metricStep: 10,
            }),
        );
    }
    return { items };
}
