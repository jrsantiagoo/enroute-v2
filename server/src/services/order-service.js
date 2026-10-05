import prisma from "../lib/prisma.js";

async function generateOrderId() {
    // Get the current date in YYYYMMDD format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;

    const prefix = `ORD-${dateStr}-`;

    // Find the latest order ID generated today
    const latestOrder = await prisma.order.findFirst({
        where: {
            order_id: {
                startsWith: prefix,
            },
        },
        orderBy: {
            order_id: "desc",
        },
        select: {
            order_id: true,
        },
    });

    // Next sequence number
    let nextSequence = 0;
    if (latestOrder) {
        // Extract the number after the last dash
        const parts = latestOrder.order_id.split("-");
        const lastSequence = parseInt(parts[2], 10);
        nextSequence = lastSequence + 1;
    }

    // 4. Pad the sequence with leading zeros (e.g., 5 -> "005")
    const sequenceStr = String(nextSequence).padStart(3, "0");

    return `${prefix}${sequenceStr}`;
}

// --- ALL ORDERS ---
export async function getAllOrders() {
    return prisma.order.findMany({
        orderBy: {
            order_id: "asc",
        },
    });
}

// --- GET ORDER BY ID ---
export async function getOrderById(orderId) {
    const order = await prisma.order.findUnique({
        where: { order_id: orderId },
    });

    if (!order) throw new Error("Order not found");

    return order;
}

// --- GET ORDERS BY TRIP ID ---
export async function getTripOrders(tripId) {
    const trip = await prisma.trip.findUnique({
        where: { id_: tripId },
    });

    if (!trip) throw new Error("Trip not found");

    return prisma.order.findMany({
        where: { trip_id_: tripId },
    });
}

// --- GET DELIVERED ORDERS GIVEN A DATE RANGE ---
export async function getDeliveredOrdersRange(startDate, endDate) {
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
        // Set to the end of the day instead of the start of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
    }
    return prisma.order.findMany({
        where: {
            ...(Object.keys(dateFilter).length > 0 && {
                delivered_by: dateFilter,
            }),
        },
        orderBy: { delivered_by: "asc" },
    });
}

// --- GET ORDERS GIVEN A DATE RANGE ---
export async function getOrdersRange(startDate, endDate) {
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
        // Set to the end of the day instead of the start of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
    }
    return prisma.order.findMany({
        where: {
            ...(Object.keys(dateFilter).length > 0 && {
                OR: [{ ordered_on: dateFilter }, { delivered_by: dateFilter }],
            }),
        },
        orderBy: { ordered_on: "asc" },
    });
}

// --- CREATE AN ORDER ---
export async function createOrder(
    client,
    destination,
    orderedOn,
    packageContent,
) {
    return prisma.order.create({
        data: {
            order_id: await generateOrderId(),
            client: client,
            destination: destination,
            ordered_on: orderedOn,
            package_content: packageContent,
        },
    });
}

// --- UPDATE ORDER INFO ---
export async function updateOrder(orderId, updatedFields) {
    const order = await prisma.order.findUnique({
        where: { order_id: orderId },
    });

    if (!order) throw new Error("Order not found");

    return prisma.order.update({
        where: { order_id: orderId },
        data: updatedFields,
    });
}

// --- DELETE AN ORDER ---
export async function deleteOrder(orderId) {
    const order = await prisma.order.findUnique({
        where: { order_id: orderId },
    });

    if (!order) throw new Error("Order not found");

    return prisma.order.delete({
        where: { order_id: orderId },
    });
}
