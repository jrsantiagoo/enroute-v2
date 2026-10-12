import { test, expect, Page } from '@playwright/test';

const METRICS = [
  'Successful Trips',
  'Efficiency',
  'Completed Orders',
  'Average Distance per Order (km)',
  'Average Fuel Usage per Order (L)',
] as const;

async function openDateRange(page: Page) {
  const trigger = page
    .locator('button')
    .filter({ hasText: /^(Today|This Week|This Month|This Year|All Time)$/ })
    .first();
  const heading = page.getByRole('heading', { name: 'Date Range' });
  // Retry the click: React may not have attached handlers on the first attempt.
  await expect(async () => {
    await trigger.click();
    await expect(heading).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
}

async function dismissPopover(page: Page) {
  await page.getByRole('heading', { name: 'Dashboard' }).click();
  await expect(page.getByRole('heading', { name: 'Date Range' })).toBeHidden();
}

test.describe('Live Dashboard', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('5-1 the dashboard loads with its title, controls and every metric panel', async ({
    page,
  }) => {
    await expect(page.getByText('Performance metrics and analytics')).toBeVisible();

    for (const label of METRICS) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }

    await expect(page.getByRole('button', { name: 'Full Summary' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Date Range' })).toHaveCount(0);
  });

  test('5-3 every stat card renders a numeric value', async ({ page }) => {
    const values = page.locator('p.text-3xl');
    await expect(values).toHaveCount(4);

    for (let i = 0; i < 4; i += 1) {
      await expect(values.nth(i)).toHaveText(/\d/);
    }

  });

  test('5-4 the efficiency card shows a period-over-period comparison', async ({ page }) => {
    await expect(page.getByText(/compared to (yesterday|last week|last month|last year)/)).toBeVisible();
  });

  test('5-5 the comparison subtitle is hidden when the range has no comparable period', async ({
    page,
  }) => {
    await openDateRange(page);
    await page.getByRole('button', { name: 'All Time', exact: true }).click();
    await dismissPopover(page);

    await expect(page.getByText(/compared to/)).toHaveCount(0);
    await expect(page.getByText('Efficiency', { exact: true })).toBeVisible();
  });

  test('5-6 switching the date-range preset updates the active range label', async ({ page }) => {
    await openDateRange(page);
    await page.getByRole('button', { name: 'This Month', exact: true }).click();
    await dismissPopover(page);

    await expect(
      page
        .locator('button')
        .filter({ hasText: /^This Month$/ })
        .first(),
    ).toBeVisible();
    await expect(page.getByText('Successful Trips', { exact: true })).toBeVisible();
  });

  test('5-7 both analytics charts render with their legends', async ({ page }) => {
    await expect(page.getByText('Average Distance per Order (km)', { exact: true })).toBeVisible();
    await expect(page.getByText('Average Fuel Usage per Order (L)', { exact: true })).toBeVisible();
    await expect(page.locator('.recharts-responsive-container')).toHaveCount(2);
    await expect(page.getByText('Trend (3-day avg)').first()).toBeVisible();
  });

  test('5-8 the orders table renders on the dashboard', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
  });

  test('5-9 the date-range popover closes when clicking outside it', async ({ page }) => {
    await openDateRange(page);
    await page.getByRole('heading', { name: 'Dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Date Range' })).toBeHidden();
  });

  test('5-10 selecting a preset closes the date-range popover', async ({ page }) => {
    await openDateRange(page);
    await page.getByRole('button', { name: 'Today', exact: true }).click();

    await expect(
      page.getByRole('heading', { name: 'Date Range' }),
    ).toBeHidden({ timeout: 5_000 });
  });

  test.fixme(
    '5-2 metrics update in real time after a delivery is completed (no manual refresh)',
    async () => {},
  );

  // Blocked: DD-10/RMS-103 — no urgency stat cards exist on the dashboard.
  test.fixme('5-12 shows urgency stat cards ("N trips coming soon", "N orders unassigned")', async () => {});

  // Blocked: DD-10/RMS-103 — no projected fuel/distance impact figure exists.
  test.fixme('5-13 shows a projected fuel/distance impact figure for upcoming trips', async () => {});

  // Blocked: DD-11/RMS-104 — package size is still a raw value, not a category.
  test.fixme('5-14 shows package size as a category (S/M/L/XL) in the orders table', async () => {});

  // Blocked: DD-11/RMS-104 — destination is unstructured free text.
  test.fixme('5-15 shows destination in a structured City, Region format', async () => {});
});
