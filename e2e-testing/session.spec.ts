import { test, expect, Page } from '@playwright/test';

async function signOut(page: Page) {
  const trigger = page.locator('header button').last();
  const button = page.getByRole('button', { name: 'Sign Out' });

  // Retry the menu click: React may not have attached handlers on the first attempt.
  // Guarded so a retry never toggles an already-open menu shut.
  await expect(async () => {
    if (!(await button.isVisible())) {
      await trigger.click();
    }
    await expect(button).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });

  await button.click();
}

const NAV = [
  { id: 'SN-02', href: '/dashboard', label: 'Dashboard', heading: 'Dashboard' },
  { id: 'SN-03', href: '/route-tool', label: 'Routing Tool', heading: 'Route Creation' },
  { id: 'SN-04', href: '/assignment', label: 'Assignment', heading: 'Route Assignment' },
  {
    id: 'SN-05',
    href: '/fleet-management',
    label: 'Fleet Management',
    heading: 'Fleet Management',
  },
] as const;

const SIDEBAR = 'div.fixed.top-0.left-0';

async function collapseSidebar(page: Page) {
  const sidebar = page.locator(SIDEBAR);
  // Retry the click: React may not have attached handlers on the first attempt.
  await expect(async () => {
    await sidebar.getByRole('button').click();
    await expect(sidebar).toHaveClass(/w-20/, { timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
}

async function openAccountMenu(page: Page) {
  const trigger = page.locator('header button').last();
  const label = page.getByText('My Account');
  // Retry the click: React may not have attached handlers on the first attempt.
  await expect(async () => {
    if (!(await label.isVisible())) {
      await trigger.click();
    }
    await expect(label).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
}

test.describe('Session & Navigation', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('SN-01 the protected shell renders the topbar title and all four nav links', async ({
    page,
  }) => {
    await expect(page.getByText('EnRoute')).toBeVisible();
    for (const { label } of NAV) {
      await expect(page.getByRole('link', { name: label })).toBeVisible();
    }
  });

  for (const { id, href, label, heading } of NAV) {
    test(`${id} ${label} navigates to ${href} and renders its page heading`, async ({ page }) => {
      await page.getByRole('link', { name: label }).click();
      await page.waitForURL(`**${href}`);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 30_000 });
    });
  }

  test('SN-06 the active nav link carries the active styling', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveClass(/bg-primary/);
    await expect(page.getByRole('link', { name: 'Assignment' })).not.toHaveClass(/bg-primary/);
  });

  test('SN-07 sidebar collapse toggles the rail and survives a reload', async ({ page }) => {
    const sidebar = page.locator(SIDEBAR);
    const toggle = sidebar.getByRole('button');

    await expect(sidebar).toHaveClass(/w-64/);
    await collapseSidebar(page);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(SIDEBAR)).toHaveClass(/w-20/);

    await page.locator(SIDEBAR).getByRole('button').click();
    await expect(page.locator(SIDEBAR)).toHaveClass(/w-64/);
  });

  test('SN-08 collapsed nav links expose their label as a title attribute', async ({ page }) => {
    await collapseSidebar(page);

    for (const { href, label } of NAV) {
      await expect(page.locator(`a[href="${href}"]`)).toHaveAttribute('title', label);
    }
  });

  test('SN-09 the theme switch flips the document theme both ways', async ({ page }) => {
    const html = page.locator('html');
    const startedDark = await html.evaluate((el) => el.classList.contains('dark'));
    const themeButton = page.getByTitle(startedDark ? 'Light mode' : 'Dark mode');

    await themeButton.click();
    if (startedDark) {
      await expect(html).not.toHaveClass(/\bdark\b/);
    } else {
      await expect(html).toHaveClass(/\bdark\b/);
    }

    await page.getByTitle(startedDark ? 'Dark mode' : 'Light mode').click();
    if (startedDark) {
      await expect(html).toHaveClass(/\bdark\b/);
    } else {
      await expect(html).not.toHaveClass(/\bdark\b/);
    }
  });

  test('SN-10 the account dropdown opens, shows its items, and closes on outside click', async ({
    page,
  }) => {
    await openAccountMenu(page);
    await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();

    await page.getByRole('heading', { name: 'Dashboard' }).click();
    await expect(page.getByText('My Account')).toBeHidden();
  });

  test('SN-11 the Profile item navigates to the profile page', async ({ page }) => {
    await openAccountMenu(page);
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.waitForURL('**/profile');
    await expect(page.getByRole('heading', { name: 'Account Profile' })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('SN-12 the topbar renders the signed-in manager name rather than the fallback', async ({
    page,
  }) => {
    const trigger = page.locator('header button').last();
    await expect(trigger).not.toHaveText('User', { timeout: 30_000 });
  });

  test('SN-13 sign out clears both tokens and returns to the login page', async ({ page }) => {
    await signOut(page);

    await page.waitForURL(/localhost:3000\/?$/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();

    const tokens = await page.evaluate(() => ({
      access: localStorage.getItem('access_token'),
      refresh: localStorage.getItem('refresh_token'),
    }));
    expect(tokens.access).toBeNull();
    expect(tokens.refresh).toBeNull();
  });

  test('SN-14 navigating back after sign out does not restore access', async ({ page }) => {
    await signOut(page);
    await page.waitForURL(/localhost:3000\/?$/, { timeout: 30_000 });

    await page.goBack();
    await expect(page).toHaveURL(/localhost:3000\/?$/, { timeout: 30_000 });
  });

  // Blocked: logout() sends no Authorization header (client/lib/api/auth.ts) but /api/auth/logout requires authenticate, so it always gets 401.
  test.fixme('SN-15 the logout request is authenticated and succeeds server-side', async ({ page }) => {
    const logoutResponse = page.waitForResponse('**/api/auth/logout');

    await signOut(page);

    const response = await logoutResponse;
    expect(
      response.status(),
    ).toBeLessThan(400);
  });

  test('SN-16 the sidebar collapse control exposes an accessible name', async ({ page }) => {
    const toggle = page.locator(SIDEBAR).getByRole('button');
    const accessibleName = await toggle.evaluate(
      (el) => el.getAttribute('aria-label') ?? el.getAttribute('title') ?? el.textContent?.trim() ?? '',
    );
    expect(
      accessibleName,
    ).not.toBe('');
  });
});
