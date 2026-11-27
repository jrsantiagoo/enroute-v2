export const mean = (values) =>
    values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : null;

export const toPercent = (ratio) => Math.round(ratio * 100);

export function paceStat(trips) {
    return { count: trips.length, mean: mean(trips.map((t) => t.minPerStop)) };
}

export function lateRate(trips) {
    return trips.length
        ? trips.filter((t) => t.late).length / trips.length
        : null;
}

export function fuelStat(trips) {
    const values = trips.map((t) => t.fuelPer100).filter((v) => v != null);
    return { count: values.length, mean: mean(values) };
}

// Produces text like "based on 40 trips across 6 drivers, 2026-08-12 to 2026-11-09" so the manager can judge how far to trust it.
export function basisText(trips, label = "trips") {
    if (!trips.length) return "no trip history";

    const dateKeys = trips.map((t) => t.dateKey).sort();
    const drivers = new Set(trips.map((t) => t.driverId).filter(Boolean)).size;
    const driverText = drivers
        ? ` across ${drivers} driver${drivers === 1 ? "" : "s"}`
        : "";

    return `based on ${trips.length} ${label}${driverText}, ${dateKeys[0]} to ${dateKeys.at(-1)}`;
}
