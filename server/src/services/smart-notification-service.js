import prisma from "../lib/prisma.js";
import { NOTIFICATION_CONFIG } from "./smart-notifications/constants.js";
import { createNotificationHub } from "./smart-notifications/notification-hub.js";
import { createHistoryRepository } from "./smart-notifications/history-repository.js";
import {
    fetchWeather,
    fetchDailyWeatherHistory,
} from "./smart-notifications/providers/weather-provider.js";
import { createModelSource } from "./smart-notifications/model-source.js";
import { fetchTraffic } from "./smart-notifications/providers/traffic-provider.js";

// The model comes from the active row in the ModelRun registry, rechecked hourly, and otherwise from model.json (see ml/README.md).
// With neither, the notifications use plain statistics only.
const modelSource = createModelSource({
    prisma,
    filePath: process.env.SMART_NOTIFICATIONS_MODEL_PATH || undefined,
});
const hub = createNotificationHub({
    prisma,
    getModel: () => modelSource.get(),
    repository: createHistoryRepository(prisma),
    config: NOTIFICATION_CONFIG,
    providers: {
        weather: (depot) => fetchWeather(depot),
        dailyWeatherHistory: (depot, days) =>
            fetchDailyWeatherHistory(depot, days),
        traffic: (points) => fetchTraffic(points, process.env.TOMTOM_API_KEY),
    },
});

export function getSmartNotifications(managerId, surface, date) {
    return hub.getNotifications({ managerId, surface, date });
}

export function dismissSmartNotification(managerId, surface, key, date) {
    return hub.dismissNotification({ managerId, surface, key, date });
}

// Call once at server start so the dashboard cache is refreshed even when nobody has the page open.
export function startSmartNotificationWarmup() {
    return hub.startWarmup();
}
