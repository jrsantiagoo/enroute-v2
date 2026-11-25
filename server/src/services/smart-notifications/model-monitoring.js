import { dayOfWeekOf } from "./time-utils.js";
import {
    isLateModelUsable,
    isPaceModelUsable,
    predictLate,
    predictPace,
} from "./model-scorer.js";

// The predictions worth recording so they can later be compared with what happened (see ml/monitor.py).
// Late-finish chances are recorded for every day in the window, not only the days that produced a notification.
// Checking calibration needs the quiet days too. Pace is recorded for today only.
// Nothing is recorded without live data, because the rain forecast is an input and the check must compare like with like.
export function predictionsToLog(model, { todayKey, dates, events, live }) {
    if (!model || !live?.weather) return [];

    const eventDays = new Set(events.map((e) => e.date));
    const inputFor = (date) => ({
        dayOfWeek: dayOfWeekOf(date),
        precipMm: live.weather.daily[date]?.precipMm,
        eventDay: eventDays.has(date),
    });
    const rows = [];

    if (isLateModelUsable(model)) {
        for (const date of dates.slice(0, 3)) {
            rows.push({
                kind: "late",
                targetDate: date,
                predicted: predictLate(model, inputFor(date)).probability,
            });
        }
    }
    if (isPaceModelUsable(model) && dates.includes(todayKey)) {
        rows.push({
            kind: "pace",
            targetDate: todayKey,
            predicted: predictPace(model, inputFor(todayKey)),
        });
    }
    return rows;
}
