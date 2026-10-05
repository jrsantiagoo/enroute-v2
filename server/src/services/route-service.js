import prisma from "../lib/prisma.js";

export async function getAllRoutes() {
    return prisma.route.findMany({
        include: {
            stops: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function createRoute(route) {
    return prisma.route.create({
        data: {
            name: route.name,
            totalDistanceKm: route.totalDistanceKm,
            totalDurationMinutes: route.totalDurationMinutes,
            vehicleType: route.vehicleType,
            stops: {
                create: route.stops.map((stop, i) => ({
                    name: stop.name,
                    address: stop.address,
                    lat: stop.lat,
                    lng: stop.lng,
                    order: i,
                })),
            },
        },
        include: {
            stops: true,
        },
    });
}

export async function updateStops(id_, stops) {
    return prisma.$transaction(async (tx) => {
        await tx.stop.deleteMany({
            where: { route_id_: id_ },
        });

        return tx.route.update({
            where: { id_: id_ },
            data: {
                stops: {
                    createMany: {
                        data: stops.map((stop, i) => ({
                            name: stop.name,
                            address: stop.address,
                            order: i,
                            lat: stop.lat,
                            lng: stop.lng,
                        })),
                    },
                },
            },
            include: {
                stops: true,
            },
        });
    });
}

export async function updateRouteDetails(route) {
    return prisma.route.update({
        where: { id_: route.id_ },
        data: {
            name: route.name,
            totalDistanceKm: route.totalDistanceKm,
            totalDurationMinutes: route.totalDurationMinutes,
            vehicleType: route.vehicleType,
        },
    });
}

export async function archiveRoute(id_) {
    return prisma.route.update({
        where: { id_: id_ },
        data: {
            archivedAt: new Date(),
        },
    });
}

export async function unarchiveRoute(id_) {
    return prisma.route.update({
        where: { id_: id_ },
        data: {
            archivedAt: null,
        },
    });
}

export async function deleteRoute(id_) {
    const tripCount = await prisma.trip.count({ where: { route_id_: id_ } });
    if (tripCount > 0) {
        throw new Error(
            `Cannot delete route: ${tripCount} trip(s) are still linked to it.`,
        );
    }

    return prisma.route.delete({
        where: { id_: id_ },
    });
}
