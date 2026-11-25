import { cutoffRisk } from "./rules/cutoff-risk.js";
import { trafficCongestion } from "./rules/traffic-congestion.js";
import { heavyRain } from "./rules/heavy-rain.js";
import { forecastRain } from "./rules/forecast-rain.js";
import { holidayEvent } from "./rules/holiday-event.js";
import { weekdayPattern } from "./rules/weekday-pattern.js";
import { lateRisk } from "./rules/late-risk.js";
import { bySeverity } from "./notification-factory.js";

function runRules(rules, context) {
    const items = [];
    const insufficient = [];

    for (const rule of rules) {
        const result = rule(context);
        items.push(...(result.items ?? []));
        for (const note of result.insufficient ?? []) {
            if (!insufficient.some((n) => n.topic === note.topic))
                insufficient.push(note);
        }
    }
    return { items: items.sort(bySeverity), insufficient };
}

// The engine is pure: the same context always produces the same notifications, which keeps it easy to test.
// Immediate rules need live weather and traffic, so context.live must be present.
export const runImmediate = (context) =>
    runRules([cutoffRisk, trafficCongestion, heavyRain], context);

// Future rules may run with context.live set to null. Rules that need the forecast then return nothing.
export const runFuture = (context) =>
    runRules([forecastRain, holidayEvent, weekdayPattern, lateRisk], context);
