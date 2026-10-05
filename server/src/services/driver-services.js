import prisma from "../lib/prisma.js";

export async function getDrivers() {
    const drivers = await prisma.agent_profile.findMany({
        orderBy: {
            driver_id: "asc",
        },
    });
    return drivers;
}

export async function getDriverCapacity() {
    const drivers = await prisma.agent_profile.findMany({
        orderBy: {
            driver_id: "asc",
        },
    });

    // Aggregate fuel consumed + distance traveled per driver (all-time)
    const fuelLogs = await prisma.fuel_log.findMany({
        where: {
            deleted_at: null,
            driver_id_: { not: null },
        },
        select: {
            driver_id_: true,
            liters_added: true,
            distance_traveled: true,
        },
    });

    const fuelTotals = {};
    for (const log of fuelLogs) {
        if (!fuelTotals[log.driver_id_]) {
            fuelTotals[log.driver_id_] = {
                fuelConsumed: 0,
                distanceTraveled: 0,
            };
        }
        fuelTotals[log.driver_id_].fuelConsumed += Number(
            log.liters_added || 0,
        );
        fuelTotals[log.driver_id_].distanceTraveled += Number(
            log.distance_traveled || 0,
        );
    }

    // Aggregate active hours per driver from scheduled trip durations
    const trips = await prisma.trip.findMany({
        where: {
            driver_id_: { not: null },
            deleted_at: null,
        },
        select: {
            driver_id_: true,
            route: {
                select: {
                    totalDurationMinutes: true,
                },
            },
        },
    });

    const hoursTotals = {};
    for (const trip of trips) {
        const minutes = trip.route?.totalDurationMinutes || 0;
        hoursTotals[trip.driver_id_] =
            (hoursTotals[trip.driver_id_] || 0) + minutes;
    }

    const today = new Date().toISOString().split("T")[0];

    return drivers.map((driver) => {
        const fuel = fuelTotals[driver.id_] || {
            fuelConsumed: 0,
            distanceTraveled: 0,
        };
        const activeHours = (hoursTotals[driver.id_] || 0) / 60;

        let status = "INACTIVE";
        if (activeHours >= 8) {
            status = "FULLY UTILIZED";
        } else if (
            activeHours > 0 ||
            fuel.fuelConsumed > 0 ||
            fuel.distanceTraveled > 0
        ) {
            status = "ACTIVE";
        }

        return {
            id_: driver.id_,
            driverId: driver.driver_id,
            date: today,
            activeHours: Math.round(activeHours * 10) / 10,
            fuelConsumed: Math.round(fuel.fuelConsumed * 10) / 10,
            distanceTraveled: Math.round(fuel.distanceTraveled * 10) / 10,
            status,
        };
    });
}
