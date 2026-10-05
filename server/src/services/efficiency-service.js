import prisma from "../lib/prisma.js";
import * as orderService from "./order-service.js";
import * as fuelLogService from "./fuel-log-service.js";

const WEIGHTS = {
    deliverySuccess: 0.5,
    fuelEfficiency: 0.5,
};

// export async function calculateEfficiency(startDate, endDate) {
//     const dateFilter = {};
//     if (startDate) dateFilter.gte = new Date(startDate);
//     if (endDate) {
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);
//         dateFilter.lte = end;
//     }

//     // --- Delivery Success Rate ---
//     const orders = await orderService.getOrdersRange(startDate, endDate);

//     const totalOrders = orders.length;
//     const completedOrders = orders.filter(
//         (o) => o.status === "COMPLETED",
//     ).length;
//     const deliverySuccessRate =
//         totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

//     // --- Fuel Efficiency ---
//     const fuelLogs = await fuelLogService.getLogsRange(startDate, endDate);

//     let fuelEfficiencyRatio = 0;
//     if (fuelLogs.length > 0) {
//         const totalDistance = fuelLogs.reduce(
//             (sum, l) => sum + l.distance_traveled,
//             0,
//         );
//         const totalLiters = fuelLogs.reduce(
//             (sum, l) => sum + l.liters_added,
//             0,
//         );
//         const actualEfficiency =
//             totalLiters > 0 ? totalDistance / totalLiters : 0;

//         // Baseline: historical average efficiency across all logs (all-time, not just this period)
//         const baselineResult = await prisma.fuel_log.aggregate({
//             where: { deleted_at: null },
//             _avg: { fuel_efficiency: true },
//         });
//         // Fallback if no history
//         const baseline = baselineResult._avg.fuel_efficiency || 10;

//         // Cap at 100%
//         fuelEfficiencyRatio =
//             baseline > 0
//                 ? Math.min((actualEfficiency / baseline) * 100, 100)
//                 : 0;
//     }

//     // --- Composite Efficiency Score ---
//     const compositeEfficiency =
//         deliverySuccessRate * WEIGHTS.deliverySuccess +
//         fuelEfficiencyRatio * WEIGHTS.fuelEfficiency;

//     return Math.round(compositeEfficiency * 100) / 100;
// }

export async function calculateEfficiency(startDate, endDate) {
    const fuelLogs = await fuelLogService.getLogsRange(startDate, endDate);

    if (fuelLogs.length === 0) return 0;

    const totalDistance = fuelLogs.reduce(
        (sum, l) => sum + (l.distance_traveled ?? 0),
        0,
    );
    const totalLiters = fuelLogs.reduce(
        (sum, l) => sum + (l.liters_added ?? 0),
        0,
    );

    if (totalLiters === 0) return 0;

    const efficiency = totalDistance / totalLiters;

    return Math.round(efficiency * 100) / 100;
}
