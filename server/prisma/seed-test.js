// QA test-data seed — loads the canonical data set defined in docs/qa/test-db.md
// so manual executions and e2e runs start from the same known state (RMS-67).
//
// Destructive: wipes orders, trips, stops, routes, fuel logs, and drivers before
// re-inserting the seed set. Never point it at the production Supabase project.
// Run from server/:  npm run seed:test -- --yes   (or set SEED_TEST_CONFIRM=yes)

import "../env.js";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const prisma = new PrismaClient();

function requireConfirmation() {
    const confirmed =
        process.argv.includes("--yes") ||
        process.env.SEED_TEST_CONFIRM === "yes";

    let host = "(unparseable DATABASE_URL)";
    try {
        host = new URL(process.env.DATABASE_URL).host;
    } catch {}

    console.log(`Target database: ${host}`);

    if (!confirmed) {
        console.error(
            "Refusing to run: this wipes orders, trips, routes, fuel logs, and drivers.",
        );
        console.error(
            "Re-run with --yes (or SEED_TEST_CONFIRM=yes) against a TEST database only.",
        );
        process.exit(1);
    }
}

// Monday 00:00 local of the week containing `date`
function mondayOfWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 = Sun
    d.setDate(d.getDate() - ((day + 6) % 7));
    return d;
}

function at(date, hours, minutes = 0) {
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
}

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

async function wipe() {
    // FK-safe order: orders → trips → routes (stops cascade) → fuel logs → drivers
    await prisma.order.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.stop.deleteMany();
    await prisma.route.deleteMany();
    await prisma.fuel_log.deleteMany();
    await prisma.agent_profile.deleteMany();
}

