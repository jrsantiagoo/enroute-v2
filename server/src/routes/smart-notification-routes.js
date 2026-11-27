import { Router } from "express";
import {
    getSmartNotifications,
    dismissSmartNotification,
} from "../controllers/smart-notification-controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, getSmartNotifications);
router.post("/dismiss", authenticate, dismissSmartNotification);

export default router;
