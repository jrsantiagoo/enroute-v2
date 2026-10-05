import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as managerController from "../controllers/manager-controller.js";

const router = Router();

router.get("/", authenticate, managerController.getAllManagers);
router.get("/me", authenticate, managerController.getMe);

export default router;
