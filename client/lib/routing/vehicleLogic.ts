import {
    VehicleType,
    SuggestedRoute,
    WeeklyVehicleAvailability,
    HistoricalRoutePerformance,
    Stop,
} from "../types/schema";
import { MOCK_WEEKLY_AVAILABILITY, MOCK_HISTORICAL_ROUTES } from "./mockData";
import { fetchRoute } from "./routingService";

export function recommendVehicle(totalStopCount: number): VehicleType {
    return totalStopCount <= 3 ? "motorcycle" : "car";
}

export function getAvailabilityForWeek(
    week: string,
): WeeklyVehicleAvailability {
    return (
        MOCK_WEEKLY_AVAILABILITY.find((w) => w.week === week) ?? {
            week,
            motorcycles: 1,
            cars: 2,
        }
    );
}

// Reorders middle stops using nearest-neighbor heuristic; start and end stay fixed.
function nearestNeighborOrder(stops: Stop[]): Stop[] {
    if (stops.length <= 3) return stops;
    const start = stops[0];
    const end = stops[stops.length - 1];
    const remaining = stops.slice(1, -1);
    const ordered: Stop[] = [];
    let current = start;
    while (remaining.length > 0) {
        let nearestIdx = 0;
        let minDist = Infinity;
        for (let i = 0; i < remaining.length; i++) {
            const dx = remaining[i].lng - current.lng;
            const dy = remaining[i].lat - current.lat;
            const d = dx * dx + dy * dy;
            if (d < minDist) {
                minDist = d;
                nearestIdx = i;
            }
        }
        current = remaining[nearestIdx];
        ordered.push(remaining.splice(nearestIdx, 1)[0]);
    }
    return [start, ...ordered, end];
}

// Order-independent signature of a stop set, used to match historical records.
function stopSetKey(stops: Stop[]): string {
    return stops
        .map((s) => s.id_)
        .sort()
        .join("|");
}

/**
 * Finds the most relevant historical record for a generated suggestion.
 * Prefers an exact stop-set match; otherwise falls back to a generic record for
 * the same vehicle + optimization kind. Returns undefined when nothing matches.
 */
function findHistoricalRecord(
    stops: Stop[],
    vehicleType: VehicleType,
    optimizationType: "fastest" | "shortest",
): HistoricalRoutePerformance | undefined {
    const key = stopSetKey(stops);
    const specific = MOCK_HISTORICAL_ROUTES.find(
        (r) => r.stopIds && [...r.stopIds].sort().join("|") === key,
    );
    if (specific) return specific;
    return MOCK_HISTORICAL_ROUTES.find(
        (r) =>
            !r.stopIds &&
            r.vehicleType === vehicleType &&
            r.optimizationType === optimizationType,
    );
}

/**
 * Turns a historical record into a short, human-readable insight. Uses the live
 * OSRM duration to tailor the phrasing (e.g. when the current plan beats the
 * historical average), but the insight is supporting context only.
 */
function buildHistoricalInsight(
    record: HistoricalRoutePerformance,
    optimizationType: "fastest" | "shortest",
    currentDurationMinutes: number,
): string {
    const { historicalPeriod: period, successfulTripCount: trips } = record;

    // Specific previously-run combinations lean on the trip track record.
    if (record.stopIds) {
        return `Recommended based on ${trips} previous successful trip${trips === 1 ? "" : "s"}.`;
    }

    if (optimizationType === "shortest") {
        return `This route had the shortest total distance ${period}.`;
    }

    // Fastest: highlight travel-time performance, more strongly if we beat it.
    if (currentDurationMinutes <= record.averageDurationMinutes) {
        return `This route had the best average travel time for similar deliveries (${period}).`;
    }
    return `This was the fastest route ${period}.`;
}

export async function generateSuggestedRoutes(
    week: string,
    currentStops: Stop[],
): Promise<SuggestedRoute[]> {
    if (currentStops.length < 2) return [];

    const availability = getAvailabilityForWeek(week);

    type Variant = {
        stops: Stop[];
        vehicleType: VehicleType;
        optimizationType: "fastest" | "shortest";
        name: string;
        description: string;
    };

    const variants: Variant[] = [];

    if (availability.cars > 0) {
        variants.push({
            stops: currentStops,
            vehicleType: "car",
            optimizationType: "fastest",
            name: "Route A – Fastest",
            description: `Optimized for travel time. ${currentStops.length} stops.`,
        });

        const reordered = nearestNeighborOrder(currentStops);
        const isDifferentOrder = reordered.some(
            (s, i) => s.id_ !== currentStops[i].id_,
        );
        if (isDifferentOrder) {
            variants.push({
                stops: reordered,
                vehicleType: "car",
                optimizationType: "shortest",
                name: "Route B – Shortest Distance",
                description: `Minimizes total kilometers driven. ${reordered.length} stops.`,
            });
        }
    }

    if (availability.motorcycles > 0) {
        const start = currentStops[0];
        const end = currentStops[currentStops.length - 1];
        const middle = currentStops.slice(1, -1);
        // Motorcycle handles at most 1 middle stop (≤ 3 stops total)
        const motoStops =
            middle.length > 0 ? [start, middle[0], end] : [start, end];
        variants.push({
            stops: motoStops,
            vehicleType: "motorcycle",
            optimizationType: "fastest",
            name: "Route C – Motorcycle Express",
            description:
                middle.length > 0
                    ? `${motoStops.length}-stop express route for a motorcycle.`
                    : `Direct route for a motorcycle.`,
        });
    }

    const results = await Promise.allSettled(
        variants.map((v) => fetchRoute(v.stops)),
    );

    return results.flatMap((result, i) => {
        if (result.status !== "fulfilled") return [];
        const variant = variants[i];

        // Enrich with mocked historical context (supporting hint only — the
        // displayed distance/duration still come from the live OSRM result).
        const record = findHistoricalRecord(
            variant.stops,
            variant.vehicleType,
            variant.optimizationType,
        );
        const historical: Partial<SuggestedRoute> = record
            ? {
                  historicalInsight: buildHistoricalInsight(
                      record,
                      variant.optimizationType,
                      result.value.totalDurationMinutes,
                  ),
                  previousAverageDuration: record.averageDurationMinutes,
                  previousAverageDistance: record.averageDistanceKm,
                  successfulTripCount: record.successfulTripCount,
                  historicalPeriod: record.historicalPeriod,
              }
            : {};

        return [
            {
                id: `sr-dyn-${i}-${Date.now()}`,
                name: variant.name,
                stops: variant.stops,
                totalDistanceKm: result.value.totalDistanceKm,
                totalDurationMinutes: result.value.totalDurationMinutes,
                vehicleType: variant.vehicleType,
                optimizationType: variant.optimizationType,
                trafficAware: false,
                description: variant.description,
                ...historical,
            },
        ] satisfies SuggestedRoute[];
    });
}
