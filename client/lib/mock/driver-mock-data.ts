export interface mockDriver {
    id_: string;
    driverId_: string;
    driverId: string;
    driverName: string;

    activeHours: number;
    fuelConsumed: number;
    distanceTraveled: number;
    status: string;
    mostDrivenVehicleType: string;
    topThreeVehicles: string;

    archived?: boolean;
    archivedAt?: string;
    lastModified?: string;
}
