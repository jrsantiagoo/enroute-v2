import { test, expect, Page } from '@playwright/test';

const MANAGER_EMAIL = process.env.TEST_MANAGER_EMAIL ?? 'admin@gmail.com';
const MANAGER_PASSWORD = process.env.TEST_MANAGER_PASSWORD ?? 'admin';

const ERROR_TEXT = 'p.text-red-500';

async function fillReactInput(page: Page, selector: string, value: string) {
  const input = page.locator(selector);
  await expect(async () => {
    await input.click();
    await input.fill('');
    await input.pressSequentially(value, { delay: 15 });
    expect(await input.inputValue()).toBe(value);
  }).toPass({ timeout: 20_000 });
}

test.describe('Login', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
  });

  test('LG-01 renders both credential fields and the submit control', async ({ page }) => {
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeEnabled();
    await expect(page.locator('#email')).toHaveAttribute('type', 'email');
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
  });

  test('LG-02 rejects submission when both fields are empty', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Email and password are required', { exact: true })).toBeVisible();
  });

  test('LG-03 rejects submission when only the email is empty', async ({ page }) => {
    await fillReactInput(page, '#password', MANAGER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Email is required', { exact: true })).toBeVisible();
  });

  test('LG-04 rejects submission when only the password is empty', async ({ page }) => {
    await fillReactInput(page, '#email', MANAGER_EMAIL);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Password is required', { exact: true })).toBeVisible();
  });

  test('LG-05 surfaces the backend error for credentials that do not exist', async ({ page }) => {
    await fillReactInput(page, '#email', 'no-such-user@example.com');
    await fillReactInput(page, '#password', 'definitely-not-the-password');
    await page.getByRole('button', { name: 'Sign In' }).click();

    const error = page.locator(ERROR_TEXT);
    await expect(error).toBeVisible({ timeout: 20_000 });
    await expect(error).not.toHaveText('Email is required');
    await expect(error).not.toHaveText('Password is required');
    await expect(page).not.toHaveURL(/dashboard/);
  });

  test('LG-06 blocks a malformed email at the native constraint, not in app code', async ({
    page,
  }) => {
    await fillReactInput(page, '#email', 'not-an-email');
    await fillReactInput(page, '#password', MANAGER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    const typeMismatch = await page
      .locator('#email')
      .evaluate((el: HTMLInputElement) => el.validity.typeMismatch);
    expect(typeMismatch, 'native type="email" should reject this value').toBe(true);

    await expect(page.locator(ERROR_TEXT)).toHaveCount(0);
    await expect(page).not.toHaveURL(/dashboard/);
  });

  test('LG-07 treats a whitespace-only password as present and defers to the backend', async ({
    page,
  }) => {
    await fillReactInput(page, '#email', MANAGER_EMAIL);
    await fillReactInput(page, '#password', '   ');
    await page.getByRole('button', { name: 'Sign In' }).click();

    const error = page.locator(ERROR_TEXT);
    await expect(error).toBeVisible({ timeout: 20_000 });
    await expect(error).not.toHaveText('Password is required');
  });

  test('LG-08 password visibility toggle flips the input type both ways', async ({ page }) => {
    const password = page.locator('#password');
    await fillReactInput(page, '#password', 'some-secret');

    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await expect(password).toHaveValue('some-secret');

    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(password).toHaveAttribute('type', 'password');
    await expect(password).toHaveValue('some-secret');
  });

  test('LG-09 dark mode toggle updates the root class and survives reload', async ({ page }) => {
    const isDark = () =>
      page.evaluate(() => document.documentElement.classList.contains('dark'));

    const before = await isDark();
    await page.getByRole('button', { name: 'Toggle dark mode' }).click();
    const after = await isDark();
    expect(after).toBe(!before);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
    expect(await isDark()).toBe(after);
  });

  test('LG-10 disables the submit control while the login request is pending', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.continue();
    });

    await fillReactInput(page, '#email', MANAGER_EMAIL);
    await fillReactInput(page, '#password', MANAGER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByRole('button', { name: 'Signing in...' })).toBeDisabled();
  });

  test('LG-11 valid credentials land on the dashboard and persist both tokens', async ({ page }) => {
    await fillReactInput(page, '#email', MANAGER_EMAIL);
    await fillReactInput(page, '#password', MANAGER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.waitForURL('**/dashboard', { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 30_000 });

    const tokens = await page.evaluate(() => ({
      access: localStorage.getItem('access_token'),
      refresh: localStorage.getItem('refresh_token'),
    }));
    expect(tokens.access).toBeTruthy();
    expect(tokens.refresh).toBeTruthy();
  });

  test('LG-12 an unauthenticated visit to /dashboard is redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('LG-13 forgot-password link points at a real recovery route', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Forgot password?' });
    await expect(link).toBeVisible();
    await expect(
      link,
    ).not.toHaveAttribute('href', '#');
  });
});
