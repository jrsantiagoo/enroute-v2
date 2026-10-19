import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
    getDrivers,
    getDriverCapacity,
    getDriverById,
    createDriver,
    updateDriver,
    deleteDriver,
    unarchiveDriver,
} from "../controllers/driver-controller.js";

const router = Router();

router.get("/", authenticate, getDrivers);
// Must stay above "/:id" or "capacity" would be treated as a driver id.
router.get("/capacity", authenticate, getDriverCapacity);
router.get("/:id", authenticate, getDriverById);
router.post("/", authenticate, createDriver);
router.put("/:id", authenticate, updateDriver);
router.delete("/:id", authenticate, deleteDriver);
router.patch("/:id/unarchive", authenticate, unarchiveDriver);

export default router;
