import * as vehicleService from "../services/vehicle-service.js";

const VALID_VEHICLE_TYPES = ["VAN", "MOTORCYCLE", "CAR", "TRUCK", "BUS", "OTHER"];

// --- INPUT VALIDATION ---
function validateVehicleInput(data, isUpdate = false) {

    // Create
    if (!isUpdate) {
        if (!data.plate_number || typeof data.plate_number !== "string" || !data.plate_number.trim())
            return ["plate_number is required"];
        if (data.year === undefined || data.year === null || isNaN(Number(data.year)))
            return ["year is required and must be a valid number"];
        if (data.initial_odometer === undefined || data.initial_odometer === null || isNaN(Number(data.initial_odometer)))
            return ["initial_odometer is required and must be a valid number"];
        if (Number(data.initial_odometer) < 0)
            return ["initial_odometer must be >= 0"];
        if (data.expected_kml === undefined || data.expected_kml === null || isNaN(Number(data.expected_kml)))
            return ["expected_kml is required and must be a valid number"];
        if (Number(data.expected_kml) <= 0)
            return ["expected_kml must be > 0"];
    } else {
        if (!data || Object.keys(data).length === 0)
            return ["No fields provided for update"];
    }

    // Update
    if (data.plate_number !== undefined && (typeof data.plate_number !== "string" || !data.plate_number.trim()))
        return ["plate_number must be a non-empty string"];
    if (data.year !== undefined && data.year !== null) {
        if (isNaN(Number(data.year))) return ["year must be a valid number"];
    }
    if (data.initial_odometer !== undefined && data.initial_odometer !== null) {
        if (isNaN(Number(data.initial_odometer))) return ["initial_odometer must be a valid number"];
        if (Number(data.initial_odometer) < 0) return ["initial_odometer must be >= 0"];
    }
    if (data.expected_kml !== undefined && data.expected_kml !== null) {
        if (isNaN(Number(data.expected_kml))) return ["expected_kml must be a valid number"];
        if (Number(data.expected_kml) <= 0) return ["expected_kml must be > 0"];
    }
    if (data.vehicle_type !== undefined && data.vehicle_type !== null) {
        if (!VALID_VEHICLE_TYPES.includes(data.vehicle_type))
            return [`vehicle_type must be one of: ${VALID_VEHICLE_TYPES.join(", ")}`];
    }
    // `target_efficiency` is deprecated; use `expected_kml` instead
    if (data.weight_capacity !== undefined && data.weight_capacity !== null) {
        if (isNaN(Number(data.weight_capacity))) return ["weight_capacity must be a valid number"];
        if (Number(data.weight_capacity) < 0) return ["weight_capacity must be >= 0"];
    }
    if (data.make_id_ !== undefined && data.make_id_ !== null) {
        if (typeof data.make_id_ !== "string" || !data.make_id_.trim())
            return ["make_id_ must be a non-empty string"];
    }
    if (data.model_id_ !== undefined && data.model_id_ !== null) {
        if (typeof data.model_id_ !== "string" || !data.model_id_.trim())
            return ["model_id_ must be a non-empty string"];
    }
    if (data.registration_expiry !== undefined && data.registration_expiry !== null) {
        if (isNaN(new Date(data.registration_expiry).getTime()))
            return ["registration_expiry must be a valid date"];
    }
    if (data.insurance_expiry !== undefined && data.insurance_expiry !== null) {
        if (isNaN(new Date(data.insurance_expiry).getTime()))
            return ["insurance_expiry must be a valid date"];
    }

    return [];
}

export async function getVehicles(req, res) {
    try {
        // If the client requests archived vehicles include them.
        const includeArchived = String(req.query.archived) === "true";
        const vehicles = await vehicleService.getVehicles(includeArchived);
        res.json({ success: true, data: vehicles });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function getVehicleMakes(req, res) {
    try {
        const makes = await vehicleService.getVehicleMakes();
        res.json({ success: true, data: makes });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function getVehicleModels(req, res) {
    try {
        const models = await vehicleService.getVehicleModels();
        res.json({ success: true, data: models });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function getVehicleById(req, res) {
    try {
        const { id } = req.params;
        const vehicle = await vehicleService.getVehicleById(id);
        res.json({ success: true, data: vehicle });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function createVehicle(req, res) {
    try {
        const vehicle = req.body;
        const errors = validateVehicleInput(vehicle);
        if (errors.length > 0) {
            return res.status(400).json({ message: errors[0] });
        }
        const newVehicle = await vehicleService.createVehicle(vehicle);
        res.json({ success: true, data: newVehicle });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function updateVehicle(req, res) {
    try {
        const { id } = req.params;
        const data = req.body;
        const errors = validateVehicleInput(data, true);
        if (errors.length > 0) {
            return res.status(400).json({ message: errors[0] });
        }
        const result = await vehicleService.updateVehicle(id, data);
        res.json({ success: true, data: result });        
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function deleteVehicle(req, res) {
    try{
        const { id } = req.params;

        const result = await vehicleService.deleteVehicle(id);
        res.json({ success: true, data: result });   
    } catch (error) {
        res.status(400).json({ message: error.message})
    }
}

export async function archiveVehicle(req, res) {
    try {
        const { id } = req.params;
        const result = await vehicleService.archiveVehicle(id);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function unarchiveVehicle(req, res) {
    try {
        const { id } = req.params;
        const result = await vehicleService.unarchiveVehicle(id);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}