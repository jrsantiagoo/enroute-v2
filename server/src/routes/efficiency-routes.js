import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as efficiencyController from "../controllers/efficiency-controller.js";

const router = Router();

router.post("/", authenticate, efficiencyController.getEfficiency);

export default router;