async function seed() {
    const today = new Date();
    const monday = mondayOfWeek(today);

    // --- Drivers D-01..D-05 (test-db.md "Drivers") ---
    const driverIds = ["D-01", "D-02", "D-03", "D-04", "D-05"];
    const drivers = {};
    for (const [i, driverId] of driverIds.entries()) {
        drivers[driverId] = await prisma.agent_profile.create({
            data: {
                driver_id: driverId,
                contact_number: `0917-000-00${i + 1}`,
                license_number: `N01-23-4567${i + 1}`,
            },
        });
    }

    // --- Routes ---
    const baselineRoute = await prisma.route.create({
        data: {
            name: "QA Baseline Route",
            totalDistanceKm: 3.4,
            totalDurationMinutes: 14,
            vehicleType: "van",
            stops: {
                create: [
                    {
                        name: "De La Salle University",
                        address: "2401 Taft Ave, Malate, Manila",
                        lat: 14.5647,
                        lng: 120.993,
                        order: 1,
                    },
                    {
                        name: "Rizal Park",
                        address: "Roxas Blvd, Ermita, Manila",
                        lat: 14.5826,
                        lng: 120.9787,
                        order: 2,
                    },
                ],
            },
        },
    });

    const singleStopRoute = await prisma.route.create({
        data: {
            name: "QA Single-Stop Route",
            totalDistanceKm: 0,
            totalDurationMinutes: 0,
            vehicleType: "van",
            stops: {
                create: [
                    {
                        name: "Makati CBD",
                        address: "Ayala Ave, Makati",
                        lat: 14.5547,
                        lng: 121.0244,
                        order: 1,
                    },
                ],
            },
        },
    });

    // --- Trips (test-db.md "Routes and trips") ---
    const completedToday = await prisma.trip.create({
        data: {
            route_id_: baselineRoute.id_,
            driver_id_: drivers["D-01"].id_,
            status: "COMPLETED",
            tag_type: "ASSIGNED",
            scheduled_date: at(today, 8),
            departed_at: at(today, 8, 15),
            completed_at: at(today, 11, 30),
        },
    });

    const pendingToday = await prisma.trip.create({
        data: {
            route_id_: baselineRoute.id_,
            driver_id_: drivers["D-02"].id_,
            status: "PENDING",
            tag_type: "ASSIGNED",
            scheduled_date: at(today, 14),
        },
    });

    await prisma.trip.create({
        data: {
            route_id_: baselineRoute.id_,
            status: "PENDING",
            tag_type: "OPEN",
            scheduled_date: at(today, 16),
        },
    });

    // One COMPLETED trip per weekday (Mon-Fri), D-01/D-02 alternating,
    // for the weekly report case 4-2.
    const weekdayTrips = [];
    for (let i = 0; i < 5; i++) {
        const day = addDays(monday, i);
        weekdayTrips.push(
            await prisma.trip.create({
                data: {
                    route_id_: baselineRoute.id_,
                    driver_id_: drivers[i % 2 === 0 ? "D-01" : "D-02"].id_,
                    status: "COMPLETED",
                    tag_type: "ASSIGNED",
                    scheduled_date: at(day, 9),
                    departed_at: at(day, 9, 10),
                    completed_at: at(day, 12),
                },
            }),
        );
    }

    // --- Orders: 3 COMPLETED + 1 PENDING this week (delivery success 75%) ---
    // QA- prefix keeps clear of the app's generated ORD-YYYYMMDD-### ids.
    const orderSeeds = [
        { n: 1, status: "COMPLETED", trip: weekdayTrips[0], dayOffset: 0 },
        { n: 2, status: "COMPLETED", trip: weekdayTrips[1], dayOffset: 1 },
        { n: 3, status: "COMPLETED", trip: completedToday, dayOffset: 2 },
        { n: 4, status: "PENDING", trip: pendingToday, dayOffset: 2 },
    ];
    for (const o of orderSeeds) {
        const orderedOn = at(addDays(monday, o.dayOffset), 7);
        await prisma.order.create({
            data: {
                order_id: `QA-ORD-00${o.n}`,
                client: `QA Client ${o.n}`,
                destination: "Rizal Park, Manila",
                ordered_on: orderedOn,
                delivered_by:
                    o.status === "COMPLETED"
                        ? at(addDays(monday, o.dayOffset), 12)
                        : null,
                package_content: "QA test package",
                package_size: "medium",
                package_weight: 2.5,
                status: o.status,
                trip_id_: o.trip.id_,
            },
        });
    }

    // --- Fuel logs: 50 km / 10 L and 100 km / 8 L (test-db.md numbers) ---
    // All-time baseline = avg(5, 12.5) = 8.75 km/L; week actual = 150/18 ≈ 8.33.
    // With 75% delivery success the weekly efficiency score is 85.12.
    const fuelSeeds = [
        {
            day: 0,
            odometer: 10050,
            distance: 50,
            liters: 10,
            pricePerLiter: 60,
        },
        {
            day: 1,
            odometer: 10150,
            distance: 100,
            liters: 8,
            pricePerLiter: 60,
        },
    ];
    const baselineKmPerL = 10;
    for (const [i, f] of fuelSeeds.entries()) {
        const efficiency = f.distance / f.liters;
        const totalPrice = f.liters * f.pricePerLiter;
        await prisma.fuel_log.create({
            data: {
                log_date: at(addDays(monday, f.day), 18),
                odometer_reading: f.odometer,
                liters_added: f.liters,
                price_per_liter: f.pricePerLiter,
                total_price: totalPrice,
                distance_traveled: f.distance,
                fuel_efficiency: efficiency,
                cost_per_km: totalPrice / f.distance,
                variance_percentage:
                    ((efficiency - baselineKmPerL) / baselineKmPerL) * 100,
                needs_attention: efficiency < baselineKmPerL,
                driver_id_: drivers[i % 2 === 0 ? "D-01" : "D-02"].id_,
                notes: "QA seed",
            },
        });
    }

    return { baselineRoute, singleStopRoute };
}

async function main() {
    requireConfirmation();
    await wipe();
    const { baselineRoute, singleStopRoute } = await seed();

    console.log("Seeded QA test data set (docs/qa/test-db.md):");
    console.log("  drivers    5  (D-01 … D-05)");
    console.log(`  routes     2  ("${baselineRoute.name}", "${singleStopRoute.name}")`);
    console.log("  trips      8  (completed today, pending today, unassigned, Mon-Fri completed)");
    console.log("  orders     4  (3 COMPLETED + 1 PENDING → 75% delivery success)");
    console.log("  fuel logs  2  (50 km/10 L, 100 km/8 L → weekly efficiency 85.12)");
}

main()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
