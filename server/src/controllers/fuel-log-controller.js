import * as fuelLogService from "../services/fuel-log-service.js";

export async function getAllLogs(req, res) {
    try {
        const logs = await fuelLogService.getAllLogs();
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function createLog(req, res) {
    try {
        const data = req.body;

        const result = await fuelLogService.createFuelLog(data);

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function updateLog(req, res) {
    try {
        const { logId } = req.params;
        const updatedFields = req.body;

        const result = await fuelLogService.updateFuelLog(logId, updatedFields);

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function dailyFuelPerOrder(req, res) {
    try {
        const { startDate, endDate } = req.body;

        const result = await fuelLogService.dailyFuelPerOrder(
            startDate,
            endDate,
        );

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function dailyDistancePerOrder(req, res) {
    try {
        const { startDate, endDate } = req.body;

        const result = await fuelLogService.dailyDistancePerOrder(
            startDate,
            endDate,
        );

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
