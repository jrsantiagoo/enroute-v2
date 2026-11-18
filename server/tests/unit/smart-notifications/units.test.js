import { test, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isMaterialChange } from "../../../src/services/smart-notifications/materiality.js";
import { philippineHolidays } from "../../../src/services/smart-notifications/holidays.js";
import {
    addDays,
    dayOfWeekOf,
    manilaParts,
    cutoffAt,
} from "../../../src/services/smart-notifications/time-utils.js";

test("time helpers use Asia/Manila", () => {
    expect(manilaParts(new Date("2026-11-09T17:00:00Z")).dateKey).toBe(
        "2026-11-10",
    );
    expect(dayOfWeekOf("2026-11-10")).toBe(2);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(cutoffAt("2026-11-10", 18).toISOString()).toBe(
        "2026-11-10T10:00:00.000Z",
    );
});

test("holiday calendar: Holy Week 2026, National Heroes Day, fixed dates", () => {
    const byName = Object.fromEntries(
        philippineHolidays(2026).map((h) => [h.name, h.date]),
    );
    expect(byName["Maundy Thursday"]).toBe("2026-04-02");
    expect(byName["Good Friday"]).toBe("2026-04-03");
    expect(byName["Black Saturday"]).toBe("2026-04-04");
    expect(byName["National Heroes Day"]).toBe("2026-08-31");
    expect(byName["Independence Day"]).toBe("2026-06-12");
});

test("material change: severity always counts; a metric needs both the percent and its own step", () => {
    const current = { severity: "medium", metric: 100, metricStep: 15 };
    expect(
        isMaterialChange({ severity: "high", metric: 100 }, current, 25),
    ).toBe(true);
    expect(
        isMaterialChange({ severity: "medium", metric: 90 }, current, 25),
    ).toBe(false);
    expect(
        isMaterialChange({ severity: "medium", metric: 70 }, current, 25),
    ).toBe(true);
    expect(
        isMaterialChange(
            { severity: "medium", metric: 2 },
            { severity: "medium", metric: 6, metricStep: 15 },
            25,
        ),
    ).toBe(false);
    expect(
        isMaterialChange(
            { severity: "info", metric: null },
            { severity: "info", metric: null },
            25,
        ),
    ).toBe(false);
});

test("advisory only: the module never writes to trips, routes, orders, vehicles or drivers", () => {
    const walk = (dir) =>
        readdirSync(dir).flatMap((f) =>
            statSync(join(dir, f)).isDirectory()
                ? walk(join(dir, f))
                : [join(dir, f)],
        );
    const srcRoot = fileURLToPath(new URL("../../../src", import.meta.url));
    const files = [
        ...walk(join(srcRoot, "services", "smart-notifications")),
        join(srcRoot, "services", "smart-notification-service.js"),
        join(srcRoot, "controllers", "smart-notification-controller.js"),
        join(srcRoot, "routes", "smart-notification-routes.js"),
    ].filter((f) => f.endsWith(".js"));
    const writes =
        /\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\(/;
    const allowed = /smartNotificationDismissal|dailyWeather/;

    for (const file of files) {
        for (const line of readFileSync(file, "utf8").split("\n")) {
            if (/prisma\.\w+\.\w+/.test(line) && writes.test(line))
                expect(line, `${file}: ${line.trim()}`).toMatch(allowed);
        }
    }
});
