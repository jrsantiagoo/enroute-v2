import { test, expect, vi } from "vitest";
import { createModelSource } from "../../../src/services/smart-notifications/model-source.js";
import { predictionsToLog } from "../../../src/services/smart-notifications/model-monitoring.js";
import { createHistoryRepository } from "../../../src/services/smart-notifications/history-repository.js";
import { createNotificationHub } from "../../../src/services/smart-notifications/notification-hub.js";
import {
    NOTIFICATION_CONFIG,
    NOW,
    HOUR,
    makeHistory,
    makeRepository,
    makePrisma,
    makeProviders,
    makeClock,
} from "./fixtures.js";
import { makeModel } from "./model-fixtures.js";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function fileWith(model) {
    const path = join(mkdtempSync(join(tmpdir(), "src-")), "model.json");
    writeFileSync(path, JSON.stringify(model));
    return path;
}

const withVersion = (version, options) => ({
    ...makeModel(options),
    trainedAt: version,
});

test("model source prefers the active registry row, then the file, then nothing", async () => {
    const fromDb = withVersion("db-1");
    const fromFile = withVersion("file-1");
    const filePath = fileWith(fromFile);
    const findFirst = vi.fn(async () => ({ artifact: fromDb }));

    const source = createModelSource({
        prisma: { modelRun: { findFirst } },
        filePath,
    });
    expect((await source.get()).trainedAt).toBe("db-1");
    expect(findFirst.mock.calls[0][0].where).toEqual({ status: "active" });

    // No active row: the committed file is used.
    const emptyRegistry = createModelSource({
        prisma: { modelRun: { findFirst: async () => null } },
        filePath,
    });
    expect((await emptyRegistry.get()).trainedAt).toBe("file-1");

    // A row that is not a valid model is ignored, and tables that are not migrated yet do not matter.
    const invalid = createModelSource({
        prisma: {
            modelRun: { findFirst: async () => ({ artifact: { x: 1 } }) },
        },
        filePath,
    });
    expect((await invalid.get()).trainedAt).toBe("file-1");
    const noTable = createModelSource({ prisma: {}, filePath });
    expect((await noTable.get()).trainedAt).toBe("file-1");

    const nothing = createModelSource({
        prisma: {},
        filePath: "/no/such/file",
    });
    expect(await nothing.get()).toBeNull();
});

test("model source caches for an hour, so a promotion is picked up within an hour", async () => {
    const clock = makeClock(NOW);
    let active = withVersion("v1");
    const findFirst = vi.fn(async () => ({ artifact: active }));
    const source = createModelSource({
        prisma: { modelRun: { findFirst } },
        filePath: "/no/such/file",
        clock: () => clock.time,
    });

    expect((await source.get()).trainedAt).toBe("v1");
    active = withVersion("v2");
    clock.advance(59 * 60 * 1000);
    expect((await source.get()).trainedAt).toBe("v1");
    expect(findFirst).toHaveBeenCalledTimes(1);
    clock.advance(2 * 60 * 1000);
    expect((await source.get()).trainedAt).toBe("v2");
});

test("model source survives a registry failure and retries within 5 minutes", async () => {
    const clock = makeClock(NOW);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    let fail = true;
    const findFirst = vi.fn(async () => {
        if (fail) throw new Error("connection lost");
        return { artifact: withVersion("db-1") };
    });
    const source = createModelSource({
        prisma: { modelRun: { findFirst } },
        filePath: fileWith(withVersion("file-1")),
        clock: () => clock.time,
    });

    expect((await source.get()).trainedAt).toBe("file-1");
    fail = false;
    clock.advance(6 * 60 * 1000);
    expect((await source.get()).trainedAt).toBe("db-1");
    warn.mockRestore();
});

const dates = ["2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13"];
const live = (precip = {}) => ({
    weather: {
        daily: Object.fromEntries(
            dates.map((d) => [d, { precipMm: precip[d] ?? 0 }]),
        ),
    },
});

