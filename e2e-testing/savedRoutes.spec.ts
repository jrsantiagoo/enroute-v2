import { test, expect, Page } from '@playwright/test';
import { stubOsrm } from './osrm-stub';

const STORAGE_KEY = 'acesoft_savedRoutes';

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

const SEED_STOPS = [
  {
    name: 'De La Salle University',
    address: '2401 Taft Ave, Malate, Manila 1004',
    lat: 14.5643,
    lng: 120.9938,
  },
  {
    name: 'Rizal Park',
    address: 'Roxas Blvd, Ermita, Manila 1000',
    lat: 14.5832,
    lng: 120.9794,
  },
];

const store: { routes: MockRoute[] } = { routes: [] };

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function uniqueName(prefix = 'QA route') {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function buildRoute(name: string, archived: boolean): MockRoute {
  return {
    id_: newId('srv-route'),
    name,
    stops: SEED_STOPS.map((s, i) => ({ id_: newId(`srv-stop-${i}`), ...s, order: i })),
    totalDistanceKm: 5.2,
    totalDurationMinutes: 18,
    vehicleType: 'car',
    createdAt: new Date().toISOString(),
    archivedAt: archived ? new Date().toISOString() : null,
  };
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

  await page.route('**/api/routes/update/*', async (route) => {
    const id = decodeURIComponent(route.request().url().split('/').pop() ?? '');
    const body = JSON.parse(route.request().postData() ?? '{}');
    const found = store.routes.find((r) => r.id_ === id);
    if (found) {
      found.name = body.name ?? found.name;
      found.stops = (body.stops ?? found.stops).map((s: MockStop, i: number) => ({
        id_: s.id_ ?? newId(`srv-stop-${i}`),
        name: s.name,
        address: s.address,
        lat: s.lat,
        lng: s.lng,
        order: i,
      }));
      found.totalDistanceKm = body.totalDistanceKm ?? found.totalDistanceKm;
      found.totalDurationMinutes = body.totalDurationMinutes ?? found.totalDurationMinutes;
    }
    await route.fulfill(json({ success: true, data: found ?? null }));
  });

  await page.route('**/api/routes/delete/*', async (route) => {
    const id = decodeURIComponent(route.request().url().split('/').pop() ?? '');
    store.routes = store.routes.filter((r) => r.id_ !== id);
    await route.fulfill(json({ success: true, data: null }));
  });
}

async function waitForPage(page: Page) {
  await expect(page.getByRole('heading', { name: 'Route Creation' })).toBeVisible({
    timeout: 30_000,
  });
}

async function seedRoute(page: Page, name: string, archived = false) {
  store.routes.push(buildRoute(name, archived));
  await page.reload();
  await waitForPage(page);
}

async function saveNewRoute(page: Page, name: string) {
  await page.getByRole('button', { name: 'Create New Route' }).click();
  await expect(page.getByText('Rizal Park')).toBeVisible();
  await page.getByRole('button', { name: 'Create Route', exact: true }).last().click();
  await page.locator('#route-name').fill(name);
  await page.getByRole('button', { name: 'Create Route', exact: true }).last().click();
}

test.describe('Saved Routes', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    store.routes = [];
    await installRouteApiMock(page);
    await stubOsrm(page);
    await page.goto('/route-tool');
    await waitForPage(page);
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
    await page.reload();
    await waitForPage(page);
  });

  test('SR-01 an empty route list shows the empty-state prompt', async ({ page }) => {
    await expect(page.getByText('No saved routes yet.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create New Route' })).toBeVisible();
  });

  test('SR-02 the saved-routes table renders all four column headers', async ({ page }) => {
    await seedRoute(page, uniqueName());
    for (const header of ['Route Name', 'Stops', 'Tags', 'Date Created']) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
    }
  });

  test('SR-03 Create New Route opens the editor seeded with the two default stops', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Create New Route' }).click();

    await expect(page.getByRole('heading', { name: 'Create Route' })).toBeVisible();
    await expect(page.getByText('De La Salle University')).toBeVisible();
    await expect(page.getByText('Rizal Park')).toBeVisible();
    await expect(page.getByText('Route Plan', { exact: true })).toBeVisible();
  });

  test('SR-04 the save dialog rejects an empty route name', async ({ page }) => {
    await page.getByRole('button', { name: 'Create New Route' }).click();
    await page.getByRole('button', { name: 'Create Route', exact: true }).last().click();

    await expect(page.getByRole('heading', { name: 'Name Your Route' })).toBeVisible();
    await page.locator('#route-name').fill('   ');
    await expect(page.getByText('Route name is required.')).toBeVisible();
  });

  test('SR-05 the save dialog rejects a duplicate name regardless of case', async ({ page }) => {
    const name = uniqueName();
    await seedRoute(page, name);

    await page.getByRole('button', { name: 'Create New Route' }).click();
    await page.getByRole('button', { name: 'Create Route', exact: true }).last().click();
    await page.locator('#route-name').fill(name.toUpperCase());

    await expect(
      page.getByText('A route with this name already exists. Please enter a different name.'),
    ).toBeVisible();
  });

  test('SR-06 creating a route saves it, toasts, and lists it in the table', async ({ page }) => {
    const name = uniqueName();
    await saveNewRoute(page, name);

    await expect(page.getByText('Route saved successfully.')).toBeVisible();
    await expect(page.getByRole('cell', { name })).toBeVisible();
  });

  test('SR-07 a saved route survives a full page reload', async ({ page }) => {
    const name = uniqueName();
    await seedRoute(page, name);

    await page.reload();
    await waitForPage(page);
    await expect(page.getByRole('cell', { name })).toBeVisible();
  });

  test('SR-08 editing a route reopens it in the editor and applies the rename', async ({ page }) => {
    const original = uniqueName('QA before');
    const renamed = uniqueName('QA after');
    await seedRoute(page, original);

    await page.getByTitle('Edit route').first().click();
    await expect(page.getByRole('heading', { name: 'Edit Route' })).toBeVisible();

    const save = page.getByRole('button', { name: 'Save Changes', exact: true });
    await expect(save.last()).toBeEnabled();
    await save.last().click();
    await page.locator('#route-name').fill(renamed);
    await save.last().click();

    await expect(page.getByText('Route saved successfully.')).toBeVisible();
    await expect(page.getByRole('cell', { name: renamed })).toBeVisible();
    await expect(page.getByRole('cell', { name: original })).toHaveCount(0);
  });

  test('SR-09 re-saving an edited route under its own name is allowed', async ({ page }) => {
    const name = uniqueName();
    await seedRoute(page, name);

    await page.getByTitle('Edit route').first().click();
    const save = page.getByRole('button', { name: 'Save Changes', exact: true });
    await expect(save.last()).toBeEnabled();
    await save.last().click();
    await expect(page.locator('#route-name')).toHaveValue(name);

    await expect(
      page.getByText('A route with this name already exists. Please enter a different name.'),
    ).toHaveCount(0);
  });

  test('SR-10 archiving a route removes it from the active list', async ({ page }) => {
    const name = uniqueName();
    await seedRoute(page, name);

    await page.getByTitle('Archive route').first().click();
    await expect(page.getByText('Route archived.')).toBeVisible();
    await expect(page.getByRole('cell', { name })).toHaveCount(0);
  });

  test('SR-11 an archived route appears under the archived tab and can be restored', async ({
    page,
  }) => {
    const name = uniqueName();
    await seedRoute(page, name, true);

    await page.getByRole('button', { name: 'archived' }).click();
    await expect(page.getByRole('cell', { name })).toBeVisible();

    await page.getByTitle('Restore route').first().click();
    await expect(page.getByText('Route unarchived.')).toBeVisible();

    await page.getByRole('button', { name: 'active' }).click();
    await expect(page.getByRole('cell', { name })).toBeVisible();
  });

  test('SR-12 the archived tab shows its own empty state when nothing is archived', async ({
    page,
  }) => {
    await seedRoute(page, uniqueName());
    await page.getByRole('button', { name: 'archived' }).click();
    await expect(page.getByText('No archived routes.')).toBeVisible();
  });

  test('SR-13 deleting a route requires confirmation and can be cancelled', async ({ page }) => {
    const name = uniqueName();
    await seedRoute(page, name);

    await page.getByTitle('Delete route').first().click();
    await expect(page.getByText('Delete route?')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('cell', { name })).toBeVisible();
  });

  test('SR-14 a confirmed delete removes the route and it does not return on reload', async ({
    page,
  }) => {
    const name = uniqueName();
    await seedRoute(page, name);

    await page.getByTitle('Delete route').first().click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText('Route deleted.')).toBeVisible();

    await page.reload();
    await waitForPage(page);
    await expect(page.getByRole('cell', { name })).toHaveCount(0);
  });

  test('SR-15 the search box filters saved routes by name', async ({ page, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'RMS-100: the filtered-out row stays visible on webkit. Reproduces live; closed as accepted.',
    );

    const keep = uniqueName('QA keepme');
    const hide = uniqueName('QA hideme');
    await seedRoute(page, keep);
    await seedRoute(page, hide);

    await page.getByPlaceholder('Search Route Name or Area/s…').fill('keepme');
    await expect(page.getByRole('cell', { name: keep })).toBeVisible();
    await expect(page.getByRole('cell', { name: hide })).toHaveCount(0);
  });

  test('SR-16 a search with no matches shows the no-results message', async ({ page }) => {
    await seedRoute(page, uniqueName());
    await page.getByPlaceholder('Search Route Name or Area/s…').fill('zzz-no-such-route-zzz');
    await expect(page.getByText('No routes match your search.')).toBeVisible();
  });

  test('SR-17 the refresh control re-reads saved routes from the server', async ({ page }) => {
    const name = uniqueName();
    store.routes.push(buildRoute(name, false));

    await page.getByRole('button', { name: 'Refresh saved routes' }).click();
    await expect(page.getByRole('cell', { name })).toBeVisible();
  });

  test('SR-18 saving a route sends the route to POST /api/routes', async ({ page }) => {
    const name = uniqueName();
    const postRequest = page
      .waitForRequest(
        (request) => request.url().includes('/api/routes') && request.method() === 'POST',
        { timeout: 15_000 },
      )
      .catch(() => null);

    await saveNewRoute(page, name);
    await expect(page.getByText('Route saved successfully.')).toBeVisible();

    const request = await postRequest;
    expect(request).not.toBeNull();
    expect(request?.postData() ?? '').toContain(name);
  });
});
