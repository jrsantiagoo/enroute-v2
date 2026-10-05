import { apiCall } from "./apiCall";

export async function getProfile(accessToken: string) {
    const response = await apiCall("/api/managers/me");
    return response.json();
}
