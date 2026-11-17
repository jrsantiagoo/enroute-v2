import * as auditLogService from "../services/audit-log-service.js";

export async function getAuditLog(req, res) {
    try {
        const auditLogs = await auditLogService.getAuditLog();
        res.json({ success: true, data: auditLogs });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
