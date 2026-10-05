import {
    Stop,
    WeeklyVehicleAvailability,
    HistoricalRoutePerformance,
} from "../types/schema";

export const MANILA_LOCATIONS: Stop[] = [
    {
        id_: "loc-000",
        name: "De La Salle University",
        address: "2401 Taft Ave, Malate, Manila 1004",
        lat: 14.5643,
        lng: 120.9938,
    },
    {
        id_: "loc-001",
        name: "Rizal Park",
        address: "Roxas Blvd, Ermita, Manila 1000",
        lat: 14.5832,
        lng: 120.9794,
    },
    {
        id_: "loc-002",
        name: "SM Mall of Asia",
        address: "J.W. Diokno Blvd, Pasay City 1300",
        lat: 14.5352,
        lng: 120.9831,
    },
    {
        id_: "loc-003",
        name: "Bonifacio Global City",
        address: "High Street, BGC, Taguig City 1634",
        lat: 14.5492,
        lng: 121.0523,
    },
    {
        id_: "loc-004",
        name: "Makati CBD",
        address: "Ayala Avenue, Makati City 1226",
        lat: 14.5547,
        lng: 121.0244,
    },
    {
        id_: "loc-005",
        name: "Quiapo Church",
        address: "Plaza Miranda, Quiapo, Manila 1001",
        lat: 14.5995,
        lng: 120.9842,
    },
    {
        id_: "loc-006",
        name: "Divisoria Market",
        address: "C.M. Recto Ave, Divisoria, Manila",
        lat: 14.6021,
        lng: 120.9726,
    },
    {
        id_: "loc-007",
        name: "SM City North EDSA",
        address: "North Avenue, Quezon City 1106",
        lat: 14.6566,
        lng: 121.0333,
    },
    {
        id_: "loc-008",
        name: "Eastwood City",
        address: "Bagumbayan, Quezon City 1110",
        lat: 14.607,
        lng: 121.0779,
    },
];

export const DEFAULT_STOPS: Stop[] = [MANILA_LOCATIONS[0], MANILA_LOCATIONS[1]];

export const MOCK_WEEKLY_AVAILABILITY: WeeklyVehicleAvailability[] = [
    { week: "2026-06-09", motorcycles: 2, cars: 3 },
    { week: "2026-06-16", motorcycles: 1, cars: 4 },
    { week: "2026-06-23", motorcycles: 3, cars: 2 },
    { week: "2026-06-30", motorcycles: 2, cars: 3 },
];

/**
 * Mocked historical route-performance data. There is no backend yet, so these
 * records stand in for "how this kind of route has done before". Route
 * suggestions are matched against these to show supporting historical insight.
 *
 * Two flavours of record:
 *  - With `stopIds`: describes a specific, previously-run stop combination
 *    (matched regardless of order). These take priority.
 *  - Without `stopIds`: a generic record for a vehicle + optimization "kind",
 *    so any new suggestion still gets relevant context.
 *
 * Dates/periods are anchored around late June 2026 (the app's mock "today").
 */
export const MOCK_HISTORICAL_ROUTES: HistoricalRoutePerformance[] = [
    // Specific: the default DLSU → Rizal Park run that the tool opens with.
    {
        id: "hist-000",
        label: "DLSU → Rizal Park",
        stopIds: ["loc-000", "loc-001"],
        vehicleType: "motorcycle",
        optimizationType: "fastest",
        averageDistanceKm: 3.1,
        averageDurationMinutes: 11,
        successfulTripCount: 9,
        lastUsed: "2026-05-30",
        historicalPeriod: "last month",
    },
    // Generic kind-level records (matched by vehicleType + optimizationType).
    {
        id: "hist-car-fastest",
        label: "Car · fastest",
        vehicleType: "car",
        optimizationType: "fastest",
        averageDistanceKm: 24.5,
        averageDurationMinutes: 52,
        successfulTripCount: 18,
        lastUsed: "2026-06-10",
        historicalPeriod: "two weeks ago",
    },
    {
        id: "hist-car-shortest",
        label: "Car · shortest distance",
        vehicleType: "car",
        optimizationType: "shortest",
        averageDistanceKm: 21.2,
        averageDurationMinutes: 61,
        successfulTripCount: 12,
        lastUsed: "2026-05-26",
        historicalPeriod: "last month",
    },
    {
        id: "hist-moto-fastest",
        label: "Motorcycle · express",
        vehicleType: "motorcycle",
        optimizationType: "fastest",
        averageDistanceKm: 12.8,
        averageDurationMinutes: 33,
        successfulTripCount: 25,
        lastUsed: "2026-06-17",
        historicalPeriod: "last week",
    },
];
