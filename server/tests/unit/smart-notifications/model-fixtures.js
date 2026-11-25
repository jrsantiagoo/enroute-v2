// A tiny hand-made model shared by the model tests.
export const FEATURES = [
    ...Array.from({ length: 7 }, (_, d) => `dow_${d}`),
    "precip_mm",
    "rainy",
    "event_day",
    "stops",
    "depart_hour",
];

// A tiny hand-made model: Thursdays (dow_4) push the late probability up, rain pushes pace up.
export function makeModel({ paceUsable = true, lateUsable = true } = {}) {
    const zeros = FEATURES.map(() => 0);
    const ones = FEATURES.map(() => 1);
    const coef = (name, w) => FEATURES.map((f) => (f === name ? w : 0));
    return {
        version: 1,
        trainedAt: "2026-11-09T01:00:00+00:00",
        trainedOn: { trips: 120, from: "2026-06-01", to: "2026-11-09" },
        features: FEATURES,
        defaults: { stops: 10, depart_hour: 8.25 },
        limits: { maxPrecipMm: 60, rainyDayMm: 10 },
        pace: {
            usable: paceUsable,
            intercept: 28,
            coef: coef("precip_mm", 4),
            mean: zeros.map((_, i) => (FEATURES[i] === "precip_mm" ? 5 : 0)),
            scale: ones.map((_, i) => (FEATURES[i] === "precip_mm" ? 10 : 1)),
            metrics: { error: 2.5, baselineError: 3.6 },
        },
        late: {
            usable: lateUsable,
            intercept: -2,
            coef: coef("dow_4", 3),
            mean: zeros,
            scale: ones,
            baseRate: 0.18,
            metrics: { error: 0.11, baselineError: 0.15 },
        },
    };
}
