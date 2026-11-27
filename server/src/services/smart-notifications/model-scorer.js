import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DAY_NAMES } from "./time-utils.js";

export const DEFAULT_MODEL_PATH = fileURLToPath(
    new URL("./model/model.json", import.meta.url),
);

const MIN_PACE_MINUTES = 5;
const MIN_FACTOR_EFFECT = 0.15;

// Loads the file written by ml/train.py. It never throws: a missing or broken file simply means the rules fall back to plain statistics.
export function loadModel(path = DEFAULT_MODEL_PATH) {
    try {
        const model = JSON.parse(readFileSync(path, "utf8"));
        return isValidModel(model) ? model : null;
    } catch (error) {
        if (error.code !== "ENOENT")
            console.warn(
                "Smart notifications: model file unreadable, using statistics only:",
                error.message,
            );
        return null;
    }
}

// Guards against a registry row or file that is not a model this code can score.
export function isValidModel(model) {
    return (
        Array.isArray(model?.features) &&
        model.pace?.coef?.length === model.features.length &&
        model.late?.coef?.length === model.features.length &&
        model.defaults != null &&
        model.limits != null
    );
}

export const isPaceModelUsable = (model) => model?.pace?.usable === true;
export const isLateModelUsable = (model) => model?.late?.usable === true;

// Builds the values in the same order ml/train.py trained on. Anything unknown falls back to a neutral value.
// A missing rainfall forecast uses the training average, so it pushes the prediction neither up nor down.
function featureValues(model, input) {
    const mean = (name) => model.pace.mean[model.features.indexOf(name)];
    const precip = Math.min(
        input.precipMm ?? mean("precip_mm"),
        model.limits.maxPrecipMm,
    );
    const values = {
        precip_mm: precip,
        rainy:
            input.precipMm == null
                ? mean("rainy")
                : Number(precip >= model.limits.rainyDayMm),
        event_day: Number(Boolean(input.eventDay)),
        stops: input.stops ?? model.defaults.stops,
        depart_hour: input.departHour ?? model.defaults.depart_hour,
    };
    for (let d = 0; d < 7; d++)
        values[`dow_${d}`] = Number(input.dayOfWeek === d);
    return model.features.map((name) => values[name]);
}

// Each factor's contribution is its standardised value times its weight, so the sum plus the intercept is the model's raw output.
function score(part, model, input) {
    const values = featureValues(model, input);
    const contributions = values.map(
        (value, i) => (part.coef[i] * (value - part.mean[i])) / part.scale[i],
    );
    return {
        raw: part.intercept + contributions.reduce((a, b) => a + b, 0),
        contributions,
    };
}

const FACTOR_LABELS = {
    precip_mm: "forecast rain",
    rainy: "a rainy day",
    event_day: "a holiday or event",
    stops: "the number of stops",
    depart_hour: "the departure time",
};

function labelFor(name) {
    if (name.startsWith("dow_")) return `a ${DAY_NAMES[Number(name.slice(4))]}`;
    return FACTOR_LABELS[name] ?? name;
}

// Minutes per stop, or null when the pace model is missing or not good enough to use.
export function predictPace(model, input) {
    if (!isPaceModelUsable(model)) return null;
    return Math.max(MIN_PACE_MINUTES, score(model.pace, model, input).raw);
}

// Probability (0 to 1) of finishing after 6 PM, plus the factors that pushed it up, or null when the model is not usable.
export function predictLate(model, input) {
    if (!isLateModelUsable(model)) return null;
    const { raw, contributions } = score(model.late, model, input);
    const factors = model.features
        .map((name, i) => ({ name, effect: contributions[i] }))
        .filter((f) => f.effect >= MIN_FACTOR_EFFECT)
        .sort((a, b) => b.effect - a.effect)
        .slice(0, 2)
        .map((f) => labelFor(f.name));
    return { probability: 1 / (1 + Math.exp(-raw)), factors };
}

// A sentence a manager can read to judge how far to trust the model.
export function modelBasis(model, part) {
    const { trips, from, to } = model.trainedOn;
    const { error, baselineError } = model[part].metrics;
    const measure =
        part === "pace"
            ? `average miss ${error.toFixed(1)} min per stop against ${baselineError.toFixed(1)} for a plain average`
            : `error score ${error.toFixed(2)} against ${baselineError.toFixed(2)} for a plain average (lower is better)`;
    return `trained on ${trips} trips, ${from} to ${to}; on trips it had not seen, ${measure}`;
}
