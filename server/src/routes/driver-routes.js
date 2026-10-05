import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
    getDrivers,
    getDriverCapacity,
} from "../controllers/driver-controller.js";

const router = Router();

router.get("/", authenticate, getDrivers);
router.get("/capacity", authenticate, getDriverCapacity);

export default router;
