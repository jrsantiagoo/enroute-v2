import { apiCall } from "./apiCall";

export async function getAuditLog() {
    const response = await apiCall("/api/audit_log");
    const body = await response.json();
    if (!response.ok)
        throw new Error(body.message ?? "Failed to load audit log");
    return body.data;
}
