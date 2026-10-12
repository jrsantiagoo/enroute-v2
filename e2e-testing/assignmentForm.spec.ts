import { test, expect, Page } from '@playwright/test';

const PLACEHOLDERS = {
  route: 'Select a route',
  purpose: 'Select purpose',
  driver: 'Select a driver',
  vehicle: 'Select a vehicle',
} as const;

async function openForm(page: Page) {
  await page.getByRole('button', { name: 'New Assignment' }).click();
  await expect(page.getByRole('heading', { name: 'Create new assignment' })).toBeVisible();
}

async function openSelect(page: Page, label: string) {
  await page.getByRole('button', { name: label, exact: true }).click();
}

test.describe('Assignment Form', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/assignment');
    await expect(page.getByRole('heading', { name: 'Route Assignment' })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('AS-01 the page opens on the calendar view with all three toggles present', async ({
    page,
  }) => {
    await expect(page.getByRole('button', { name: 'Calendar' })).toHaveClass(/bg-primary/);
    await expect(page.getByRole('button', { name: 'Table' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Driver', exact: true })).toBeVisible();
  });

  test('AS-02 switching between calendar, table and driver views updates the active toggle', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Table' }).click();
    await expect(page.getByRole('button', { name: 'Table' })).toHaveClass(/bg-primary/);
    await expect(page.getByRole('button', { name: 'Calendar' })).not.toHaveClass(/bg-primary/);

    await page.getByRole('button', { name: 'Driver', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Driver', exact: true })).toHaveClass(
      /bg-primary/,
    );

    await page.getByRole('button', { name: 'Calendar' }).click();
    await expect(page.getByRole('button', { name: 'Calendar' })).toHaveClass(/bg-primary/);
  });

  test('AS-03 the assignment modal exposes date, route, driver, vehicle and notes', async ({
    page,
  }) => {
    await openForm(page);

    await expect(page.locator('input[type="date"]')).toBeVisible();
    for (const placeholder of [PLACEHOLDERS.route, PLACEHOLDERS.driver, PLACEHOLDERS.vehicle]) {
      await expect(page.getByRole('button', { name: placeholder, exact: true })).toBeVisible();
    }
    await expect(page.getByPlaceholder('Any special instructions')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
  });

  test('AS-04 the scheduled date defaults to today', async ({ page }) => {
    await openForm(page);
    const today = new Date().toISOString().split('T')[0];
    await expect(page.locator('input[type="date"]')).toHaveValue(today);
  });

  test('AS-05 Create stays disabled until route, driver and date are all set', async ({
    page,
  }) => {
    await openForm(page);
    const create = page.getByRole('button', { name: 'Create' });
    await expect(create).toBeDisabled();

    await openSelect(page, PLACEHOLDERS.driver);
    await page.locator('div.absolute button').first().click();
    await expect(page.getByRole('button', { name: PLACEHOLDERS.driver, exact: true })).toHaveCount(0);
    await expect(create, 'driver and date without a route is not enough').toBeDisabled();
  });

  test('AS-06 clearing the scheduled date re-disables Create', async ({ page }) => {
    await openForm(page);
    await page.locator('input[type="date"]').fill('');
    await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  // Blocked: purpose select was removed from assignment-form-modal.tsx; needs a rewrite against the route/driver selects.
  test.fixme('AS-07 purpose offers exactly General and Delivery', async ({ page }) => {
    await openForm(page);
    await openSelect(page, PLACEHOLDERS.purpose);

    await expect(page.getByRole('button', { name: 'General', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delivery', exact: true })).toBeVisible();
  });

  // Blocked: purpose select was removed from assignment-form-modal.tsx; needs a rewrite against the route/driver selects.
  test.fixme('AS-08 choosing a purpose replaces the placeholder with the chosen value', async ({
    page,
  }) => {
    await openForm(page);
    await openSelect(page, PLACEHOLDERS.purpose);
    await page.getByRole('button', { name: 'General', exact: true }).click();

    await expect(page.getByRole('button', { name: PLACEHOLDERS.purpose, exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'General', exact: true })).toBeVisible();
  });

  test('AS-09 the driver dropdown is populated from the drivers API', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    const apiResponse = await page.request.get('http://localhost:8080/api/drivers', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const drivers: Array<{ driver_id: string }> = (await apiResponse.json()).data ?? [];
    test.skip(drivers.length === 0, 'No drivers seeded — run npm run seed:test first.');

    await openForm(page);
    await openSelect(page, PLACEHOLDERS.driver);
    await expect(
      page.getByRole('button', { name: drivers[0].driver_id, exact: true }),
    ).toBeVisible();
  });

  // Blocked: purpose select was removed from assignment-form-modal.tsx; needs a rewrite against the route/driver selects.
  test.fixme('AS-10 Cancel closes the modal and discards the entered values', async ({ page }) => {
    await openForm(page);
    await openSelect(page, PLACEHOLDERS.purpose);
    await page.getByRole('button', { name: 'General', exact: true }).click();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Create new assignment' })).toBeHidden();

    await openForm(page);
    await expect(
      page.getByRole('button', { name: PLACEHOLDERS.purpose, exact: true }),
    ).toBeVisible();
  });

  test('AS-11 clicking the backdrop closes the modal', async ({ page }) => {
    await openForm(page);
    await page.locator('div.fixed.inset-0.z-50').click({ position: { x: 5, y: 5 } });
    await expect(page.getByRole('heading', { name: 'Create new assignment' })).toBeHidden();
  });

  test('AS-12 the vehicle dropdown lists vehicles, not route names', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    const routesResponse = await page.request.get('http://localhost:8080/api/routes', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const routes: Array<{ name: string }> = (await routesResponse.json()).data ?? [];
    test.skip(routes.length === 0, 'No routes in the API — cannot demonstrate the mix-up.');

    await openForm(page);
    await openSelect(page, PLACEHOLDERS.vehicle);
    await expect(
      page.getByRole('button', { name: routes[0].name, exact: true }),
    ).toHaveCount(0);
  });

  test('AS-13 the notes field is transmitted with the created trip', async ({ page }) => {
    await page.route('**/api/trips', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { id_: 'qa-intercepted', status: 'PENDING' } }),
        });
        return;
      }
      await route.continue();
    });

    await openForm(page);
    await page.getByPlaceholder('Any special instructions').fill('QA notes probe');

    const requestBody = page.waitForRequest(
      (request) => request.url().includes('/api/trips') && request.method() === 'POST',
    );

    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    const [driversResponse, routesResponse] = await Promise.all([
      page.request.get('http://localhost:8080/api/drivers', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      page.request.get('http://localhost:8080/api/routes', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);
    const drivers = (await driversResponse.json()).data ?? [];
    const routes = (await routesResponse.json()).data ?? [];
    test.skip(
      drivers.length === 0 || routes.length === 0,
      'Needs at least one seeded driver and one API route.',
    );

    await openSelect(page, PLACEHOLDERS.route);
    await page.getByRole('button', { name: routes[0].name, exact: true }).click();
    await openSelect(page, PLACEHOLDERS.driver);
    await page.getByRole('button', { name: drivers[0].driver_id, exact: true }).click();

    await page.getByRole('button', { name: 'Create' }).click();

    const request = await requestBody;
    expect(
      request.postData() ?? '',
    ).toContain('QA notes probe');
  });

  test('AS-14 a route created in Route Creation is selectable in the assignment form', async ({
    page,
  }) => {
    const routeName = `QA link probe ${Date.now()}`;
    const token = await page.evaluate(() => localStorage.getItem('access_token'));

    const createResponse = await page.request.post('http://localhost:8080/api/routes', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: routeName,
        stops: [],
        totalDistanceKm: 0,
        totalDurationMinutes: 0,
        vehicleType: 'car',
      },
    });
    test.skip(!createResponse.ok(), 'Route Creation API rejected the probe route.');

    await page.goto('/assignment');
    await expect(page.getByRole('heading', { name: 'Route Assignment' })).toBeVisible({
      timeout: 30_000,
    });
    await openForm(page);
    await openSelect(page, PLACEHOLDERS.route);

    await expect(
      page.getByRole('button', { name: routeName, exact: true }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test.fixme(
    'AS-15 a scheduled trip can be deleted from the table view',
    async () => {},
  );

  // Blocked: DD-09/RMS-102 — the date input has no `min`, so past dates are selectable.
  test.fixme('AS-16 rejects scheduling a trip on a past date', async () => {});

  // Blocked: DD-09/RMS-102 — there is no delivery time-of-day field at all.
  test.fixme('AS-17 enforces a 9am-5pm delivery time window', async () => {});
});
