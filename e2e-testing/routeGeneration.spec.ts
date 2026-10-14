import { test, expect, Page } from '@playwright/test';
import { stubOsrm } from './osrm-stub';

async function openEditor(page: Page) {
  await page.getByRole('button', { name: 'Create New Route' }).click();
  await expect(page.getByRole('heading', { name: 'Create Route' })).toBeVisible();
  await expect(page.getByText('De La Salle University')).toBeVisible();
  await expect(page.getByText('Rizal Park')).toBeVisible();
}

async function openSuggestModal(page: Page) {
  await page.getByRole('button', { name: 'Suggest Routes' }).click();
  await expect(page.getByText('Automated delivery route planning')).toBeVisible();
}

test.describe('Route Generation', () => {

  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await stubOsrm(page);
    await page.goto('/route-tool');
    await expect(page.getByRole('heading', { name: 'Route Creation' })).toBeVisible({
      timeout: 30_000,
    });
    await page.evaluate(() => localStorage.removeItem('acesoft_savedRoutes'));
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Route Creation' })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('1-1 generates optimised route cards when stops and fleet are available', async ({
    page,
  }) => {
    await openEditor(page);
    await openSuggestModal(page);

    await page.getByRole('button', { name: 'Generate', exact: true }).click();

    await expect(page.getByText('Route A – Fastest')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Apply' }).first()).toBeVisible();
  });

  test('1-1b each suggestion is labelled with its optimisation goal and vehicle class', async ({
    page,
  }) => {
    await openEditor(page);
    await openSuggestModal(page);
    await page.getByRole('button', { name: 'Generate', exact: true }).click();
    await expect(page.getByText('Route A – Fastest')).toBeVisible({ timeout: 30_000 });

    await expect(page.getByText(/⚡ Fastest|📏 Shortest/).first()).toBeVisible();
    await expect(page.getByText(/🏍️ Motorcycle|🚗 Car/).first()).toBeVisible();
  });

  test('1-1c applying a suggestion writes its stops back into the editor', async ({ page }) => {
    await openEditor(page);
    await openSuggestModal(page);
    await page.getByRole('button', { name: 'Generate', exact: true }).click();
    await expect(page.getByText('Route A – Fastest')).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: 'Apply' }).first().click();

    await expect(page.getByText('Automated delivery route planning')).toBeHidden();
    await expect(page.getByText('Route Plan', { exact: true })).toBeVisible();
  });

  test('1-2 shows an empty-state message when there are no stops to route', async ({ page }) => {
    await openEditor(page);
    await page.getByRole('button', { name: 'Remove Rizal Park' }).click();
    await page.getByRole('button', { name: 'Remove De La Salle University' }).click();

    await openSuggestModal(page);
    await page.getByRole('button', { name: 'Generate', exact: true }).click();

    await expect(page.getByText('Route A – Fastest')).toHaveCount(0);
    await expect(page.getByText(/no routes available for this week/i)).toBeVisible({
      timeout: 20_000,
    });
  });

  test('1-5 the modal prompts for a week before anything has been generated', async ({ page }) => {
    await openEditor(page);
    await openSuggestModal(page);

    await expect(page.getByText(/Select a delivery week/i)).toBeVisible();
    await expect(page.getByText('Route A – Fastest')).toHaveCount(0);
  });

  // Blocked: SuggestRoutesModal no longer renders a "Fleet this week:" line (availability lookup commented out).
  test.fixme('1-6 changing the delivery week updates the advertised fleet', async ({ page }) => {
    await openEditor(page);
    await openSuggestModal(page);

    await expect(page.getByText('Fleet this week:')).toBeVisible();
    const fleetLine = page.getByText('Fleet this week:').locator('xpath=..');

    const weekSelect = page.locator(
      'xpath=//label[normalize-space()="Delivery Week"]/following-sibling::select',
    );
    await expect(weekSelect).toHaveCount(1);

    const weeks = await weekSelect
      .locator('option')
      .evaluateAll((els) => els.map((el) => (el as HTMLOptionElement).value));
    test.skip(weeks.length < 2, 'Only one week is configured in MOCK_WEEKLY_AVAILABILITY.');

    await weekSelect.selectOption(weeks[0]);
    const before = await fleetLine.innerText();

    await weekSelect.selectOption(weeks[1]);
    await expect.poll(async () => fleetLine.innerText(), { timeout: 10_000 }).not.toBe(before);
  });

  test('1-7 closing the suggest modal returns to the editor unchanged', async ({ page }) => {
    await openEditor(page);
    await openSuggestModal(page);

    await page.getByRole('button', { name: 'Close' }).last().click();
    await expect(page.getByText('Automated delivery route planning')).toBeHidden();
    await expect(page.getByText('De La Salle University')).toBeVisible();
    await expect(page.getByText('Rizal Park')).toBeVisible();
  });

  test.fixme(
    '1-3 distributes all stops across available drivers when stops outnumber drivers',
    async () => {},
  );

  test.fixme(
    '1-4 marks excess drivers as unassigned when drivers outnumber stops',
    async () => {},
  );

  // Blocked: DD-12/RMS-105 — urgent orders aren't sorted to the top of suggestions.
  test.fixme('1-8 sorts urgent orders to the top of the stop suggestions', async () => {});

  // Blocked: DD-13/RMS-106 — Suggest Routes generates per delivery-week, not per day.
  test.fixme('1-9 generates route suggestions per day rather than per week', async () => {});

  // Blocked: DD-14/RMS-107 — no fuel-consumption projection is shown on suggestions.
  test.fixme('1-10 shows a projected fuel-consumption figure on each suggestion', async () => {});
});
