// /api/smart-notifications through the real Express app, Prisma and the weather/traffic providers mocked
// Titles that start with a case number (18-8) implement that case in the STSWENG automation test plan.
import { it, expect, vi } from "vitest";
import request from "supertest";

// Every model and method exists and records its calls, so the test can see any write the feature makes.
const { prismaMock, calls } = vi.hoisted(() => {
    const calls = [];
    const models = new Map();
    const defaultResult = (method) => {
        if (method === "findMany" || method === "groupBy") return [];
        if (method.startsWith("find")) return null;
        if (method === "count") return 0;
        if (method.endsWith("Many")) return { count: 0 };
        return {};
    };
    const model = (name) => {
        if (!models.has(name)) {
            models.set(
                name,
                new Proxy(
                    {},
                    {
                        get: (_, method) => async () => {
                            calls.push({ model: name, method: String(method) });
                            return defaultResult(String(method));
                        },
                    },
                ),
            );
        }
        return models.get(name);
    };
    const prismaMock = new Proxy(
        {},
        {
            get: (_, prop) => {
                if (prop === "then") return undefined;
                if (prop === "$transaction")
                    return async (arg) =>
                        Array.isArray(arg) ? Promise.all(arg) : arg(prismaMock);
                if (typeof prop === "string" && prop.startsWith("$"))
                    return async () => [];
                return model(prop);
            },
        },
    );
    return { prismaMock, calls };
});

vi.mock("../../src/lib/prisma.js", () => ({ default: prismaMock }));

vi.mock("../../src/lib/supabase-client.js", () => ({
    default: {
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: "test-manager" } },
                error: null,
            }),
        },
    },
}));

vi.mock("../../src/services/smart-notifications/providers/weather-provider.js", async () => {
    const { makeProviders } = await import("../unit/smart-notifications/fixtures.js");
    const providers = makeProviders({ rainNow: 5 });
    return {
        fetchWeather: providers.weather,
        fetchDailyWeatherHistory: providers.dailyWeatherHistory,
    };
});

vi.mock("../../src/services/smart-notifications/providers/traffic-provider.js", async () => {
    const { makeProviders } = await import("../unit/smart-notifications/fixtures.js");
    return { fetchTraffic: makeProviders().traffic };
});

import app from "../../src/app.js";

const OPERATIONAL_MODELS = ["trip", "route", "stop", "order", "agent_profile", "vehicle"];
const READ_METHODS = /^(find|count|aggregate|groupBy)/;

// Calls are not reset per test: the warmup that runs when the app loads is part of the feature too.
it("18-8 returns notifications without writing trips, routes, orders, drivers or vehicles", async () => {
    const res = await request(app)
        .get("/api/smart-notifications")
        .query({ surface: "dashboard" })
        .set("Authorization", "Bearer good-token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("immediate");
    expect(res.body.data).toHaveProperty("future");

    const operationalCalls = calls.filter((c) => OPERATIONAL_MODELS.includes(c.model));
    expect(operationalCalls.length).toBeGreaterThan(0); // the history was read
    expect(operationalCalls.filter((c) => !READ_METHODS.test(c.method))).toEqual([]);
});
