import * as managerService from "../services/manager-service.js";

export async function getAllManagers(req, res) {
    try {
        const managers = await managerService.getAllManagers();
        res.json({ success: true, data: managers });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function getMe(req, res) {
    try {
        const managerId = req.user.user.id;
        const manager = await managerService.getMe(managerId);

        res.json({ success: true, data: manager });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
