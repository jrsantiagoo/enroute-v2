import prisma from "../lib/prisma.js";

export async function getVehicles(includeArchived = false) {
    const where = { deleted_at: null };
    if (!includeArchived) {
        // default behavior: only non-archived vehicles
        where.archived_at = null;
    }

    return prisma.vehicle.findMany({
        where,
        include: { agent_profile: true, vehicle_make: true, vehicle_model: true },
        orderBy: { created_at: "desc" },
    });
}

export async function getVehicleMakes() {
    return prisma.vehicle_make.findMany({
        orderBy: { name: "asc" },
    });
}

export async function getVehicleModels() {
    return prisma.vehicle_model.findMany({
        orderBy: { name: "asc" },
    });
}

export async function getVehicleById(vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
        where: { id_: vehicleId },
        include: { agent_profile: true, fuel_log: true, trip: true, vehicle_make: true, vehicle_model: true },
    });
    if (!vehicle) throw new Error("Vehicle not found");
    return vehicle;
}

// --- CREATE VEHICLE ---
export async function createVehicle(vehicle) {
    return prisma.vehicle.create({
        data: {
            plate_number: vehicle.plate_number,
            year: Number(vehicle.year),
            vehicle_type: vehicle.vehicle_type ?? null,
            weight_capacity: vehicle.weight_capacity
                ? Number(vehicle.weight_capacity)
                : null,
            initial_odometer: Number(vehicle.initial_odometer),
            last_odometer: vehicle.last_odometer
                ? Number(vehicle.last_odometer)
                : null,
            expected_kml: Number(vehicle.expected_kml),
            conduction_sticker: vehicle.conduction_sticker ?? null,
            reg_certification: vehicle.reg_certification ?? null,
            or_number: vehicle.or_number ?? null,
            registration_expiry: vehicle.registration_expiry
                ? new Date(vehicle.registration_expiry)
                : null,
            insurance_expiry: vehicle.insurance_expiry
                ? new Date(vehicle.insurance_expiry)
                : null,
            is_active: vehicle.is_active ?? true,
            driver_id_: vehicle.driver_id_ ?? null,
            make_id_: vehicle.make_id_ ?? null,
            model_id_: vehicle.model_id_ ?? null,
        },
        include: {
            vehicle_make: true,
            vehicle_model: true,
        },
    });
}

// --- UPDATE VEHICLE ---
export async function updateVehicle(vehicleId, updatedVehicle) {
    const vehicle = await prisma.vehicle.findUnique({
        where: { id_: vehicleId },
    });

    if (!vehicle) throw new Error("Vehicle not found");

    return prisma.vehicle.update({
        where: { id_: vehicleId },
        data: updatedVehicle,
        include: {
            vehicle_make: true,
            vehicle_model: true,
        },
    });
}

// --- DELETE VEHICLE ---
export async function deleteVehicle(vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
        where: { id_: vehicleId },
        include: { vehicle_make: true, vehicle_model: true },
    });

    if (!vehicle) throw new Error("Vehicle not found");

    return prisma.vehicle.update({
        where: { id_: vehicleId },
        data: { deleted_at: new Date() },
        include: {
            vehicle_make: true,
            vehicle_model: true,
        },
    });
}

// --- ARCHIVE VEHICLE ---
export async function archiveVehicle(vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
        where: { id_: vehicleId },
        include: { vehicle_make: true, vehicle_model: true },
    });

    if (!vehicle) throw new Error("Vehicle not found");

    return prisma.vehicle.update({
        where: { id_: vehicleId },
        data: {
            archived_at: new Date(),
            is_active: false,
        },
        include: {
            vehicle_make: true,
            vehicle_model: true,
        },
    });
}

export async function unarchiveVehicle(vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
        where: { id_: vehicleId },
        include: { vehicle_make: true, vehicle_model: true },
    });

    if (!vehicle) throw new Error("Vehicle not found");

    return prisma.vehicle.update({
        where: { id_: vehicleId },
        data: {
            archived_at: null,
            is_active: true,
        },
        include: {
            vehicle_make: true,
            vehicle_model: true,
        },
    });
}
