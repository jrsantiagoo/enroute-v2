import { test, expect, Page, Route } from '@playwright/test';
import { stubOsrm } from './osrm-stub';

// Suite 18: Smart Recommendations (issue #4). Titles that start with a case number (18-9) implement
// that case in the STSWENG automation test plan. Real notifications depend on live weather and on
// trip history, so the API is stubbed; the server side is covered in
// server/tests/unit/smart-notifications/notification-hub.test.js.

const TITLE = 'Route may run past 6 PM';

function notification(updatedAt: Date) {
  return {
    key: 'immediate:cutoff-risk',
    kind: 'immediate',
    severity: 'high',
    title: TITLE,
    message: 'At the current pace the last stop finishes around 7:10 PM.',
    suggestions: [{ label: 'Review assignments', target: 'assignment' }],
    basis: 'based on 40 trips across 6 drivers',
    updatedAt: updatedAt.toISOString(),
    stale: false,
    updated: false,
  };
}

// Answers like the server would: a dismissal hides the notification on the surface it was made on only.
async function stubSmartNotifications(page: Page, updatedAt: Date) {
  const dismissed = new Set<string>();
  const dismissals: { surface: string; key: string }[] = [];

  await page.route(
    (url) => url.pathname === '/api/smart-notifications',
    async (route: Route) => {
      const surface = new URL(route.request().url()).searchParams.get('surface') ?? 'dashboard';
      const item = notification(updatedAt);
      await route.fulfill({
        json: {
          success: true,
          data: {
            generatedAt: new Date().toISOString(),
            liveAvailable: true,
            immediate: dismissed.has(`${surface}:${item.key}`) ? [] : [item],
            future: [],
            insufficient: [],
          },
        },
      });
    },
  );

  await page.route(
    (url) => url.pathname === '/api/smart-notifications/dismiss',
    async (route: Route) => {
      const body = route.request().postDataJSON() as { surface: string; key: string };
      dismissals.push(body);
      dismissed.add(`${body.surface}:${body.key}`);
      await route.fulfill({ json: { success: true } });
    },
  );

  return dismissals;
}

async function openDashboard(page: Page) {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 30_000 });
  return page.getByRole('region', { name: 'Smart notifications' });
}

test.describe('Smart Recommendations', () => {
  test('18-9 shows how current each insight is', async ({ page }) => {
    await stubSmartNotifications(page, new Date(Date.now() - 3 * 60_000 - 5_000));

    const panel = await openDashboard(page);
    await expect(panel.getByText(TITLE)).toBeVisible();
    await expect(panel.getByText('Updated 3 min ago')).toBeVisible();
  });

  test('18-10 keeps a dismissal on its own surface', async ({ page }) => {
    const dismissals = await stubSmartNotifications(page, new Date());
    await stubOsrm(page);

    const panel = await openDashboard(page);
    await expect(panel.getByText(TITLE)).toBeVisible();
    await panel.getByRole('button', { name: `Dismiss: ${TITLE}` }).click();
    await expect(panel.getByText(TITLE)).toBeHidden();
    await expect.poll(() => dismissals).toEqual([{ surface: 'dashboard', key: 'immediate:cutoff-risk' }]);

    await page.goto('/route-tool');
    await page.getByRole('button', { name: 'Create New Route' }).click();
    await expect(page.getByRole('region', { name: 'Smart notifications' }).getByText(TITLE)).toBeVisible({
      timeout: 30_000,
    });
  });
});
