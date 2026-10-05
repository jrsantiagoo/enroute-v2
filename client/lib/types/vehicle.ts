export interface Vehicle {
    id_: string;
    vehicleId_: string;
    plateNumber: string;
    vehicleType: string;
    lastDriver: string;
    driverId: string;
    weightCapacity: number;
    target: number;
    avg_performance?: number;
    status: string;
    vehicleMaker: string;
    vehicleModel: string;
    vehicleMakeId?: string;
    vehicleModelId?: string;
    initOdometer: number;
    year: number;
    archived?: boolean;
    archivedAt?: string;
    lastModified?: string;
}
