import { RoutePlan, Stop } from "../types/schema";
import { apiCall } from "./apiCall";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getRoutes() {
    const response = await apiCall("/api/routes");
    return await response.json();
}

export async function createRoute(route: RoutePlan) {
    const response = await apiCall("/api/routes", {
        method: "POST",
        body: JSON.stringify(route),
    });
    return response.json();
}

export async function updateRoute(route: RoutePlan) {
    const response = await apiCall(`/api/routes/update/${route.id_}`, {
        method: "PATCH",
        body: JSON.stringify(route),
    });
    return response.json();
}

export async function archiveRoute(route: RoutePlan) {
    const response = await apiCall(`/api/routes/archive/${route.id_}`, {
        method: "PATCH",
    });
    return response.json();
}

export async function unarchiveRoute(route: RoutePlan) {
    const response = await apiCall(`/api/routes/unarchive/${route.id_}`, {
        method: "PATCH",
    });
    return response.json();
}

export async function deleteRoute(route: RoutePlan) {
    const response = await apiCall(`/api/routes/delete/${route.id_}`, {
        method: "DELETE",
    });
    return response.json();
}
