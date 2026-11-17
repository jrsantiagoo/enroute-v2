import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as auditLogController from "../controllers/audit-log-controller.js";

const router = Router();

router.get("/", authenticate, auditLogController.getAuditLog);

export default router;
