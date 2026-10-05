export type VehicleType = "car" | "motorcycle";

export type OrderPriority = "urgent" | "normal";

export interface Stop {
    id_: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    // Orders delivered at this address. Set when the stop comes from an order
    // location; left undefined for map/geocoded stops.
    orderIds?: number[];
    priority?: OrderPriority;
    area?: string;
}

export interface Driver {
    id_: string;
    driver_id: string;
    name?: string;
    contact_number?: string;
    license_number?: string;
}

export interface RouteSegment {
    fromId: string;
    toId: string;
    distanceKm: number;
    durationMinutes: number;
}

export interface RoutePlan {
    id_: string;
    name: string;
    stops: Stop[];
    segments?: RouteSegment[];
    totalDistanceKm: number;
    totalDurationMinutes: number;
    vehicleType: VehicleType;
    // assignedWeek: string; // ISO Monday date string – set by the Assignment page
    createdAt: string; // ISO datetime string
    archived?: boolean;
    // ISO datetime the route was moved Active → Archived. Stamped by
    // setRouteArchived(); undefined on routes archived before this field
    // existed, which the Archived tab renders as "N/A".
    archivedAt?: string;
}

export interface Trip {
    id_: string;
    status: string;
    tag_type: string;
    scheduled_date: string;
    created_at: string;
    updated_at: string;
    destination: string;
    driver_id_?: string;
    route_id_?: string;
    route?: RoutePlan;
    notes?: string;
    agent_profile?: Driver;
    vehicle_id_?: string;
    vehicle?: BackendVehicle;
    deleted_at?: string;
}

export type BackendVehicle = {
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
    agent_profile?: {
        driver_id?: string | null;
    } | null;
    vehicle_make?: {
        name?: string | null;
    } | null;
    vehicle_model?: {
        name?: string | null;
    } | null;
};

export interface Order {
    id_: string;
    order_id: string;
    client: string;
    destination?: string;
    ordered_on: string;
    delivered_by?: string;
    package_content?: string;
    package_size?: string;
    package_weight?: string;
    status: string;
}

export interface DriverCapacity {
    id_: string;
    driverId: string;
    date: string;
    activeHours: number;
    fuelConsumed: number;
    distanceTraveled: number;
    status: string;
}

export interface SuggestedRoute {
    id: string;
    name: string;
    stops: Stop[];
    totalDistanceKm: number;
    totalDurationMinutes: number;
    vehicleType: VehicleType;
    optimizationType: "fastest" | "shortest";
    trafficAware: boolean;
    description?: string;

    // Optional historical performance context (mocked – see lib/routing/mockData.ts).
    // These are supporting hints only; the displayed distance/duration above still
    // come from the live OSRM calculation.
    historicalInsight?: string;
    previousAverageDuration?: number; // minutes
    previousAverageDistance?: number; // km
    successfulTripCount?: number;
    historicalPeriod?: string; // e.g. "last week", "two weeks ago", "last month"
}

/**
 * A mocked record of how a route (or a kind of route) has performed in the past.
 * Used to enrich route suggestions with historical insight while there is no
 * backend. Matched either by an exact set of stop ids, or — when `stopIds` is
 * omitted — by the vehicle + optimization "kind" of the suggestion.
 */
export interface HistoricalRoutePerformance {
    id: string;
    label: string;
    /** Sorted stop ids this record describes. Omit for a generic kind-level record. */
    stopIds?: string[];
    vehicleType: VehicleType;
    optimizationType: "fastest" | "shortest";
    averageDistanceKm: number;
    averageDurationMinutes: number;
    successfulTripCount: number;
    lastUsed: string; // ISO date string
    historicalPeriod: string; // e.g. "last week", "two weeks ago", "last month"
}

export interface WeeklyVehicleAvailability {
    week: string; // ISO Monday date string
    motorcycles: number;
    cars: number;
}
