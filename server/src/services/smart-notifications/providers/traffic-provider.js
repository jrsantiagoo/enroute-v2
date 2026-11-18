import { ProviderError } from "./provider-error.js";

const REQUEST_TIMEOUT_MS = 8000;

// TomTom Traffic Flow Segment Data, which needs TOMTOM_API_KEY.
// Congestion is current travel time divided by free-flow travel time, so 1.0 is free-flowing and 2.0 means trips take twice as long.
// If every point fails the whole call fails, which the hub treats as live conditions being unavailable.
export async function fetchTraffic(points, apiKey, fetchImpl = fetch) {
    if (!apiKey) throw new ProviderError("traffic: TOMTOM_API_KEY is not set");

    const results = await Promise.allSettled(
        points.map(async ({ lat, lng }) => {
            const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lng}&key=${apiKey}`;
            const response = await fetchImpl(url, {
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            });
            if (!response.ok)
                throw new ProviderError(`traffic HTTP ${response.status}`);

            const flow = (await response.json()).flowSegmentData;
            if (!flow?.freeFlowTravelTime)
                throw new ProviderError("traffic: malformed response");

            return flow.currentTravelTime / flow.freeFlowTravelTime;
        }),
    );

    const ratios = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);
    if (!ratios.length)
        throw new ProviderError("traffic: no points returned data");

    return {
        fetchedAt: new Date(),
        samples: ratios.length,
        worstRatio: Math.max(...ratios),
        avgRatio: ratios.reduce((a, b) => a + b, 0) / ratios.length,
    };
}
