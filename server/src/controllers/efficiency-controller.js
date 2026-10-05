import * as efficiencyService from "../services/efficiency-service.js";

export async function getEfficiency(req, res) {
    try {
        const { startDate, endDate } = req.body;

        const result = await efficiencyService.calculateEfficiency(
            startDate,
            endDate,
        );

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
