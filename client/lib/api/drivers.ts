import { apiCall } from "./apiCall";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getDrivers() {
    const response = await apiCall("/api/drivers");
    return response.json();
}

export async function getDriverCapacity() {
    const response = await apiCall("/api/drivers/capacity");
    return response.json();
}

export type DriverStatus = "INACTIVE" | "ACTIVE" | "FULLY UTILIZED";

// Shape the driver management UI works with after joining profile and capacity data.
export interface Driver {
    id_: string;
    driverId: string;
    contactNumber: string;
    licenseNumber: string;
    activeHours: number;
    fuelConsumed: number;
    distanceTraveled: number;
    status: DriverStatus;
    createdAt: string;
    archived: boolean;
    archivedAt?: string;
}

// Fields the backend accepts when creating or updating a driver.
export interface DriverPayload {
    driver_id: string;
    contact_number: string | null;
    license_number: string | null;
}

type BackendDriver = {
    id_: string;
    driver_id: string;
    contact_number?: string | null;
    license_number?: string | null;
    created_at: string;
    archived_at?: string | null;
};

type BackendDriverCapacity = {
    id_: string;
    activeHours: number;
    fuelConsumed: number;
    distanceTraveled: number;
    status: DriverStatus;
};

// Backend errors arrive as either { message } or { error } depending on the controller.
function getResponseError(result: any, fallback: string) {
    return new Error(result?.message ?? result?.error ?? fallback);
}

// Throws on a failed response so callers can rely on try/catch instead of checking success.
function unwrapResult(result: any, fallback: string) {
    if (!result?.success) throw getResponseError(result, fallback);
    return result.data;
}

// Drivers with no recorded trips or fuel logs are missing from the metrics, so default them to zero.
function mapDriver(
    driver: BackendDriver,
    capacity?: BackendDriverCapacity,
): Driver {
    return {
        id_: driver.id_,
        driverId: driver.driver_id,
        contactNumber: driver.contact_number ?? "",
        licenseNumber: driver.license_number ?? "",
        activeHours: capacity?.activeHours ?? 0,
        fuelConsumed: capacity?.fuelConsumed ?? 0,
        distanceTraveled: capacity?.distanceTraveled ?? 0,
        status: capacity?.status ?? "INACTIVE",
        createdAt: driver.created_at,
        archived: Boolean(driver.archived_at),
        archivedAt: driver.archived_at ?? undefined,
    };
}

// The list and the metrics come from separate endpoints, so they are joined on the driver's internal id.
export async function getDriversWithMetrics(): Promise<Driver[]> {
    const [driversResult, capacityResult] = await Promise.all([
        getDrivers(),
        getDriverCapacity(),
    ]);
    const drivers: BackendDriver[] = unwrapResult(
        driversResult,
        "Failed to load drivers.",
    );
    const capacities: BackendDriverCapacity[] = unwrapResult(
        capacityResult,
        "Failed to load driver metrics.",
    );

    const capacityById = new Map(capacities.map((c) => [c.id_, c]));
    return drivers.map((driver) =>
        mapDriver(driver, capacityById.get(driver.id_)),
    );
}

export async function createDriver(payload: DriverPayload) {
    const response = await apiCall("/api/drivers", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return unwrapResult(await response.json(), "Failed to add driver.");
}

export async function updateDriver(id: string, payload: DriverPayload) {
    const response = await apiCall(`/api/drivers/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
    return unwrapResult(await response.json(), "Failed to update driver.");
}

// The backend treats DELETE as a soft delete, so the driver can be restored later.
export async function archiveDriver(id: string) {
    const response = await apiCall(`/api/drivers/${id}`, {
        method: "DELETE",
    });
    return unwrapResult(await response.json(), "Failed to archive driver.");
}

export async function unarchiveDriver(id: string) {
    const response = await apiCall(`/api/drivers/${id}/unarchive`, {
        method: "PATCH",
    });
    return unwrapResult(await response.json(), "Failed to unarchive driver.");
}
