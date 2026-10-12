import { test as setup, expect } from '@playwright/test';
import { STORAGE_STATE } from '../playwright.config';

// Logs in once and saves the session to STORAGE_STATE; the browser projects
// load it via storageState, so specs start already authenticated.

const MANAGER_EMAIL = process.env.TEST_MANAGER_EMAIL ?? 'admin@gmail.com';
const MANAGER_PASSWORD = process.env.TEST_MANAGER_PASSWORD ?? 'admin';

setup('authenticate as manager', async ({ page }) => {
  setup.setTimeout(120_000);

  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // In dev, fill() can land before React hydrates and the submit then sees
  // empty state — re-fill until the app actually navigates.
  await expect(async () => {
    if (!page.url().includes('/dashboard')) {
      await page.locator('#email').fill(MANAGER_EMAIL);
      await page.locator('#password').fill(MANAGER_PASSWORD);
      await page.getByRole('button', { name: 'Sign In' }).click();
    }
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
  }).toPass({ timeout: 90_000 });

  await page.context().storageState({ path: STORAGE_STATE });
});
