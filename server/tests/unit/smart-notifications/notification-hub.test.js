import { test, expect } from "vitest";
import { createNotificationHub } from "../../../src/services/smart-notifications/notification-hub.js";
import {
    NOTIFICATION_CONFIG,
    NOW,
    MIN,
    HOUR,
    makeHistory,
    makeRepository,
    makePrisma,
    makeProviders,
    makeClock,
} from "./fixtures.js";

const MANAGER = "manager-1";

function setup({
    active = [{ id: "a1", remainingStops: 12 }],
    providerOptions = {},
    history = makeHistory(),
    events = [],
} = {}) {
    const clock = makeClock(NOW);
    const prisma = makePrisma();
    const providers = makeProviders(providerOptions);
    const repository = makeRepository({ ...history, active, events });
    const hub = createNotificationHub({
        prisma,
        repository,
        providers,
        config: NOTIFICATION_CONFIG,
        clock: clock.now,
    });
    return { clock, prisma, providers, repository, hub };
}

const keysOf = (list) => list.map((n) => n.key);
const load = (hub, surface = "dashboard", date) =>
    hub.getNotifications({ managerId: MANAGER, surface, date });

test("every notification has text, suggestions, a data basis and an updatedAt", async () => {
    const { hub } = setup({
        providerOptions: { forecastRainDate: "2026-11-11" },
        events: [
            { date: "2026-11-12", name: "Test Parade", kind: "special event" },
        ],
    });
    const result = await load(hub);

    expect(result.liveAvailable).toBe(true);
    expect(result.future.some((n) => n.title.includes("Test Parade"))).toBe(
        true,
    );
    expect(result.immediate.length).toBeGreaterThan(0);
    expect(result.future.length).toBeGreaterThan(0);
    for (const n of result.immediate) expect(n.kind).toBe("immediate");
    for (const n of result.future) expect(n.kind).toBe("future");

    for (const n of [...result.immediate, ...result.future]) {
        expect(n.title, n.key).toBeTruthy();
        expect(n.message, n.key).toBeTruthy();
        expect(n.basis, n.key).toBeTruthy();
        expect(n.updatedAt, n.key).toBeTruthy();
        expect(
            n.message,
            `Message should start with a capital: ${n.key}`,
        ).toMatch(/^[A-Z]/);
        expect(n.suggestions.length, n.key).toBeGreaterThan(0);
        for (const s of n.suggestions) expect(s.label, n.key).toBeTruthy();
    }
    expect(
        result.immediate.find((n) => n.key === "immediate:cutoff-risk").basis,
    ).toMatch(/based on 120 trips across 2 drivers/);
});

test("projects a 6 PM overrun for active routes", async () => {
    const { hub } = setup();
    const result = await load(hub);
    const cutoff = result.immediate.find(
        (n) => n.key === "immediate:cutoff-risk",
    );

    expect(cutoff.severity).toBe("high");
    expect(cutoff.metric).toBeGreaterThan(0);
});

test("immediate refreshes after 5 minutes, future only after 24 hours", async () => {
    const { hub, providers, clock } = setup({
        events: [{ date: "2026-11-12", name: "Test Parade", kind: "event" }],
    });
    await load(hub);
    expect(providers.calls.traffic).toBe(1);

    clock.advance(4 * MIN);
    await load(hub);
    expect(providers.calls.traffic, "no refresh inside 5 minutes").toBe(1);

    clock.advance(1 * MIN);
    const result = await load(hub);
    expect(providers.calls.traffic, "refresh at 5 minutes").toBe(2);
    expect(result.future.length).toBeGreaterThan(0);
    expect(result.immediate.length).toBeGreaterThan(0);
    expect(new Date(result.immediate[0].updatedAt).getTime()).toBeGreaterThan(
        NOW.getTime(),
    );
    expect(new Date(result.future[0].updatedAt).getTime()).toBe(NOW.getTime());

    clock.advance(24 * HOUR);
    const later = await load(hub);
    expect(new Date(later.future[0].updatedAt).getTime()).toBeGreaterThan(
        NOW.getTime() + 23 * HOUR,
    );
});

test("live data down hides immediate, keeps future marked stale with its old timestamp, and recovers", async () => {
    const { hub, providers, clock } = setup({
        providerOptions: { forecastRainDate: "2026-11-11" },
    });
    const before = await load(hub);
    expect(before.future.some((n) => n.key.startsWith("future:rain"))).toBe(
        true,
    );

    providers.down = true;
    clock.advance(6 * MIN);
    const down = await load(hub);
    expect(down.liveAvailable).toBe(false);
    expect(down.immediate).toEqual([]);
    expect(down.future.length).toBeGreaterThan(0);
    expect(down.future.every((n) => n.stale === true)).toBe(true);
    expect(down.future[0].updatedAt).toBe(before.future[0].updatedAt);

    providers.down = false;
    clock.advance(6 * MIN);
    const back = await load(hub);
    expect(back.liveAvailable).toBe(true);
    expect(back.immediate.length).toBeGreaterThan(0);
    expect(back.future.every((n) => n.stale === false)).toBe(true);
});

