import prisma from "../lib/prisma.js";

const PRISMA_UNIQUE_VIOLATION = "P2002";
const FULLY_UTILIZED_HOURS = 8;
const DRIVER_STATUS = {
    INACTIVE: "INACTIVE",
    ACTIVE: "ACTIVE",
    FULLY_UTILIZED: "FULLY UTILIZED",
};

// Whitelist keeps clients from writing internal columns such as id_ or archived_at.
const WRITABLE_DRIVER_FIELDS = [
    "driver_id",
    "contact_number",
    "license_number",
];

// Carries an HTTP status so the controller can respond without inspecting messages.
export class DriverError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = "DriverError";
        this.statusCode = statusCode;
    }
}

function pickWritableFields(data) {
    const picked = {};
    for (const field of WRITABLE_DRIVER_FIELDS) {
        if (data[field] !== undefined) {
            picked[field] =
                typeof data[field] === "string"
                    ? data[field].trim()
                    : data[field];
        }
    }
    return picked;
}

// Archived drivers are treated as missing everywhere except the restore path.
async function findDriverOrThrow(id, { includeArchived = false } = {}) {
    const driver = await prisma.agent_profile.findUnique({
        where: { id_: id },
    });
    if (!driver || (driver.archived_at && !includeArchived)) {
        throw new DriverError("Driver not found", 404);
    }
    return driver;
}

// Translates the database uniqueness error here so create and update stay consistent.
async function runDriverWrite(write) {
    try {
        return await write();
    } catch (error) {
        if (error.code === PRISMA_UNIQUE_VIOLATION) {
            throw new DriverError("driver_id already exists", 409);
        }
        throw error;
    }
}

// Status is derived only from recorded work, so it is never set by a manager.
function deriveDriverStatus(activeHours, fuel) {
    if (activeHours >= FULLY_UTILIZED_HOURS)
        return DRIVER_STATUS.FULLY_UTILIZED;
    if (activeHours > 0 || fuel.fuelConsumed > 0 || fuel.distanceTraveled > 0) {
        return DRIVER_STATUS.ACTIVE;
    }
    return DRIVER_STATUS.INACTIVE;
}

// export async function getDrivers(includeArchived = false) {
//     const drivers = await prisma.agent_profile.findMany({
//         where: includeArchived ? {} : { archived_at: null },
//         orderBy: {
//             driver_id: "asc",
//         },
//     });
//     return drivers;
// }

export async function getDrivers() {
    const drivers = await prisma.agent_profile.findMany({
        orderBy: {
            driver_id: "asc",
        },
    });
    return drivers;
}

// Passing a driverId scopes every query to that driver so single-driver checks stay cheap.
// export async function getDriverCapacity(driverId) {
//     const drivers = await prisma.agent_profile.findMany({
//         where: { archived_at: null, ...(driverId && { id_: driverId }) },
//         orderBy: {
//             driver_id: "asc",
//         },
//     });

//     const driverFilter = driverId ?? { not: null };

//     // Aggregate fuel consumed + distance traveled per driver (all-time)
//     const fuelLogs = await prisma.fuel_log.findMany({
//         where: {
//             deleted_at: null,
//             driver_id_: driverFilter,
//         },
//         select: {
//             driver_id_: true,
//             liters_added: true,
//             distance_traveled: true,
//         },
//     });

//     const fuelTotals = {};
//     for (const log of fuelLogs) {
//         if (!fuelTotals[log.driver_id_]) {
//             fuelTotals[log.driver_id_] = {
//                 fuelConsumed: 0,
//                 distanceTraveled: 0,
//             };
//         }
//         fuelTotals[log.driver_id_].fuelConsumed += Number(
//             log.liters_added || 0,
//         );
//         fuelTotals[log.driver_id_].distanceTraveled += Number(
//             log.distance_traveled || 0,
//         );
//     }

//     // Aggregate active hours per driver from scheduled trip durations
//     const trips = await prisma.trip.findMany({
//         where: {
//             driver_id_: driverFilter,
//             deleted_at: null,
//         },
//         select: {
//             driver_id_: true,
//             route: {
//                 select: {
//                     totalDurationMinutes: true,
//                 },
//             },
//         },
//     });

//     const hoursTotals = {};
//     for (const trip of trips) {
//         const minutes = trip.route?.totalDurationMinutes || 0;
//         hoursTotals[trip.driver_id_] =
//             (hoursTotals[trip.driver_id_] || 0) + minutes;
//     }

//     const today = new Date().toISOString().split("T")[0];

//     return drivers.map((driver) => {
//         const fuel = fuelTotals[driver.id_] || {
//             fuelConsumed: 0,
//             distanceTraveled: 0,
//         };
//         const activeHours = (hoursTotals[driver.id_] || 0) / 60;

//         return {
//             id_: driver.id_,
//             driverId: driver.driver_id,
//             date: today,
//             activeHours: Math.round(activeHours * 10) / 10,
//             fuelConsumed: Math.round(fuel.fuelConsumed * 10) / 10,
//             distanceTraveled: Math.round(fuel.distanceTraveled * 10) / 10,
//             status: deriveDriverStatus(activeHours, fuel),
//         };
//     });
// }

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

// TODO: Call this from trip-service createTrip and assignDriverToTrip once trip-service.js is cleared for edits.
// FIXME: A brand-new driver has no trips or fuel logs, so is INACTIVE and could never receive a first assignment.
export async function assertDriverAssignable(driverId) {
    await findDriverOrThrow(driverId);

    const [capacity] = await getDriverCapacity(driverId);
    if (capacity.status === DRIVER_STATUS.INACTIVE) {
        throw new DriverError("Inactive drivers cannot be assigned trips", 409);
    }
}

export async function getDriverById(id) {
    return findDriverOrThrow(id);
}

export async function createDriver(data) {
    return runDriverWrite(() =>
        prisma.agent_profile.create({ data: pickWritableFields(data) }),
    );
}

export async function updateDriver(id, data) {
    await findDriverOrThrow(id);

    return runDriverWrite(() =>
        prisma.agent_profile.update({
            where: { id_: id },
            data: pickWritableFields(data),
        }),
    );
}

// Only archived_at is written so the driver's vehicles, trips and fuel logs stay untouched.
export async function archiveDriver(id) {
    await findDriverOrThrow(id);

    return prisma.agent_profile.update({
        where: { id_: id },
        data: { archived_at: new Date() },
    });
}

export async function unarchiveDriver(id) {
    await findDriverOrThrow(id, { includeArchived: true });

    return prisma.agent_profile.update({
        where: { id_: id },
        data: { archived_at: null },
    });
}
