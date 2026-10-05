import { dailyDistanceData, dailyFuelData } from "./mockData";

// Helper Function: Computes Trend Line (avg per 3 days)
export function computeTrend<T extends Record<string, unknown>>(
    data: T[],
    key: keyof T,
    window: number = 3,
): (T & { trend: number })[] {
    const half = Math.floor(window / 2);
    return data.map((_d, i, arr) => {
        const start = Math.max(0, i - half);
        const end = Math.min(arr.length, i + half + 1);
        const slice = arr.slice(start, end);
        const avg =
            slice.reduce((s, v) => s + Number(v[key]), 0) / slice.length;
        return { ...arr[i], trend: +avg.toFixed(1) };
    });
}

// Mock Data
export const dailyDistanceWithTrend = computeTrend( dailyDistanceData, "distance");
export const dailyFuelWithTrend = computeTrend(dailyFuelData, "fuel");
