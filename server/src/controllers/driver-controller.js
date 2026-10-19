import * as driverService from "../services/driver-services.js";

export async function getDrivers(req, res) {
    try {
        // Mirrors the vehicle list so archived drivers are only returned on request.
        const includeArchived = String(req.query.archived) === "true";
        const drivers = await driverService.getDrivers(includeArchived);
        res.json({
            success: true,
            data: drivers,
        });
    } catch (error) {
        console.error("Error fetching drivers:", error);
        res.status(500).json({ error: error.message });
    }
}

export async function getDriverCapacity(req, res) {
    try {
        const driverCapacity = await driverService.getDriverCapacity();
        res.json({
            success: true,
            data: driverCapacity,
        });
    } catch (error) {
        console.error("Error fetching driver capacity:", error);
        res.status(500).json({ error: error.message });
    }
}

const MAX_TEXT_LENGTH = 100;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OPTIONAL_TEXT_FIELDS = ["contact_number", "license_number"];

// Services throw errors with a statusCode; anything else is an unexpected failure.
function sendDriverError(res, error) {
    const statusCode = error.statusCode ?? 500;
    if (statusCode === 500) console.error("Driver request failed:", error);
    res.status(statusCode).json({ message: error.message });
}

function isValidText(value) {
    return typeof value === "string" && value.trim().length <= MAX_TEXT_LENGTH;
}

// Returns an error message, or null when the id is usable as a Prisma uuid lookup.
function validateDriverId(id) {
    return UUID_PATTERN.test(id) ? null : "Driver id must be a valid UUID";
}

function validateDriverInput(data, isUpdate = false) {
    const body = data ?? {};

    if (isUpdate && !["driver_id", ...OPTIONAL_TEXT_FIELDS].some((field) => body[field] !== undefined)) {
        return "No fields provided for update";
    }

    const driverIdProvided = body.driver_id !== undefined;
    if (!isUpdate || driverIdProvided) {
        if (!isValidText(body.driver_id) || !body.driver_id.trim()) {
            return `driver_id is required and must be a non-empty string of at most ${MAX_TEXT_LENGTH} characters`;
        }
    }

    for (const field of OPTIONAL_TEXT_FIELDS) {
        if (body[field] !== undefined && body[field] !== null && !isValidText(body[field])) {
            return `${field} must be a string of at most ${MAX_TEXT_LENGTH} characters`;
        }
    }

    return null;
}

export async function getDriverById(req, res) {
    try {
        const idError = validateDriverId(req.params.id);
        if (idError) return res.status(400).json({ message: idError });

        const driver = await driverService.getDriverById(req.params.id);
        res.json({ success: true, data: driver });
    } catch (error) {
        sendDriverError(res, error);
    }
}

export async function createDriver(req, res) {
    try {
        const inputError = validateDriverInput(req.body);
        if (inputError) return res.status(400).json({ message: inputError });

        const driver = await driverService.createDriver(req.body);
        res.status(201).json({ success: true, data: driver });
    } catch (error) {
        sendDriverError(res, error);
    }
}

export async function updateDriver(req, res) {
    try {
        const inputError = validateDriverId(req.params.id) ?? validateDriverInput(req.body, true);
        if (inputError) return res.status(400).json({ message: inputError });

        const driver = await driverService.updateDriver(req.params.id, req.body);
        res.json({ success: true, data: driver });
    } catch (error) {
        sendDriverError(res, error);
    }
}

// Shared by archive and unarchive since both only differ in the service call.
function archiveHandler(serviceCall) {
    return async (req, res) => {
        try {
            const idError = validateDriverId(req.params.id);
            if (idError) return res.status(400).json({ message: idError });

            const driver = await serviceCall(req.params.id);
            res.json({ success: true, data: driver });
        } catch (error) {
            sendDriverError(res, error);
        }
    };
}

// Soft delete: DELETE archives the driver instead of removing the row.
export const deleteDriver = archiveHandler((id) => driverService.archiveDriver(id));

export const unarchiveDriver = archiveHandler((id) => driverService.unarchiveDriver(id));
