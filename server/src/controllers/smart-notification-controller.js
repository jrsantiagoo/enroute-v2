import * as smartNotificationService from "../services/smart-notification-service.js";

// Services throw errors with a statusCode; anything else is an unexpected failure.
function sendNotificationError(res, error) {
    const statusCode = error.statusCode ?? 500;
    if (statusCode === 500)
        console.error("Smart notification request failed:", error);
    res.status(statusCode).json({ message: error.message });
}

// NOTE: Mirrors how the auth middleware exposes the signed-in manager. Check it against trip-controller.js if it ever returns undefined.
function getManagerId(req) {
    return req.user?.user?.id ?? req.user?.id;
}

export async function getSmartNotifications(req, res) {
    try {
        const managerId = getManagerId(req);
        const surface = String(req.query.surface ?? "dashboard");
        const date = req.query.date ? String(req.query.date) : undefined;

        const notifications =
            await smartNotificationService.getSmartNotifications(
                managerId,
                surface,
                date,
            );
        res.json({ success: true, data: notifications });
    } catch (error) {
        sendNotificationError(res, error);
    }
}

export async function dismissSmartNotification(req, res) {
    try {
        const managerId = getManagerId(req);
        const { surface, key, date } = req.body ?? {};
        if (typeof key !== "string" || !key)
            return res.status(400).json({ message: "key is required" });

        await smartNotificationService.dismissSmartNotification(
            managerId,
            String(surface),
            key,
            date,
        );
        res.json({ success: true });
    } catch (error) {
        sendNotificationError(res, error);
    }
}
