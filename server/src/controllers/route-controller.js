import * as routeService from "../services/route-service.js";

export async function getAllRoutes(req, res) {
    try {
        const routes = await routeService.getAllRoutes();
        res.json({ success: true, data: routes });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function createRoute(req, res) {
    try {
        const route = req.body;
        const newRoute = await routeService.createRoute(route);

        res.json({ success: true, data: newRoute });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function updateRoute(req, res) {
    try {
        const id_ = req.params.id_;
        const route = req.body;
        const stops = route.stops;
        let updatedRoute;

        await routeService.updateRouteDetails(route);
        if (stops) {
            updatedRoute = await routeService.updateStops(id_, stops);
        }

        res.json({ success: true, data: updatedRoute });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function archiveRoute(req, res) {
    try {
        const id_ = req.params.id_;
        const archivedRoute = await routeService.archiveRoute(id_);

        res.json({ success: true, data: archivedRoute });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function unarchiveRoute(req, res) {
    try {
        const id_ = req.params.id_;
        const unarchivedRoute = await routeService.unarchiveRoute(id_);

        res.json({ success: true, data: unarchivedRoute });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function deleteRoute(req, res) {
    try {
        const id_ = req.params.id_;
        const deletedRoute = await routeService.deleteRoute(id_);

        res.json({ success: true, data: deletedRoute });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
