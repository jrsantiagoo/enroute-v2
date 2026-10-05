import { Router } from "express";
import { authenticate } from "../middleware/auth.js";

import * as fuelLogController from "../controllers/fuel-log-controller.js";

const router = Router();

router.get("/", authenticate, fuelLogController.getAllLogs);
router.post("/", authenticate, fuelLogController.createLog);
router.put("/:logId", authenticate, fuelLogController.updateLog);
router.post(
    "/daily_fuel_per_order",
    authenticate,
    fuelLogController.dailyFuelPerOrder,
);
router.post(
    "/daily_distance_per_order",
    authenticate,
    fuelLogController.dailyDistancePerOrder,
);

export default router;
