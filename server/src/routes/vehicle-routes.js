import { Router } from "express";
import { authenticate } from "../middleware/auth.js";

import * as vehicleController from "../controllers/vehicle-controller.js";

const router = Router();

router.get("/", authenticate, vehicleController.getVehicles);
router.get("/makes", authenticate, vehicleController.getVehicleMakes);
router.get("/models", authenticate, vehicleController.getVehicleModels);
router.get("/:id", authenticate, vehicleController.getVehicleById);
router.post("/", authenticate, vehicleController.createVehicle);
router.put("/:id", authenticate, vehicleController.updateVehicle);
router.delete("/:id", authenticate, vehicleController.deleteVehicle);
router.patch("/:id/archive", authenticate, vehicleController.archiveVehicle);
router.patch("/:id/unarchive", authenticate, vehicleController.unarchiveVehicle);

export default router;