test("predictions to log: late for the next 3 days, pace for today, nothing without live data or a usable model", () => {
    const rows = predictionsToLog(makeModel(), {
        todayKey: "2026-11-10",
        dates,
        events: [],
        live: live(),
    });
    expect(rows.map((r) => `${r.kind}:${r.targetDate}`)).toEqual([
        "late:2026-11-10",
        "late:2026-11-11",
        "late:2026-11-12",
        "pace:2026-11-10",
    ]);
    // Quiet days are recorded too, which calibration needs.
    expect(rows[0].predicted).toBeLessThan(0.2);
    expect(rows[2].predicted).toBeGreaterThan(0.7);

    const base = { todayKey: "2026-11-10", dates, events: [] };
    expect(predictionsToLog(makeModel(), { ...base, live: null })).toEqual([]);
    expect(predictionsToLog(null, { ...base, live: live() })).toEqual([]);
    expect(
        predictionsToLog(makeModel({ paceUsable: false, lateUsable: false }), {
            ...base,
            live: live(),
        }),
    ).toEqual([]);
});

// Minimal stand-in for the PredictionLog delegate.
function makePredictionPrisma() {
    const rows = [];
    const matches = (r, w) =>
        r.kind === w.kind &&
        r.target_date.getTime() === w.target_date.getTime() &&
        r.model_version === w.model_version;
    return {
        rows,
        predictionLog: {
            updateMany: async ({ where, data }) => {
                const hits = rows.filter(
                    (r) => matches(r, where) && r.resolved_at == null,
                );
                hits.forEach((r) => Object.assign(r, data));
                return { count: hits.length };
            },
            createMany: async ({ data, skipDuplicates }) => {
                for (const row of data)
                    if (!(skipDuplicates && rows.some((r) => matches(r, row))))
                        rows.push({ resolved_at: null, ...row });
            },
        },
    };
}

test("saving predictions refreshes unresolved rows and never touches resolved ones", async () => {
    const prisma = makePredictionPrisma();
    const repo = createHistoryRepository(prisma);
    const row = (predicted) => ({
        kind: "late",
        targetDate: "2026-11-12",
        predicted,
    });

    await repo.savePredictions([row(0.5)], "v1");
    await repo.savePredictions([row(0.6)], "v1");
    expect(prisma.rows).toHaveLength(1);
    expect(prisma.rows[0].predicted).toBe(0.6);

    prisma.rows[0].resolved_at = new Date();
    await repo.savePredictions([row(0.9)], "v1");
    expect(prisma.rows).toHaveLength(1);
    expect(prisma.rows[0].predicted).toBe(0.6);

    await repo.savePredictions([row(0.4)], "v2");
    expect(prisma.rows).toHaveLength(2);
});

function setupHub({ model, savePredictions }) {
    const clock = makeClock(NOW);
    const repository = {
        ...makeRepository({
            ...makeHistory(),
            active: [{ id: "a1", remainingStops: 12 }],
        }),
        savePredictions,
    };
    const state = { model };
    const hub = createNotificationHub({
        prisma: makePrisma(),
        repository,
        providers: makeProviders(),
        config: NOTIFICATION_CONFIG,
        getModel: async () => state.model,
        clock: clock.now,
    });
    return { clock, state, hub };
}

const load = (hub) =>
    hub.getNotifications({ managerId: "m1", surface: "dashboard" });

test("the hub records predictions with the model version, and a failure never breaks the notifications", async () => {
    const saved = [];
    const { hub } = setupHub({
        model: withVersion("v1"),
        savePredictions: async (rows, version) => saved.push({ rows, version }),
    });
    await load(hub);
    expect(saved.length).toBeGreaterThan(0);
    expect(saved[0].version).toBe("v1");
    expect(saved[0].rows.some((r) => r.kind === "late")).toBe(true);

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const broken = setupHub({
        model: withVersion("v1"),
        savePredictions: async () => {
            throw new Error("relation PredictionLog does not exist");
        },
    });
    const result = await load(broken.hub);
    expect(result.future.length).toBeGreaterThan(0);
    warn.mockRestore();
});

test("promoting a different model replaces cached notifications immediately", async () => {
    const { hub, state } = setupHub({
        model: withVersion("v1"),
        savePredictions: async () => {},
    });
    const first = await load(hub);
    expect(
        first.future.some((n) => n.key.startsWith("future:late-risk:")),
    ).toBe(true);

    // Rolled back to no model: statistics-only rules take over without waiting 24 hours.
    state.model = null;
    const second = await load(hub);
    expect(
        second.future.some((n) => n.key.startsWith("future:late-risk:")),
    ).toBe(false);
});
