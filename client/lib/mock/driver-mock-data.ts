export interface MockDriver {
    id_: string;
    driverId: string;
    driverName: string;

    activeHours: number;
    fuelConsumed: number;
    distanceTraveled: number;
    status: string;
    mostDrivenVehicleType: string;
    topThreeVehicles: string;

    date?: string;
    archived?: boolean;
    archivedAt?: string;
    lastModified?: string;
}

function getToday(): string {
    return new Date().toISOString().split("T")[0];
}

export const mockDriverData: MockDriver[] = [
    {
        id_: "MD-0001",
        driverId: "MDRV-0001",
        driverName: "False Driver",

        activeHours: 7,
        fuelConsumed: 32.5,
        distanceTraveled: 21,
        status: "Active",
        mostDrivenVehicleType: "Van",
        topThreeVehicles: "ABC, CDE, FGH",

        date: getToday(),
        lastModified: "Today",
    },
    {
        id_: "MD-0002",
        driverId: "MDRV-0002",
        driverName: "Mock Driver",

        activeHours: 12,
        fuelConsumed: 37.12,
        distanceTraveled: 20,
        status: "Active",
        mostDrivenVehicleType: "Car",
        topThreeVehicles: "DAC, BAC, HAC",

        date: getToday(),
        lastModified: "Yesterday",
    },
];
