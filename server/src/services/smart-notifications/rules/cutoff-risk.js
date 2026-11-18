import { cutoffAt, formatClock } from "../time-utils.js";
import { paceStat, basisText } from "../stats-utils.js";
import { makeNotification } from "../notification-factory.js";

// Immediate: active trips projected to run past the 6 PM cutoff.
// This is a simple estimate (remaining stops x usual minutes per stop x current congestion), not a routing engine.
export function cutoffRisk({ now, todayKey, trips, active, live, config }) {
    const running = active.filter((t) => t.remainingStops > 0);
    if (!running.length) return {};

    const pace = paceStat(trips);
    const needed = config.minSamples.stopPace;
    if (pace.count < needed) {
        return {
            insufficient: [
                {
                    topic: "6 PM cutoff projection",
                    have: pace.count,
                    need: needed,
                    unit: "completed trips",
                },
            ],
        };
    }

    // Clamped so one bad traffic reading cannot project an absurd finish time.
    const congestion = Math.min(3, Math.max(1, live.traffic.avgRatio));
    const cutoff = cutoffAt(todayKey, config.workEndHour);
    const projections = running.map((trip) => {
        const minutes = trip.remainingStops * pace.mean * congestion;
        const finish = new Date(now.getTime() + minutes * 60000);
        return { finish, overMinutes: (finish - cutoff) / 60000 };
    });

    const atRisk = projections.filter(
        (p) => p.overMinutes > -config.thresholds.cutoffWarnMinutes,
    );
    if (!atRisk.length) return {};

    const worst = atRisk.reduce((a, b) =>
        b.overMinutes > a.overMinutes ? b : a,
    );
    const late = atRisk.filter((p) => p.overMinutes > 0).length;
    const plural = (n) => `${n} active route${n === 1 ? "" : "s"}`;

    return {
        items: [
            makeNotification({
                key: "immediate:cutoff-risk",
                kind: "immediate",
                severity: late ? "high" : "medium",
                title: late
                    ? `${plural(late)} projected to finish after 6 PM`
                    : `${plural(atRisk.length)} projected to finish close to 6 PM`,
                message: `Remaining stops at the usual ${pace.mean.toFixed(0)} min per stop, slowed by current traffic (${congestion.toFixed(1)}x free-flow), put the latest finish at ${formatClock(worst.finish)}.`,
                suggestions: [
                    {
                        label: "Defer lower-priority stops to the next working day",
                    },
                    {
                        label: "Move stops to a route with spare time",
                        target: "assignment",
                    },
                    {
                        label: "Check in with the drivers on these routes",
                        target: "drivers",
                    },
                ],
                basis: `${basisText(trips)}; live traffic now`,
                metric: Math.round(worst.overMinutes),
                metricStep: 15,
            }),
        ],
    };
}