test("live data down on first load: no immediate, future from history and calendar only, marked stale", async () => {
    const { hub } = setup({
        providerOptions: { down: true },
        events: [{ date: "2026-11-12", name: "Test Parade", kind: "event" }],
    });
    const result = await load(hub);

    expect(result.liveAvailable).toBe(false);
    expect(result.immediate.length).toBe(0);
    expect(result.future.some((n) => n.title.includes("Test Parade"))).toBe(
        true,
    );
    expect(result.future.every((n) => n.stale)).toBe(true);
});

test("a dismissal applies only to the surface it was made on", async () => {
    const { hub } = setup();
    await hub.dismissNotification({
        managerId: MANAGER,
        surface: "dashboard",
        key: "immediate:cutoff-risk",
    });

    const dashboard = await load(hub, "dashboard");
    const planning = await load(hub, "route_planning");
    expect(keysOf(dashboard.immediate)).not.toContain("immediate:cutoff-risk");
    expect(keysOf(planning.immediate)).toContain("immediate:cutoff-risk");

    await hub.dismissNotification({
        managerId: "someone-else",
        surface: "dashboard",
        key: "immediate:cutoff-risk",
    });
    const again = await load(hub, "dashboard");
    expect(keysOf(again.immediate)).not.toContain("immediate:cutoff-risk");
});

test("a dismissed notification returns marked updated after a material change, not after a small one", async () => {
    const { hub, providers, clock } = setup();
    providers.ratio = 1.6;
    clock.advance(6 * MIN);
    const first = await load(hub);
    expect(keysOf(first.immediate)).toContain("immediate:traffic");

    await hub.dismissNotification({
        managerId: MANAGER,
        surface: "dashboard",
        key: "immediate:traffic",
    });

    providers.ratio = 1.7;
    clock.advance(6 * MIN);
    const small = await load(hub);
    expect(keysOf(small.immediate)).not.toContain("immediate:traffic");

    providers.ratio = 2.4;
    clock.advance(6 * MIN);
    const big = await load(hub);
    const traffic = big.immediate.find((n) => n.key === "immediate:traffic");
    expect(traffic).toBeTruthy();
    expect(traffic.updated).toBe(true);
});

test("a cleared condition removes its dismissal, so a recurrence shows fresh and not as updated", async () => {
    const { hub, providers, clock } = setup();
    providers.ratio = 1.6;
    await load(hub);
    await hub.dismissNotification({
        managerId: MANAGER,
        surface: "dashboard",
        key: "immediate:traffic",
    });

    providers.ratio = 1.0;
    clock.advance(6 * MIN);
    await load(hub);

    providers.ratio = 1.6;
    clock.advance(6 * MIN);
    const result = await load(hub);
    const traffic = result.immediate.find((n) => n.key === "immediate:traffic");
    expect(traffic).toBeTruthy();
    expect(traffic.updated).toBe(false);
});

test("not enough history says so instead of recommending", async () => {
    const { hub } = setup({
        history: makeHistory(2, 1),
        providerOptions: { rainNow: 5 },
    });
    const result = await load(hub);

    expect(result.immediate.length).toBe(0);
    expect(result.insufficient.length).toBeGreaterThan(0);
    expect(result.insufficient.every((n) => n.have < n.need)).toBe(true);
});

test("route planning follows the planned date and has no immediate notifications for a future day", async () => {
    const { hub } = setup({
        providerOptions: { forecastRainDate: "2026-11-13" },
    });

    const dashboard = await load(hub);
    expect(keysOf(dashboard.future)).not.toContain("future:rain:2026-11-13");

    const planning = await load(hub, "route_planning", "2026-11-13");
    expect(keysOf(planning.future)).toContain("future:rain:2026-11-13");
    expect(planning.immediate.length).toBe(0);
});

test("flags a Philippine holiday inside the dashboard window", async () => {
    const { hub, clock } = setup();
    clock.time = new Date("2026-06-10T09:00:00+08:00").getTime();

    const result = await load(hub);
    expect(
        result.future.some((n) => n.title.startsWith("Independence Day")),
    ).toBe(true);
});

test("rejects bad input with a statusCode the controller can use", async () => {
    const { hub } = setup();
    await expect(load(hub, "nope")).rejects.toMatchObject({ statusCode: 400 });
    await expect(
        load(hub, "route_planning", "2020-01-01"),
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(load(hub, "route_planning", "tomorrow")).rejects.toMatchObject(
        { statusCode: 400 },
    );
    await expect(
        hub.dismissNotification({
            managerId: MANAGER,
            surface: "dashboard",
            key: "immediate:made-up",
        }),
    ).rejects.toMatchObject({ statusCode: 404 });
});
