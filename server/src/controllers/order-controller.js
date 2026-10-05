import * as orderService from "../services/order-service.js";

export async function getAllOrders(req, res) {
    try {
        const orders = await orderService.getAllOrders();
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function getOrdersRange(req, res) {
    try {
        const { startDate, endDate } = req.body;

        const orders = await orderService.getOrdersRange(startDate, endDate);
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function getOrderById(req, res) {
    try {
        const { orderId } = req.params;
        const order = await orderService.getOrderById(orderId);
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function getTripOrders(req, res) {
    try {
        const { tripId } = req.params;
        const orders = await orderService.getTripOrders(tripId);
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function createOrder(req, res) {
    try {
        const { client, destination, orderedOn, packageContent } = req.body;

        if (!client || !destination || !packageContent) {
            return res.status(400).json({
                message: "Fields incomplete",
            });
        }

        const result = await orderService.createOrder(
            client,
            destination,
            orderedOn || new Date(),
            packageContent,
        );
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function updateOrderPackageInfo(req, res) {
    try {
        const { orderId } = req.params;
        const { package_weight, package_size } = req.body;

        const updatedFields = {};
        if (package_weight !== undefined)
            updatedFields.package_weight = package_weight;
        if (package_size !== undefined)
            updatedFields.package_size = package_size;

        // Check if any field was provided
        if (Object.keys(updatedFields).length === 0) {
            return res.status(400).json({
                message: "No fields were provided",
            });
        }

        const result = await orderService.updateOrder(orderId, updatedFields);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function updateOrderStatus(req, res) {
    try {
        const { orderId } = req.params;
        const { status, delivered_by } = req.body;

        const updatedFields = {};
        if (status !== undefined) updatedFields.status = status.toUpperCase();
        if (delivered_by !== undefined)
            updatedFields.delivered_by = delivered_by;

        // Check if any field was provided
        if (Object.keys(updatedFields).length === 0) {
            return res.status(400).json({
                message: "No fields were provided",
            });
        }

        const result = await orderService.updateOrder(orderId, updatedFields);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function assignOrderToTrip(req, res) {
    try {
        const { orderId } = req.params;
        const { tripId } = req.body;

        if (!tripId)
            return res.status(400).json({ message: "tripId is required" });

        const updatedFields = {
            trip_id_: tripId,
        };

        const result = await orderService.updateOrder(orderId, updatedFields);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function deleteOrder(req, res) {
    try {
        const { orderId } = req.params;

        const result = await orderService.deleteOrder(orderId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
