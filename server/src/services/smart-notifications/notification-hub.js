import { SURFACES } from "./constants.js";
import { manilaParts, addDays, dateKeyOf } from "./time-utils.js";
import { enrichTrips } from "./history-repository.js";
import { getEvents, yearOf } from "./holidays.js";
import { runImmediate, runFuture } from "./engine.js";
import { isMaterialChange } from "./materiality.js";
import { predictionsToLog } from "./model-monitoring.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Services in this app signal HTTP status through error.statusCode, so the hub does the same.
function requestError(statusCode, message) {
    return Object.assign(new Error(message), { statusCode });
}

// The hub is advisory only. The only rows it writes are SmartNotificationDismissal and (lazily) DailyWeather.
// It is built from injected parts so the tests can swap in fakes for the database, weather, traffic and clock.
// Results are cached per window, and a request recomputes immediate notifications once they are 5 minutes old.
// Future notifications are recomputed once they are 24 hours old (see NOTIFICATION_CONFIG.refreshMs).
export function createNotificationHub({
    prisma,
    repository,
    providers,
    config,
    model: fixedModel = null,
    getModel = async () => fixedModel,
    clock = () => new Date(),
}) {
    const cache = new Map();
    let predictionLogWarned = false;
    const inflight = new Map();

    // The dashboard looks a week ahead, while route planning only looks at the date of the trip being planned.
    function buildTarget(surface, dateText, now) {
        if (!SURFACES.includes(surface))
            throw requestError(
                400,
                `surface must be one of ${SURFACES.join(", ")}`,
            );

        const todayKey = manilaParts(now).dateKey;
        const dateKey = dateText ?? todayKey;
        if (!DATE_PATTERN.test(dateKey) || Number.isNaN(Date.parse(dateKey)))
            throw requestError(400, "date must be YYYY-MM-DD");
        if (dateKey < todayKey) throw requestError(400, "date is in the past");

        const dates =
            surface === "dashboard"
                ? Array.from(
                      { length: config.thresholds.holidayLookaheadDays },
                      (_, i) => addDays(todayKey, i),
                  )
                : [dateKey];

        return {
            surface,
            todayKey,
            dateKey,
            dates,
            isToday: dateKey === todayKey,
            cacheKey: `${surface === "dashboard" ? "overview" : "single"}:${dateKey}`,
        };
    }

    async function fetchLive(target, active) {
        try {
            const weather = await providers.weather(config.depot);
            const points = [
                config.depot,
                ...active
                    .filter((a) => a.lat != null && a.lng != null)
                    .map((a) => ({ lat: a.lat, lng: a.lng })),
            ];
            const traffic = target.isToday
                ? await providers.traffic(points)
                : null;
            return { ok: true, weather, traffic };
        } catch (error) {
            console.warn(
                "Smart notifications: live data unavailable:",
                error.message,
            );
            return { ok: false };
        }
    }

    // Fills in missing past days of rainfall lazily, so no scheduled job is needed. A failure here is not fatal.
    async function ensureDailyWeather(since, todayKey) {
        const have = await repository.loadDailyWeather(since);
        const haveKeys = new Set(have.map((r) => r.dateKey));
        const missing = [];
        for (
            let key = dateKeyOf(since);
            key < todayKey;
            key = addDays(key, 1)
        ) {
            if (!haveKeys.has(key)) missing.push(key);
        }
        if (!missing.length || !providers.dailyWeatherHistory) return have;

        try {
            const fetched = await providers.dailyWeatherHistory(
                config.depot,
                config.lookbackDays,
            );
            const rows = fetched.filter((r) => missing.includes(r.dateKey));
            if (rows.length) await repository.saveDailyWeather(rows);
            return [...have, ...rows];
        } catch (error) {
            console.warn(
                "Smart notifications: rainfall backfill failed:",
                error.message,
            );
            return have;
        }
    }

    async function refresh(target, now) {
        const entry = cache.get(target.cacheKey) ?? {
            immediate: null,
            future: null,
            liveOk: null,
            liveCheckedAt: 0,
            modelVersion: null,
        };
        const model = await getModel();
        // A newly promoted or rolled-back model replaces cached results straight away instead of after up to 24 hours.
        const modelChanged =
            entry.future != null &&
            entry.modelVersion !== (model?.trainedAt ?? null);
        const nowMs = now.getTime();
        const immediateDue =
            target.isToday &&
            (modelChanged ||
                !entry.immediate ||
                nowMs - entry.immediate.at >= config.refreshMs.immediate);
        const futureDue =
            modelChanged ||
            !entry.future ||
            nowMs - entry.future.at >= config.refreshMs.future;
        const retryDue =
            entry.liveOk === false &&
            nowMs - entry.liveCheckedAt >= config.refreshMs.immediate;
        if (!immediateDue && !futureDue && !retryDue) return;

        const since = new Date(nowMs - config.lookbackDays * 86400000);
        const [rawTrips, active, knownEvents] = await Promise.all([
            repository.loadCompletedTrips(since),
            target.isToday ? repository.loadActiveTrips() : [],
            repository.loadKnownEvents(target.todayKey, target.dates.at(-1)),
        ]);
        const live = await fetchLive(target, active);
        const recovered = live.ok && entry.liveOk === false;
        const recomputeFuture = futureDue || recovered;

        const dailyWeather =
            live.ok && recomputeFuture
                ? await ensureDailyWeather(since, target.todayKey)
                : await repository.loadDailyWeather(since);
        const events = getEvents(
            [yearOf(since), ...target.dates.map((d) => Number(d.slice(0, 4)))],
            knownEvents,
        );
        const trips = enrichTrips(
            rawTrips,
            dailyWeather,
            new Set(events.map((e) => e.date)),
            config,
        );
        const context = {
            now,
            todayKey: target.todayKey,
            dates: target.dates,
            active,
            trips,
            events,
            config,
            model,
            live: live.ok ? live : null,
        };

        entry.liveOk = live.ok;
        entry.liveCheckedAt = nowMs;
        entry.modelVersion = model?.trainedAt ?? null;

        // Immediate notifications are not computed at all while live data is down, because they are only useful if current.
        if (target.isToday && (immediateDue || recovered)) {
            entry.immediate = {
                at: nowMs,
                ...(live.ok
                    ? runImmediate(context)
                    : { items: [], insufficient: [] }),
            };
        }

        if (recomputeFuture) {
            if (live.ok) {
                entry.future = {
                    at: nowMs,
                    stale: false,
                    ...runFuture(context),
                };
            } else if (entry.future) {
                // Keeps the old results and the old timestamp, so "last updated" shows how old they really are.
                entry.future = { ...entry.future, stale: true };
            } else {
                entry.future = {
                    at: nowMs,
                    stale: true,
                    ...runFuture(context),
                };
            }
        } else if (!live.ok && entry.future) {
            entry.future.stale = true;
        }

        cache.set(target.cacheKey, entry);
        await logPredictions(context);
    }

    // Recording predictions is for monitoring only, so a failure here (for example the table is not migrated yet) never affects the notifications.
    async function logPredictions(context) {
        if (!repository.savePredictions || !context.model) return;
        try {
            const rows = predictionsToLog(context.model, context);
            if (rows.length)
                await repository.savePredictions(rows, context.model.trainedAt);
        } catch (error) {
            if (!predictionLogWarned)
                console.warn(
                    "Smart notifications: could not record predictions:",
                    error.message,
                );
            predictionLogWarned = true;
        }
    }

    // Concurrent requests for the same window share one refresh instead of each hitting the weather and traffic APIs.
    function refreshOnce(target, now) {
        if (!inflight.has(target.cacheKey)) {
            inflight.set(
                target.cacheKey,
                refresh(target, now).finally(() =>
                    inflight.delete(target.cacheKey),
                ),
            );
        }
        return inflight.get(target.cacheKey);
    }

    // Every current notification for a window, before this manager's dismissals are applied.
    async function getAll(target, now) {
        await refreshOnce(target, now);

        const entry = cache.get(target.cacheKey);
        const liveOk = entry.liveOk !== false;
        const stamp = (list, at, stale) =>
            list.map((n) => ({
                ...n,
                updatedAt: new Date(at).toISOString(),
                stale,
            }));

        const immediate =
            target.isToday && liveOk
                ? stamp(entry.immediate.items, entry.immediate.at, false)
                : [];
        const future = stamp(
            entry.future.items,
            entry.future.at,
            !!entry.future.stale,
        );
        const insufficient = [
            ...(target.isToday && liveOk ? entry.immediate.insufficient : []),
            ...entry.future.insufficient,
        ].filter(
            (n, i, all) => all.findIndex((x) => x.topic === n.topic) === i,
        );

        return { entry, liveOk, immediate, future, insufficient };
    }

    async function getNotifications({ managerId, surface, date }) {
        const now = clock();
        const target = buildTarget(surface, date, now);
        const all = await getAll(target, now);

        const dismissals = await prisma.smartNotificationDismissal.findMany({
            where: { manager_id_: managerId, surface },
        });
        const byKey = new Map(dismissals.map((d) => [d.notification_key, d]));
        const presentKeys = new Set(
            [...all.immediate, ...all.future].map((n) => n.key),
        );

        const applyDismissals = (list) =>
            list.flatMap((notification) => {
                const dismissal = byKey.get(notification.key);
                if (!dismissal) return [{ ...notification, updated: false }];
                return isMaterialChange(
                    dismissal,
                    notification,
                    config.thresholds.materialChangePct,
                )
                    ? [{ ...notification, updated: true }]
                    : [];
            });

        // Once a condition has cleared, its dismissal is removed so a later recurrence is shown fresh.
        // Only keys that were actually evaluated on this request are pruned.
        const cleared = dismissals.filter((d) => {
            if (presentKeys.has(d.notification_key)) return false;
            if (d.notification_key.startsWith("immediate:"))
                return target.isToday && all.liveOk;

            const day = d.notification_key.match(/\d{4}-\d{2}-\d{2}/)?.[0];
            return (
                day &&
                (day < target.todayKey ||
                    (!all.entry.future.stale && target.dates.includes(day)))
            );
        });
        if (cleared.length) {
            await prisma.smartNotificationDismissal.deleteMany({
                where: { id_: { in: cleared.map((d) => d.id_) } },
            });
        }

        return {
            generatedAt: now.toISOString(),
            liveAvailable: all.liveOk,
            immediate: applyDismissals(all.immediate),
            future: applyDismissals(all.future),
            insufficient: all.insufficient,
        };
    }

    // Dismisses on one surface only. Severity and metric come from the server's own current notification, never from the client.
    async function dismissNotification({ managerId, surface, date, key }) {
        const now = clock();
        const target = buildTarget(surface, date, now);
        const all = await getAll(target, now);

        const notification = [...all.immediate, ...all.future].find(
            (n) => n.key === key,
        );
        if (!notification)
            throw requestError(
                404,
                "Notification not found. It may have just changed.",
            );

        const values = {
            severity: notification.severity,
            metric: notification.metric,
            dismissed_at: now,
        };
        await prisma.smartNotificationDismissal.upsert({
            where: {
                dismissal_scope: {
                    manager_id_: managerId,
                    surface,
                    notification_key: key,
                },
            },
            create: {
                manager_id_: managerId,
                surface,
                notification_key: key,
                ...values,
            },
            update: values,
        });
    }

    // Keeps the dashboard window warm so it is never older than the refresh intervals, even when nobody is looking.
    function startWarmup() {
        const tick = () =>
            refreshOnce(
                buildTarget("dashboard", undefined, clock()),
                clock(),
            ).catch((error) =>
                console.warn(
                    "Smart notifications: warmup failed:",
                    error.message,
                ),
            );
        tick();
        return setInterval(tick, config.refreshMs.immediate).unref();
    }

    return { getNotifications, dismissNotification, startWarmup };
}
