import { apiCall } from "./apiCall";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getFuelPerOrder(startDate?: string, endDate?: string) {
    const response = await apiCall("/api/fuel_logs/daily_fuel_per_order", {
        method: "POST",
        body: JSON.stringify({ startDate, endDate }),
    });
    return await response.json();
}

export async function getDistancePerOrder(
    startDate?: string,
    endDate?: string,
) {
    const response = await apiCall("/api/fuel_logs/daily_distance_per_order", {
        method: "POST",
        body: JSON.stringify({ startDate, endDate }),
    });

    return await response.json();
}
