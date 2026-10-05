// server/src/services/sync-service.js
import cron from "node-cron";
import prisma from "../lib/prisma.js";

const CORE_API = process.env.CORE_API;
const LOGISTICS_API = process.env.LOGISTICS_API;

let cachedToken = null;
let tokenExpiry = null;
let tokenPromise = null;

// --- GET ACCESS TOKEN ---
async function getAccessToken() {
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    // If a token fetch is already in progress, wait for it
    if (tokenPromise) return tokenPromise;

    tokenPromise = (async () => {
        const res = await fetch(`${CORE_API}/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: process.env.CLIENT_EMAIL,
                password_hash: process.env.CLIENT_PASSWORD,
                tenant_code: process.env.CLIENT_TENANT_CODE,
            }),
        });

        const json = await res.json();

        if (!json.data?.accessToken) {
            throw new Error(`Login failed: ${json.message}`);
        }

        cachedToken = json.data.accessToken;
        tokenExpiry = Date.now() + 50 * 60 * 1000;
        tokenPromise = null;

        console.log("[sync] access token refreshed");
        return cachedToken;
    })();

    return tokenPromise;
}

async function authFetch(url, options = {}) {
    const token = await getAccessToken();
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (res.status === 401) {
        cachedToken = null;
        const retryToken = await getAccessToken();
        return fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${retryToken}`,
                ...options.headers,
            },
        });
    }

    return res;
}

async function syncFuelLogs() {
    try {
        const res = await authFetch(`${LOGISTICS_API}/v1/fuel-logs`, {
            method: "GET",
        });
        const { data } = await res.json();
        if (!data?.length) {
            console.log("[sync] fuel logs: no data returned");
            return;
        }

        for (const log of data) {
            await prisma.fuel_log.upsert({
                where: { id_: log.id_ },
                update: {
                    log_date: log.log_date ? new Date(log.log_date) : null,
                    odometer_reading: log.odometer_reading,
                    liters_added: log.liters_added,
                    price_per_liter: log.price_per_liter,
                    total_price: log.total_price,
                    receipt_url: log.receipt_url ?? null,
                    notes: log.notes ?? null,
                    distance_traveled: log.distance_traveled,
                    fuel_efficiency: log.fuel_efficiency,
                    cost_per_km: log.cost_per_km,
                    variance_percentage: log.variance_percentage,
                    needs_attention: log.needs_attention,
                    driver_id_: log.driver_id_ ?? null,
                    vehicle_id_: log.vehicle_id_ ?? null,
                    deleted_at: log.deleted_at
                        ? new Date(log.deleted_at)
                        : null,
                },
                create: {
                    id_: log.id_,
                    log_date: log.log_date ? new Date(log.log_date) : null,
                    odometer_reading: log.odometer_reading,
                    liters_added: log.liters_added,
                    price_per_liter: log.price_per_liter,
                    total_price: log.total_price,
                    receipt_url: log.receipt_url ?? null,
                    notes: log.notes ?? null,
                    distance_traveled: log.distance_traveled,
                    fuel_efficiency: log.fuel_efficiency,
                    cost_per_km: log.cost_per_km,
                    variance_percentage: log.variance_percentage,
                    needs_attention: log.needs_attention,
                    driver_id_: log.driver_id_ ?? null,
                    vehicle_id_: log.vehicle_id_ ?? null,
                    created_at: new Date(log.created_at),
                    deleted_at: log.deleted_at
                        ? new Date(log.deleted_at)
                        : null,
                },
            });
        }
        console.log(`[sync] fuel logs synced: ${data.length} records`);
    } catch (err) {
        console.error("[sync] fuel logs failed:", err.message);
    }
}

