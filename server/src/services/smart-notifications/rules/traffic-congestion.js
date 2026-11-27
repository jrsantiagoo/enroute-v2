import { paceStat, basisText } from "../stats-utils.js";
import { makeNotification } from "../notification-factory.js";

// Immediate: heavy congestion around the depot or active routes right now.
export function trafficCongestion({ trips, live, config }) {
    const traffic = live.traffic;
    if (!traffic || traffic.worstRatio < config.thresholds.congestionRatio)
        return {};

    const pace = paceStat(trips);
    const needed = config.minSamples.stopPace;
    if (pace.count < needed) {
        return {
            insufficient: [
                {
                    topic: "Traffic impact on delivery pace",
                    have: pace.count,
                    need: needed,
                    unit: "completed trips",
                },
            ],
        };
    }

    const extraForTenStops = Math.round(
        10 * pace.mean * Math.max(0, traffic.avgRatio - 1),
    );

    return {
        items: [
            makeNotification({
                key: "immediate:traffic",
                kind: "immediate",
                severity: traffic.worstRatio >= 2 ? "high" : "medium",
                title: "Heavy traffic is slowing routes right now",
                message: `Travel is up to ${traffic.worstRatio.toFixed(1)}x free-flow time (average ${traffic.avgRatio.toFixed(1)}x) at ${traffic.samples} monitored point${traffic.samples === 1 ? "" : "s"}. Trips normally average ${pace.mean.toFixed(0)} min per stop, so a 10-stop route could take roughly ${extraForTenStops} min longer.`,
                suggestions: [
                    {
                        label: "Stagger departures for trips about to start",
                        target: "routing",
                    },
                    { label: "Hold non-urgent dispatches until traffic eases" },
                ],
                basis: `${basisText(trips)}; live traffic now`,
                metric: Math.round(traffic.worstRatio * 10) / 10,
                metricStep: 0.3,
            }),
        ],
    };
}
