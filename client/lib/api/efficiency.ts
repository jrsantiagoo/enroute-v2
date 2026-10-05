import { apiCall } from "./apiCall";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getEfficiency(startDate?: string, endDate?: string) {
    const response = await apiCall("/api/efficiency", {
        method: "POST",
        body: JSON.stringify({ startDate, endDate }),
    });
    return await response.json();
}