async function syncTrips() {
    try {
        const res = await authFetch(`${LOGISTICS_API}/v1/dispatch/trip`, {
            method: "GET",
        });
        const { data } = await res.json();
        const trips = data?.trips ?? [];

        if (!trips.length) {
            console.log("[sync] trips: no data returned");
            return;
        }

        for (const trip of trips) {
            await prisma.trip.upsert({
                where: { id_: trip.id_ },
                update: {
                    status: trip.status,
                    tag_type: trip.tag_type,
                    scheduled_date: trip.scheduled_date
                        ? new Date(trip.scheduled_date)
                        : null,
                    notes: trip.notes ?? null,
                    image_url: trip.image_url ?? null,
                    proof_url: trip.proof_url ?? null,
                    accepted_at: trip.accepted_at
                        ? new Date(trip.accepted_at)
                        : null,
                    departed_at: trip.departed_at
                        ? new Date(trip.departed_at)
                        : null,
                    completed_at: trip.completed_at
                        ? new Date(trip.completed_at)
                        : null,
                    driver_id_: null, // leave null for now
                    vehicle_id_: null,
                    deleted_at: trip.deleted_at
                        ? new Date(trip.deleted_at)
                        : null,
                },
                create: {
                    id_: trip.id_,
                    status: trip.status,
                    tag_type: trip.tag_type,
                    scheduled_date: trip.scheduled_date
                        ? new Date(trip.scheduled_date)
                        : null,
                    notes: trip.notes ?? null,
                    image_url: trip.image_url ?? null,
                    proof_url: trip.proof_url ?? null,
                    accepted_at: trip.accepted_at
                        ? new Date(trip.accepted_at)
                        : null,
                    departed_at: trip.departed_at
                        ? new Date(trip.departed_at)
                        : null,
                    completed_at: trip.completed_at
                        ? new Date(trip.completed_at)
                        : null,
                    driver_id_: null, // leave null for now
                    vehicle_id_: null,
                    created_at: new Date(trip.created_at),
                    deleted_at: trip.deleted_at
                        ? new Date(trip.deleted_at)
                        : null,
                },
            });
        }
        console.log(`[sync] trips synced: ${trips.length} records`);
    } catch (err) {
        console.error("[sync] trips failed:", err.message);
    }
}

async function syncVehicles() {
    try {
        const res = await authFetch(`${LOGISTICS_API}/v1/vehicles`, {
            method: "GET",
        });
        const { data } = await res.json();
        const { vehicles } = data || [];

        if (!vehicles.length) {
            console.log("[sync] vehicles: no data returned");
            return;
        }

        for (const vehicle of vehicles) {
            await prisma.vehicle.upsert({
                where: { id_: vehicle.id_ },
                update: {
                    plate_number: vehicle.plate_number,
                    year: vehicle.year,
                    initial_odometer: vehicle.initial_odometer,
                    last_odometer: vehicle.last_odometer ?? null,
                    expected_kml: vehicle.expected_kml,
                    conduction_sticker: vehicle.conduction_sticker ?? null,
                    is_active: vehicle.is_active,
                    reg_certification: vehicle.reg_certification ?? null,
                    or_number: vehicle.or_number ?? null,
                    registration_expiry: vehicle.registration_expiry
                        ? new Date(vehicle.registration_expiry)
                        : null,
                    insurance_expiry: vehicle.insurance_expiry
                        ? new Date(vehicle.insurance_expiry)
                        : null,
                    driver_id_: vehicle.driver_id_ ?? null,
                    deleted_at: vehicle.deleted_at
                        ? new Date(vehicle.deleted_at)
                        : null,
                },
                create: {
                    id_: vehicle.id_,
                    plate_number: vehicle.plate_number,
                    year: vehicle.year,
                    initial_odometer: vehicle.initial_odometer,
                    last_odometer: vehicle.last_odometer ?? null,
                    expected_kml: vehicle.expected_kml,
                    conduction_sticker: vehicle.conduction_sticker ?? null,
                    is_active: vehicle.is_active,
                    reg_certification: vehicle.reg_certification ?? null,
                    or_number: vehicle.or_number ?? null,
                    registration_expiry: vehicle.registration_expiry
                        ? new Date(vehicle.registration_expiry)
                        : null,
                    insurance_expiry: vehicle.insurance_expiry
                        ? new Date(vehicle.insurance_expiry)
                        : null,
                    driver_id_: vehicle.driver_id_ ?? null,
                    created_at: new Date(vehicle.created_at),
                    deleted_at: vehicle.deleted_at
                        ? new Date(vehicle.deleted_at)
                        : null,
                },
            });
        }
        console.log(`[sync] vehicles synced: ${vehicles.length} records`);
    } catch (err) {
        console.error("[sync] vehicles failed:", err.message);
    }
}

// Sync function that runs all sync tasks in parallel
async function runSync() {
    console.log("[sync] starting sync...");

    // Pre-fetch token once so parallel syncs all reuse the same one
    try {
        await getAccessToken();
    } catch (err) {
        console.error("[sync] login failed, aborting sync:", err.message);
        return;
    }

    await Promise.allSettled([syncFuelLogs(), syncTrips(), syncVehicles()]);
    console.log("[sync] sync complete");
}

// Sync every 10 minutes
export function startSyncScheduler() {
    runSync();
    cron.schedule("*/10 * * * *", runSync);
}
