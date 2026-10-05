import { Router } from "express";
import {
    assignTripToDriver,
    changeTripStatus,
    updateTrip,
    getTripsForDriver,
    getTripDetail,
    getAllTrips,
    getTripsRange,
    createTrip,
    deleteTrip,
    archiveTrip,
    unarchiveTrip,
    getAssignmentGrid,
} from "../controllers/trip-controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, getAllTrips);
router.post("/trips_date_range", authenticate, getTripsRange);
router.post("/", authenticate, createTrip);
router.post("/assign", authenticate, assignTripToDriver);
router.patch("/:id/status", authenticate, changeTripStatus);
router.patch("/update/:id", authenticate, updateTrip);
router.patch("/archive/:id", authenticate, archiveTrip);
router.patch("/unarchive/:id", authenticate, unarchiveTrip);
router.get("/driver/:driverId", authenticate, getTripsForDriver);
router.get("/assignment-grid", authenticate, getAssignmentGrid);
router.get("/:id", authenticate, getTripDetail);
router.delete("/:id", authenticate, deleteTrip);

export default router;
