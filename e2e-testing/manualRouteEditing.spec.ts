import { test, expect, Page } from '@playwright/test';
import { stubOsrm } from './osrm-stub';

const METRIC_PATTERN = /\d+(?:\.\d+)?\s*(?:km|m)\s*·/;

type MockStop = {
  id_: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  order: number;
};

type MockRoute = {
  id_: string;
  name: string;
  stops: MockStop[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  vehicleType: string;
  createdAt: string;
  archivedAt: string | null;
};

const store: { routes: MockRoute[] } = { routes: [] };

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function installRouteApiMock(page: Page) {
  await page.route('**/api/routes', async (route) => {
    const request = route.request();

    if (request.method() === 'POST') {
      const body = JSON.parse(request.postData() ?? '{}');
      const created: MockRoute = {
        id_: newId('srv-route'),
        name: body.name,
        stops: (body.stops ?? []).map((s: MockStop, i: number) => ({
          id_: newId(`srv-stop-${i}`),
          name: s.name,
          address: s.address,
          lat: s.lat,
          lng: s.lng,
          order: i,
        })),
        totalDistanceKm: body.totalDistanceKm ?? 0,
        totalDurationMinutes: body.totalDurationMinutes ?? 0,
        vehicleType: body.vehicleType ?? 'car',
        createdAt: new Date().toISOString(),
        archivedAt: null,
      };
      store.routes.push(created);
      await route.fulfill(json({ success: true, data: created }));
      return;
    }

    await route.fulfill(json({ success: true, data: store.routes }));
  });

  await page.route('**/api/routes/archive/*', async (route) => {
    const id = decodeURIComponent(route.request().url().split('/').pop() ?? '');
    const found = store.routes.find((r) => r.id_ === id);
    if (found) found.archivedAt = new Date().toISOString();
    await route.fulfill(json({ success: true, data: found ?? null }));
  });

  await page.route('**/api/routes/unarchive/*', async (route) => {
    const id = decodeURIComponent(route.request().url().split('/').pop() ?? '');
    const found = store.routes.find((r) => r.id_ === id);
    if (found) found.archivedAt = null;
    await route.fulfill(json({ success: true, data: found ?? null }));
  });
}

async function waitForPage(page: Page) {
  await expect(page.getByRole('heading', { name: 'Route Creation' })).toBeVisible({
    timeout: 30_000,
  });
}

async function openEditor(page: Page) {
  await page.getByRole('button', { name: 'Create New Route' }).click();
  await expect(page.getByRole('heading', { name: 'Create Route' })).toBeVisible();
  await expect(page.getByText('De La Salle University')).toBeVisible();
  await expect(page.getByText('Rizal Park')).toBeVisible();
}

async function addStop(page: Page, stopName: string) {
  await page.getByRole('button', { name: /Add a stop/ }).click();
  await page.getByRole('button', { name: new RegExp(stopName) }).click();
  await expect(page.getByText(stopName)).toBeVisible();
}

test.describe('Manual Route Editing', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    store.routes = [];
    await installRouteApiMock(page);
    await stubOsrm(page);
    await page.goto('/route-tool');
    await waitForPage(page);
    await page.evaluate(() => localStorage.removeItem('acesoft_savedRoutes'));
    await page.reload();
    await waitForPage(page);
  });

  test('2-1 adds a delivery stop and recalculates the route metrics', async ({ page }) => {
    await openEditor(page);
    await addStop(page, 'Makati CBD');

    const headerMetrics = page
      .getByText('Route Plan', { exact: true })
      .locator('xpath=following-sibling::span');
    await expect(headerMetrics).toHaveText(METRIC_PATTERN, { timeout: 30_000 });
  });

  test('2-1b a new stop is inserted before the destination, keeping the end stop last', async ({
    page,
  }) => {
    await openEditor(page);
    await addStop(page, 'Makati CBD');

    const panel = page
      .getByText('Route Plan', { exact: true })
      .locator('xpath=ancestor::div[1]/following-sibling::div[1]');
    const stopText = await panel.innerText();

    expect(stopText.indexOf('Makati CBD')).toBeGreaterThan(-1);
    expect(stopText.indexOf('Makati CBD')).toBeLessThan(stopText.indexOf('Rizal Park'));
  });

  test('2-2 removes a stop and updates the route', async ({ page }) => {
    await openEditor(page);
    await page.getByRole('button', { name: 'Remove Rizal Park' }).click();
    await expect(page.getByText('Rizal Park')).toBeHidden();
  });

  test('2-4 an edited route is saved and reloads with its edits intact', async ({ page }) => {
    const routeName = `QA e2e save ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    await openEditor(page);
    await addStop(page, 'SM Mall of Asia');

    await page.getByRole('button', { name: 'Create Route', exact: true }).last().click();
    await page.locator('#route-name').fill(routeName);
    await page.getByRole('button', { name: 'Create Route', exact: true }).last().click();
    await expect(page.getByText('Route saved successfully.')).toBeVisible();

    await page.reload();
    await waitForPage(page);
    await expect(page.getByRole('cell', { name: routeName })).toBeVisible();

    await page.getByTitle('Edit route').first().click();
    await expect(page.getByRole('heading', { name: 'Edit Route' })).toBeVisible();
    await expect(page.getByText('SM Mall of Asia')).toBeVisible();
  });

  test('2-6 stops can be reordered from the keyboard', async ({ page }) => {
    await openEditor(page);
    await addStop(page, 'Makati CBD');

    const handles = page.getByRole('button', { name: 'Drag to reorder stop' });
    await expect(handles.first()).toBeVisible();

    const before = await page
      .getByText('Route Plan', { exact: true })
      .locator('xpath=ancestor::div[1]/following-sibling::div[1]')
      .innerText();

    await handles.nth(1).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');

    await expect
      .poll(
        async () =>
          page
            .getByText('Route Plan', { exact: true })
            .locator('xpath=ancestor::div[1]/following-sibling::div[1]')
            .innerText(),
        { timeout: 10_000 },
      )
      .not.toBe(before);
  });

  test('2-7 saving is blocked when fewer than two stops remain', async ({ page }) => {
    await openEditor(page);
    await page.getByRole('button', { name: 'Remove Rizal Park' }).click();
    await expect(page.getByText('Rizal Park')).toBeHidden();

    const save = page.getByRole('button', { name: 'Create Route', exact: true }).last();
    await expect(save).toBeDisabled();
    await expect(save).toHaveAttribute('title', 'Add at least two stops to save');
  });

  test('2-8 cancelling the editor discards the edits without saving', async ({ page }) => {
    await openEditor(page);
    await addStop(page, 'Makati CBD');

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Create Route' })).toBeHidden();
    await expect(page.getByText('No saved routes yet.')).toBeVisible();
  });

  test('2-9 the Escape key closes the editor', async ({ page }) => {
    await openEditor(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Create Route' })).toBeHidden();
  });

  test.fixme('2-3 reassigns a stop from Driver A to Driver B', async () => {});

  test('2-5 removing the final stop empties the editor, but the save guard still blocks it', async ({
    page,
  }) => {
    await openEditor(page);
    await page.getByRole('button', { name: 'Remove Rizal Park' }).click();
    await expect(page.getByText('Rizal Park')).toBeHidden();

    await page.getByRole('button', { name: 'Remove De La Salle University' }).click();
    await expect(page.getByText('De La Salle University')).toBeHidden();

    const save = page.getByRole('button', { name: 'Create Route', exact: true }).last();
    await expect(save).toBeDisabled();
  });

  // Blocked: DD-15/RMS-108 — the editor has no Revert/Undo action, only Cancel (discards
  // everything) and Done Editing (keeps everything).
  test.fixme('2-10 a revert action restores the pre-edit stop list', async () => {});
});
