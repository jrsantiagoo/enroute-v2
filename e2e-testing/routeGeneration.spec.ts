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

  test('1-7 closing the suggest modal returns to the editor unchanged', async ({ page }) => {
    await openEditor(page);
    await openSuggestModal(page);

    await page.getByRole('button', { name: 'Close' }).last().click();
    await expect(page.getByText('Automated delivery route planning')).toBeHidden();
    await expect(page.getByText('De La Salle University')).toBeVisible();
    await expect(page.getByText('Rizal Park')).toBeVisible();
  });
});
