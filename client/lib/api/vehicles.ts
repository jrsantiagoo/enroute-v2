import { apiCall } from "./apiCall";
import type { Vehicle } from "@/lib/types/vehicle";

type BackendVehicle = {
    id_: string;
    plate_number: string;
    year: number;
    vehicle_type?: string | null;
    weight_capacity?: number | null;
    initial_odometer: number;
    last_odometer?: number | null;
    expected_kml: number;
    target_efficiency?: number | null;
    is_active: boolean;
    archived_at?: string | null;
    updated_at?: string | null;
    driver_id_?: string | null;
    agent_profile?: {
        driver_id?: string | null;
    } | null;
    vehicle_make?: {
        name?: string | null;
    } | null;
    vehicle_model?: {
        name?: string | null;
    } | null;
    make_id_?: string | null;
    model_id_?: string | null;
};

const mapVehicle = (vehicle: BackendVehicle): Vehicle => {
    const isArchived = Boolean(vehicle.archived_at);
    const driverId =
        vehicle.agent_profile?.driver_id ?? vehicle.driver_id_ ?? "";

    return {
        id_: vehicle.id_,
        vehicleId_: vehicle.id_,
        plateNumber: vehicle.plate_number,
        vehicleType: vehicle.vehicle_type ?? "",
        lastDriver: driverId,
        driverId,
        weightCapacity: vehicle.weight_capacity ?? 0,
        target: vehicle.expected_kml,
        avg_performance: undefined,
        status: isArchived
            ? "ARCHIVED"
            : vehicle.is_active
              ? "ACTIVE"
              : "INACTIVE",
        vehicleMaker: vehicle.vehicle_make?.name ?? "",
        vehicleModel: vehicle.vehicle_model?.name ?? "",
        initOdometer: vehicle.initial_odometer,
        year: vehicle.year,
        archived: isArchived,
        archivedAt: vehicle.archived_at ?? undefined,
        lastModified: vehicle.updated_at ?? undefined,
    };
};

const mapVehicles = (vehicles: BackendVehicle[]) => vehicles.map(mapVehicle);

export async function getVehicles(includeArchived = false) {
    const endpoint = includeArchived
        ? "/api/vehicles?archived=true"
        : "/api/vehicles";
    const response = await apiCall(endpoint);
    const result = await response.json();
    return {
        ...result,
        data: Array.isArray(result.data) ? mapVehicles(result.data) : [],
    };
}

export async function getVehicleById(vehicleId: string) {
    const response = await apiCall(`/api/vehicles/${vehicleId}`);
    const result = await response.json();
    return {
        ...result,
        data: result.data ? mapVehicle(result.data) : null,
    };
}

export async function createVehicle(vehicle: Record<string, unknown>) {
    const response = await apiCall("/api/vehicles", {
        method: "POST",
        body: JSON.stringify(vehicle),
    });
    return response.json();
}

export async function updateVehicle(
    vehicleId: string,
    updatedVehicle: Record<string, unknown>,
) {
    const response = await apiCall(`/api/vehicles/${vehicleId}`, {
        method: "PUT",
        body: JSON.stringify(updatedVehicle),
    });
    return response.json();
}

export async function deleteVehicle(vehicleId: string) {
    const response = await apiCall(`/api/vehicles/${vehicleId}`, {
        method: "DELETE",
    });
    return response.json();
}

export async function archiveVehicle(vehicleId: string) {
    const response = await apiCall(`/api/vehicles/${vehicleId}/archive`, {
        method: "PATCH",
    });
    return response.json();
}

export async function getVehicleMakes() {
    const response = await apiCall("/api/vehicles/makes");
    return response.json();
}

export async function getVehicleModels() {
    const response = await apiCall("/api/vehicles/models");
    return response.json();
}

export async function unarchiveVehicle(vehicleId: string) {
    const response = await apiCall(`/api/vehicles/${vehicleId}/unarchive`, {
        method: "PATCH",
    });
    return response.json();
}
