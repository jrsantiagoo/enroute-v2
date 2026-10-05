import { apiCall } from "./apiCall";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function createTrip(
    routeId: string,
    driverId: string,
    scheduledDate?: string,
    notes?: string,
    vehicleId?: string,
) {
    const response = await apiCall("/api/trips", {
        method: "POST",
        body: JSON.stringify({
            routeId,
            driverId,
            scheduledDate,
            notes,
            vehicleId,
        }),
    });
    return response.json();
}

export async function updateTrip(
    id_: string,
    updatedTrip: Record<string, unknown>,
) {
    const response = await apiCall(`/api/trips/update/${id_}`, {
        method: "PATCH",
        body: JSON.stringify(updatedTrip),
    });
    return response.json();
}

export async function deleteTrip(tripId: string) {
    const response = await apiCall(`/api/trips/${tripId}`, {
        method: "DELETE",
    });
    return response.json();
}

export async function archiveTrip(id_: string) {
    const response = await apiCall(`/api/trips/archive/${id_}`, {
        method: "PATCH",
    });
    return response.json();
}

export async function unarchiveTrip(id_: string) {
    const response = await apiCall(`/api/trips/unarchive/${id_}`, {
        method: "PATCH",
    });
    return response.json();
}

export async function getAllTrips() {
    const response = await apiCall("/api/trips");
    return response.json();
}

export async function getTripsRange(startDate?: string, endDate?: string) {
    const response = await apiCall("/api/trips/trips_date_range", {
        method: "POST",
        body: JSON.stringify({ startDate, endDate }),
    });
    return await response.json();
}

export async function getTripsByDriver(driverId: string) {
    const response = await apiCall(`/api/trips/driver/${driverId}`);
    return response.json();
}

export async function getAssignmentGrid() {
    const response = await apiCall("/api/trips/assignment-grid");
    return response.json();
}
