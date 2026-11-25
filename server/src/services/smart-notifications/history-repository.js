import { cutoffAt, dateKeyOf, dayOfWeekOf } from "./time-utils.js";

// Turns raw trips into the derived fields the rules use.
// Trips without a start and end time, or without stops, are dropped so they cannot distort pace or late-finish rates.
export function enrichTrips(rawTrips, dailyWeather, eventDates, config) {
    const rainByDate = new Map(
        dailyWeather.map((w) => [w.dateKey, w.precipMm]),
    );

    return rawTrips
        .filter(
            (t) =>
                t.startedAt &&
                t.completedAt &&
                t.stops > 0 &&
                t.completedAt > t.startedAt,
        )
        .map((trip) => {
            const dateKey = dateKeyOf(trip.startedAt);
            const durationMin = (trip.completedAt - trip.startedAt) / 60000;
            const precipMm = rainByDate.get(dateKey);

            return {
                ...trip,
                dateKey,
                dayOfWeek: dayOfWeekOf(dateKey),
                durationMin,
                minPerStop: durationMin / trip.stops,
                fuelPer100:
                    trip.distanceKm > 0 && trip.fuelLiters != null
                        ? (trip.fuelLiters / trip.distanceKm) * 100
                        : null,
                late: trip.completedAt > cutoffAt(dateKey, config.workEndHour),
                // Null means there is no rainfall record for that day, so the trip is left out of rainy-versus-dry comparisons.
                rainy:
                    precipMm == null
                        ? null
                        : precipMm >= config.thresholds.rainyDayMm,
                eventDay: eventDates.has(dateKey),
            };
        });
}

// This is the only file that reads the trip tables, so a schema change only ever needs to be fixed here.
// NOTE: Trip start is departed_at and trip end is completed_at. Trips missing either are dropped later in enrichTrips.
// NOTE: Distance is the planned route distance, because the schema stores no driven distance per trip.
// NOTE: The schema stores fuel per vehicle refill (fuel_log), not per trip, so fuelLiters is null.
// NOTE: With no fuelLiters, the fuel comparison in forecast-rain.js is skipped and the rest of that notification still works.
export function createHistoryRepository(prisma) {
    const toDateKey = (date) => date.toISOString().slice(0, 10);

    return {
        // Returns [{ id, startedAt, completedAt, stops, distanceKm, fuelLiters, driverId, vehicleId }].
        async loadCompletedTrips(since) {
            const trips = await prisma.trip.findMany({
                where: {
                    status: "COMPLETED",
                    deleted_at: null,
                    departed_at: { not: null },
                    completed_at: { gte: since },
                },
                select: {
                    id_: true,
                    departed_at: true,
                    completed_at: true,
                    driver_id_: true,
                    vehicle_id_: true,
                    route: {
                        select: {
                            totalDistanceKm: true,
                            _count: { select: { stops: true } },
                        },
                    },
                    _count: { select: { orders: true } },
                },
            });

            return trips.map((t) => ({
                id: t.id_,
                startedAt: t.departed_at,
                completedAt: t.completed_at,
                // Orders are the deliveries. A trip with no orders falls back to the stops on its route.
                stops: t._count.orders || t.route?._count.stops || 0,
                distanceKm: t.route?.totalDistanceKm ?? null,
                fuelLiters: null,
                driverId: t.driver_id_,
                vehicleId: t.vehicle_id_,
            }));
        },

        // Returns [{ id, remainingStops }]. Orders that are still PENDING or PROCESSING count as remaining stops.
        async loadActiveTrips() {
            const trips = await prisma.trip.findMany({
                where: { status: "PROCESSING", deleted_at: null },
                select: {
                    id_: true,
                    orders: {
                        where: { status: { in: ["PENDING", "PROCESSING"] } },
                        select: { id_: true },
                    },
                },
            });

            return trips.map((t) => ({
                id: t.id_,
                remainingStops: t.orders.length,
            }));
        },

        // The methods below use the SmartNotificationDismissal, DailyWeather, KnownEvent and PredictionLog tables and need no changes.
        async loadDailyWeather(since) {
            const rows = await prisma.dailyWeather.findMany({
                where: { date: { gte: since } },
            });
            return rows.map((r) => ({
                dateKey: toDateKey(r.date),
                precipMm: r.precip_mm,
            }));
        },

        async saveDailyWeather(rows) {
            await prisma.$transaction(
                rows.map((r) =>
                    prisma.dailyWeather.upsert({
                        where: { date: new Date(r.dateKey) },
                        create: {
                            date: new Date(r.dateKey),
                            precip_mm: r.precipMm,
                        },
                        update: { precip_mm: r.precipMm },
                    }),
                ),
            );
        },

        // Records what the models predicted so ml/monitor.py can later compare it with what happened.
        // A prediction is refreshed until its day is resolved, then left alone.
        async savePredictions(rows, modelVersion) {
            for (const row of rows) {
                const where = {
                    kind: row.kind,
                    target_date: new Date(row.targetDate),
                    model_version: modelVersion,
                };
                const updated = await prisma.predictionLog.updateMany({
                    where: { ...where, resolved_at: null },
                    data: { predicted: row.predicted },
                });
                if (updated.count === 0)
                    await prisma.predictionLog.createMany({
                        data: [{ ...where, predicted: row.predicted }],
                        skipDuplicates: true,
                    });
            }
        },

        async loadKnownEvents(fromKey, toKey) {
            const rows = await prisma.knownEvent.findMany({
                where: {
                    date: { gte: new Date(fromKey), lte: new Date(toKey) },
                },
            });
            return rows.map((r) => ({
                date: toDateKey(r.date),
                name: r.name,
                kind: r.kind,
            }));
        },
    };
}
