// tripController.js

import * as tripService from "../services/trip-service.js";

// --- CREATE TRIP ---
export async function createTrip(req, res) {
    try {
        const { routeId, driverId, scheduledDate, notes, vehicleId } = req.body;
        if (!routeId || !driverId) {
            return res
                .status(400)
                .json({ message: "routeId and driverId are required" });
        }

        const result = await tripService.createTrip(
            routeId,
            driverId,
            scheduledDate,
            notes,
            vehicleId,
        );
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// --- TRIP ASSIGNMENT ---
export async function assignTripToDriver(req, res) {
    try {
        const { tripId, driverId } = req.body;
        if (!tripId || !driverId) {
            return res
                .status(400)
                .json({ message: "tripId and driverId are required" });
        }

        const result = await tripService.assignDriverToTrip(tripId, driverId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// --- TRIP STATUS CHANGE ---
export async function changeTripStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "status is required" });
        }

        const trip = await tripService.updateTripStatus(id, status);
        res.json({ success: true, data: trip });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// --- TRIP UPDATE ---
export async function updateTrip(req, res) {
    try {
        const { id } = req.params;
        const updatedFields = req.body;

        const result = await tripService.updateTrip(id, updatedFields);

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// --- GET ALL TRIPS ---
export async function getAllTrips(req, res) {
    try {
        const trips = await tripService.getAllTrips();
        res.json({ success: true, data: trips });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// --- GET TRIPS GIVEN A DATE RANGE
export async function getTripsRange(req, res) {
    try {
        const { startDate, endDate } = req.body;

        const trips = await tripService.getTripsRange(startDate, endDate);
        res.json({ success: true, data: trips });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// --- GET TRIPS BY DRIVER ---
export async function getTripsForDriver(req, res) {
    try {
        const { driverId } = req.params;
        const trips = await tripService.getTripsByDriver(driverId);
        res.json({ success: true, data: trips });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// --- DELETE TRIP ---
export async function deleteTrip(req, res) {
    try {
        const { id } = req.params;
        const result = await tripService.deleteTrip(id);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function archiveTrip(req, res) {
    try {
        const id_ = req.params.id;
        const archivedTrip = await tripService.archiveTrip(id_);

        res.json({ success: true, data: archivedTrip });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function unarchiveTrip(req, res) {
    try {
        const id_ = req.params.id;
        const unarchivedTrip = await tripService.unarchiveTrip(id_);

        res.json({ success: true, data: unarchivedTrip });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// --- GET TRIP DETAILS ---
export async function getTripDetail(req, res) {
    try {
        const { id } = req.params;
        const trip = await tripService.getTripById(id);
        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }
        res.json({ success: true, data: trip });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// --- GET ASSIGNMENT GRID ---
export async function getAssignmentGrid(req, res) {
    try {
        const grid = await tripService.getTripsByDriverAndDay();
        res.json({ success: true, data: grid });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
