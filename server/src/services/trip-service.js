import prisma from "../lib/prisma.js";

const VALID_STATUSES = [
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "CANCELLED",
];

export async function createTrip(
    routeId,
    driverId,
    scheduledDate,
    notes,
    vehicleId,
) {
    const route = await prisma.route.findUnique({ where: { id_: routeId } });
    if (!route) {
        throw new Error("Route not found");
    }

    const driver = await prisma.agent_profile.findUnique({
        where: { id_: driverId },
    });
    if (!driver) {
        throw new Error("Driver not found");
    }

    return prisma.trip.create({
        data: {
            route_id_: routeId || null,
            driver_id_: driverId,
            status: "PENDING",
            tag_type: "ASSIGNED",
            scheduled_date: scheduledDate ? new Date(scheduledDate) : undefined,
            notes: notes || null,
            vehicle_id_: vehicleId || null,
        },
        include: {
            agent_profile: true,
            route: true,
            vehicle: true,
        },
    });
}

export async function getAllTrips() {
    return prisma.trip.findMany({
        include: {
            agent_profile: true,
            route: true,
            vehicle: true,
        },
        orderBy: {
            scheduled_date: "asc",
        },
    });
}

export async function getTripsRange(startDate, endDate) {
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
        // Set to the end of the day instead of the start of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
    }
    return prisma.trip.findMany({
        where: {
            ...(Object.keys(dateFilter).length > 0 && {
                scheduled_date: dateFilter,
            }),
        },
        orderBy: { scheduled_date: "asc" },
    });
}

export async function getTripById(tripId) {
    return prisma.trip.findUnique({
        where: { id_: tripId },
        include: {
            agent_profile: true,
            route: true,
        },
    });
}

export async function getTripsByDriver(driverId) {
    return prisma.trip.findMany({
        where: { driver_id_: driverId },
        include: {
            agent_profile: true,
            route: true,
        },
        orderBy: {
            scheduled_date: "asc",
        },
    });
}

export async function deleteTrip(tripId) {
    const trip = await prisma.trip.findUnique({ where: { id_: tripId } });
    if (!trip) {
        throw new Error("Trip not found");
    }

    return prisma.trip.delete({ where: { id_: tripId } });
}

export async function archiveTrip(id_) {
    return prisma.trip.update({
        where: { id_: id_ },
        data: {
            deleted_at: new Date(),
        },
    });
}

export async function unarchiveTrip(id_) {
    return prisma.trip.update({
        where: { id_: id_ },
        data: {
            deleted_at: null,
        },
    });
}

export async function assignDriverToTrip(tripId, driverId) {
    const trip = await prisma.trip.findUnique({ where: { id_: tripId } });
    if (!trip) {
        throw new Error("Trip not found");
    }

    const driver = await prisma.agent_profile.findUnique({
        where: { id_: driverId },
    });
    if (!driver) {
        throw new Error("Driver not found");
    }

    if (trip.driver_id_) {
        throw new Error("Trip is already assigned");
    }

    return prisma.trip.update({
        where: { id_: tripId },
        data: {
            driver_id_: driverId,
            tag_type: "ASSIGNED",
        },
        include: {
            agent_profile: true,
            route: true,
        },
    });
}

export async function updateTripStatus(tripId, status) {
    if (!VALID_STATUSES.includes(status)) {
        throw new Error(
            `Invalid status. Valid values are: ${VALID_STATUSES.join(", ")}`,
        );
    }

    const trip = await prisma.trip.findUnique({ where: { id_: tripId } });
    if (!trip) {
        throw new Error("Trip not found");
    }

    return prisma.trip.update({
        where: { id_: tripId },
        data: {
            status,
        },
        include: {
            agent_profile: true,
            route: true,
        },
    });
}

export async function updateTrip(tripId, updatedFields) {
    const trip = await prisma.trip.findUnique({
        where: { id_: tripId },
    });

    if (!trip) throw new Error("Trip record not found");

    const data = { ...updatedFields };
    if (updatedFields.scheduled_date) {
        data.scheduled_date = new Date(updatedFields.scheduled_date);
    }

    return prisma.trip.update({
        where: { id_: tripId },
        data,
        include: {
            agent_profile: true,
            route: true,
            vehicle: true,
        },
    });
}

export async function getTripsByDriverAndDay() {
    const trips = await prisma.trip.findMany({
        where: {
            driver_id_: { not: null },
            scheduled_date: { not: null },
            deleted_at: null,
        },
        include: {
            route: true,
            agent_profile: true,
        },
    });

    // Group into { "driverId-Mon": ["routeName", ...], ... }
    const grouped = {};
    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (const trip of trips) {
        const day = DAYS[new Date(trip.scheduled_date).getDay()];
        const cellId = `${trip.agent_profile.driver_id}-${day}`;
        if (!grouped[cellId]) grouped[cellId] = [];
        grouped[cellId].push({
            tripId: trip.id_,
            routeName: trip.route.name,
        });
    }

    return grouped;
}
