import { test, expect } from "vitest";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
    loadModel,
    predictPace,
    predictLate,
} from "../../../src/services/smart-notifications/model-scorer.js";
import { runFuture } from "../../../src/services/smart-notifications/engine.js";
import { cutoffRisk } from "../../../src/services/smart-notifications/rules/cutoff-risk.js";
import { NOTIFICATION_CONFIG, NOW } from "./fixtures.js";
import { makeModel, FEATURES } from "./model-fixtures.js";

const dates = ["2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13"];

test("pace and late predictions follow the exported coefficients", () => {
    const model = makeModel();
    // Pace: 28 + 4 * (25 - 5) / 10 = 36 for a 25 mm day.
    expect(predictPace(model, { dayOfWeek: 2, precipMm: 25 })).toBeCloseTo(36);
    // Rain forecast missing: falls back to the training mean, so the effect is zero.
    expect(predictPace(model, { dayOfWeek: 2 })).toBeCloseTo(28);
    // Late: sigmoid(-2 + 3) on a Thursday, sigmoid(-2) otherwise.
    expect(predictLate(model, { dayOfWeek: 4 }).probability).toBeCloseTo(
        1 / (1 + Math.exp(-1)),
    );
    expect(predictLate(model, { dayOfWeek: 2 }).probability).toBeCloseTo(
        1 / (1 + Math.exp(2)),
    );
    expect(predictLate(model, { dayOfWeek: 4 }).factors).toEqual([
        "a Thursday",
    ]);
});

test("an unusable or missing model predicts nothing", () => {
    expect(predictPace(null, { dayOfWeek: 1 })).toBeNull();
    expect(
        predictPace(makeModel({ paceUsable: false }), { dayOfWeek: 1 }),
    ).toBeNull();
    expect(
        predictLate(makeModel({ lateUsable: false }), { dayOfWeek: 4 }),
    ).toBeNull();
});

test("loadModel returns null for a missing or broken file instead of throwing", () => {
    const dir = mkdtempSync(join(tmpdir(), "model-"));
    expect(loadModel(join(dir, "missing.json"))).toBeNull();
    const broken = join(dir, "broken.json");
    writeFileSync(broken, "{not json");
    expect(loadModel(broken)).toBeNull();
    const good = join(dir, "good.json");
    writeFileSync(good, JSON.stringify(makeModel()));
    expect(loadModel(good).features).toHaveLength(FEATURES.length);
});

const futureContext = (model) => ({
    trips: [],
    dates,
    events: [],
    live: null,
    config: NOTIFICATION_CONFIG,
    model,
});

test("late-risk warns about the weekday the model flags, and the weekday rule steps aside", () => {
    const { items } = runFuture(futureContext(makeModel()));
    const risk = items.filter((n) => n.key.startsWith("future:late-risk:"));
    expect(risk).toHaveLength(1);
    expect(risk[0].key).toBe("future:late-risk:2026-11-12");
    expect(risk[0].message).toContain("73%");
    expect(risk[0].message).toContain("a Thursday");
    expect(risk[0].basis).toContain("trained on 120 trips");
    expect(items.some((n) => n.key.startsWith("future:weekday:"))).toBe(false);
});

test("without a usable late model the weekday statistics rule is used instead", () => {
    const { items, insufficient } = runFuture(
        futureContext(makeModel({ lateUsable: false })),
    );
    expect(items.some((n) => n.key.startsWith("future:late-risk:"))).toBe(
        false,
    );
    expect(insufficient.map((n) => n.topic)).toContain(
        "Weekday late-finish pattern",
    );
});

test("cutoff-risk uses the model's pace when usable, and the plain average otherwise", () => {
    const trips = Array.from({ length: 20 }, () => ({ minPerStop: 20 }));
    const context = (model) => ({
        now: NOW,
        todayKey: "2026-11-10",
        trips,
        active: [{ remainingStops: 10 }],
        events: [],
        config: NOTIFICATION_CONFIG,
        live: {
            weather: { daily: { "2026-11-10": { precipMm: 25 } } },
            traffic: { avgRatio: 1 },
        },
        model,
    });
    const withModel = cutoffRisk(context(makeModel())).items[0];
    expect(withModel.message).toContain("expected 36 min per stop");
    expect(withModel.basis).toContain("pace model trained on 120 trips");

    const without = cutoffRisk(context(null)).items[0];
    expect(without.message).toContain("usual 20 min per stop");
});
