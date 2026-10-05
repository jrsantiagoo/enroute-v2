import prisma from "../lib/prisma.js";
import * as orderService from "./order-service.js";
import { getVehicleById, updateVehicle } from "./vehicle-service.js";

export function buildDailyPerOrderMetrics(
    logs,
    orders,
    valueKey,
    totalKey,
    perOrderKey,
) {
    const buckets = {};

    for (const log of logs) {
        const dateKey = new Date(log.log_date).toISOString().split("T")[0];

        if (!buckets[dateKey]) {
            buckets[dateKey] = { [totalKey]: 0, orderCount: 0 };
        }

        buckets[dateKey][totalKey] += Number(log[valueKey] || 0);
    }

    for (const order of orders) {
        const dateKey = new Date(order.delivered_by)
            .toISOString()
            .split("T")[0];

        if (!buckets[dateKey]) continue;

        buckets[dateKey].orderCount += 1;
    }

    return Object.entries(buckets)
        .map(([date, data]) => ({
            date,
            [totalKey]: data[totalKey],
            orderCount: data.orderCount,
            [perOrderKey]:
                data.orderCount > 0 ? data[totalKey] / data.orderCount : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

// --- ALL FUEL LOGS ---
export async function getAllLogs() {
    return prisma.fuel_log.findMany({
        orderBy: { created_at: "desc" },
    });
}

// --- CREATE LOG ---
export async function createFuelLog(data) {
    const vehicle = getVehicleById(data.vehicle_id_);
    if (!data.distance_traveled) {
        data.distance_traveled =
            data.odometer_reading - (await vehicle).last_odometer;
    }
    if (data.distance_traveled < 0) {
        throw new Error("Distance traveled cannot be negative.");
    }
    if (data.liters_added <= 0) {
        throw new Error("Liters added must be greater than 0");
    }

    if (!data.fuel_efficiency) {
        data.fuel_efficiency = data.distance_traveled / data.liters_added;
    }

    if (!data.variance_percentage) {
        const target_efficiency = (await vehicle).expected_kml;
        data.variance_percentage =
            ((data.fuel_efficiency - target_efficiency) / target_efficiency) *
            100;
    }

    if (!data.price_per_liter && data.total_price) {
        data.price_per_liter = data.total_price / data.liters_added;
    } else if (data.price_per_liter && !data.total_price) {
        data.total_price = data.liters_added * data.price_per_liter;
    }

    if (!data.cost_per_km) {
        data.cost_per_km =
            data.distance_traveled != 0
                ? data.total_price / data.distance_traveled
                : 0;
    }

    if (!data.needs_attention) {
        data.needs_attention = false;
    }

    if (!data.log_date) {
        data.log_date = new Date();
    } else {
        data.log_date = new Date(data.log_date);
    }

    updateVehicle(data.vehicle_id_, { last_odometer: data.odometer_reading });

    return prisma.fuel_log.create({
        data,
    });
}

// --- UPDATE LOG ---
export async function updateFuelLog(logId, updatedFields) {
    const fuelLog = await prisma.fuel_log.findUnique({
        where: { id_: logId },
    });

    if (!fuelLog) throw new Error("Fuel log record not found");

    return prisma.fuel_log.update({
        where: { id_: logId },
        data: updatedFields,
    });
}

// --- GET LOGS GIVEN A DATE RANGE ---
export async function getLogsRange(startDate, endDate) {
    const dateFilter = {};
    // In case a start or end date is not given
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
        // Set to the end of the day instead of the start of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
    }

    return prisma.fuel_log.findMany({
        where: {
            deleted_at: null,
            ...(Object.keys(dateFilter).length > 0 && { log_date: dateFilter }),
        },
        orderBy: { log_date: "asc" },
    });
}

// --- DAILY FUEL CONSUMPTION PER ORDER ---
export async function dailyFuelPerOrder(startDate, endDate) {
    const fuelLogs = await getLogsRange(startDate, endDate);
    const orders = await orderService.getDeliveredOrdersRange(
        startDate,
        endDate,
    );

    return buildDailyPerOrderMetrics(
        fuelLogs,
        orders,
        "liters_added",
        "totalFuel",
        "fuelPerOrder",
    );
}

// --- DAILY DISTANCE TRAVELED PER ORDER ---
export async function dailyDistancePerOrder(startDate, endDate) {
    const fuelLogs = await getLogsRange(startDate, endDate);
    const orders = await orderService.getDeliveredOrdersRange(
        startDate,
        endDate,
    );

    return buildDailyPerOrderMetrics(
        fuelLogs,
        orders,
        "distance_traveled",
        "totalDistance",
        "distancePerOrder",
    );
}
