import { mean, toPercent, basisText } from "../stats-utils.js";
import { formatDay } from "../time-utils.js";
import { makeNotification } from "../notification-factory.js";

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Future: Philippine holidays and known events inside the window.
// The calendar flag is a fact, so it always shows.
// Only the estimate of its effect on pace needs history. Without enough, the notification says so instead of guessing.
export function holidayEvent({ trips, dates, events, config }) {
    const window = new Set(dates);
    const upcoming = events.filter((e) => window.has(e.date));
    if (!upcoming.length) return {};

    const past = trips.filter((t) => t.eventDay);
    const normal = trips.filter((t) => !t.eventDay);
    const needed = config.minSamples.holiday;
    const enough =
        past.length >= needed && normal.length >= config.minSamples.stopPace;
    const lift = enough
        ? mean(past.map((t) => t.minPerStop)) /
              mean(normal.map((t) => t.minPerStop)) -
          1
        : null;
    const slower = enough && lift >= 0.1;

    return {
        items: upcoming.map((event) =>
            makeNotification({
                key: `future:event:${event.date}:${event.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                kind: "future",
                severity: slower ? "medium" : "info",
                title: `${event.name} on ${formatDay(event.date)}`,
                message: enough
                    ? `${capitalize(event.kind)}. On past holiday and event days trips took ${lift >= 0 ? `${toPercent(lift)}% longer` : `${toPercent(-lift)}% less time`} per stop than on normal days.`
                    : `${capitalize(event.kind)}. Only ${past.length} past trip${past.length === 1 ? "" : "s"} fell on holidays or events (${needed} needed), so the effect on pace cannot be estimated yet.`,
                suggestions: slower
                    ? [
                          {
                              label: "Allow more time per stop",
                              target: "routing",
                          },
                          { label: "Confirm customer receiving hours" },
                      ]
                    : [
                          {
                              label: "Confirm customer receiving hours before scheduling",
                          },
                          {
                              label: "Check driver availability for that day",
                              target: "drivers",
                          },
                      ],
                basis: enough
                    ? `holiday and event days: ${basisText(past)}`
                    : "Philippine holiday calendar",
            }),
        ),
    };
}
