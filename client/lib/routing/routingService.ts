import { Stop, RouteSegment } from "../types/schema";

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

export interface FetchRouteResult {
    segments: RouteSegment[];
    polyline: [number, number][];
    totalDistanceKm: number;
    totalDurationMinutes: number;
}

export async function fetchRoute(stops: Stop[]): Promise<FetchRouteResult> {
    if (stops.length < 2) {
        return {
            segments: [],
            polyline: [],
            totalDistanceKm: 0,
            totalDurationMinutes: 0,
        };
    }

    const coords = stops.map((s) => `${s.lng},${s.lat}`).join(";");
    const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson&steps=false`;

    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`OSRM responded with status ${res.status}`);

    const data = (await res.json()) as {
        code: string;
        routes?: {
            distance: number;
            duration: number;
            geometry: { coordinates: [number, number][] };
            legs: { distance: number; duration: number }[];
        }[];
    };

    if (data.code !== "Ok" || !data.routes?.[0]) {
        throw new Error("OSRM returned no routes");
    }

    const route = data.routes[0];

    const segments: RouteSegment[] = route.legs.map((leg, i) => ({
        fromId: stops[i].id_,
        toId: stops[i + 1].id_,
        distanceKm: leg.distance / 1000,
        durationMinutes: leg.duration / 60,
    }));

    const polyline: [number, number][] = route.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng],
    );

    return {
        segments,
        polyline,
        totalDistanceKm: route.distance / 1000,
        totalDurationMinutes: route.duration / 60,
    };
}
