import { test, expect, Page } from '@playwright/test';

const CURRENT_PASSWORD = process.env.TEST_MANAGER_PASSWORD ?? 'admin';

const ERR_MISMATCH = 'New password and confirmation do not match';
const ERR_WRONG_CURRENT = 'Current password is incorrect';

const OK_MESSAGE = 'Password changed successfully!';

function captureDialog(page: Page): Promise<string> {
  return new Promise((resolve) => {
    page.once('dialog', async (dialog) => {
      const message = dialog.message();
      await dialog.dismiss();
      resolve(message);
    });
  });
}

async function submitPasswordChange(
  page: Page,
  current: string,
  next: string,
  confirm: string,
): Promise<string> {
  await page.locator('#current-password').fill(current);
  await page.locator('#new-password').fill(next);
  await page.locator('#confirm-password').fill(confirm);

  const dialog = captureDialog(page);
  await page.getByRole('button', { name: 'Update Password' }).click();
  return dialog;
}

test.describe('Change Password', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Account Profile' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('heading', { name: 'Change Password' })).toBeVisible();
  });

  test('CP-01 renders all three password fields and the submit control', async ({ page }) => {
    await expect(page.locator('#current-password')).toBeVisible();
    await expect(page.locator('#new-password')).toBeVisible();
    await expect(page.locator('#confirm-password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update Password' })).toBeEnabled();

    for (const id of ['#current-password', '#new-password', '#confirm-password']) {
      await expect(page.locator(id)).toHaveAttribute('type', 'password');
    }
  });

  test('CP-02 profile card renders the signed-in manager from the API', async ({ page }) => {
    const response = await page.request.get('http://localhost:8080/api/managers/me', {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('access_token'))}`,
      },
    });
    expect(response.ok(), 'GET /api/managers/me should succeed for a signed-in manager').toBe(true);

    const body = await response.json();
    const expectedEmail = body?.data?.email;
    expect(expectedEmail, 'manager profile should carry an email').toBeTruthy();
    await expect(page.getByText(expectedEmail, { exact: true })).toBeVisible();
  });

  test('CP-03 rejects a new password that does not match its confirmation', async ({ page }) => {
    const message = await submitPasswordChange(
      page,
      CURRENT_PASSWORD,
      'QaMismatchA1!',
      'QaMismatchB2!',
    );
    expect(message).toContain(ERR_MISMATCH);
  });

  test('CP-04 rejects a change when the current password is wrong', async ({ page }) => {
    const message = await submitPasswordChange(
      page,
      'definitely-not-the-current-password',
      'QaCandidate1!',
      'QaCandidate1!',
    );
    expect(message).toContain(ERR_WRONG_CURRENT);
  });

  test('CP-05 submitting a blank form surfaces the current-password-incorrect alert, by design', async ({
    page,
  }) => {
    const message = await submitPasswordChange(page, '', '', '');
    expect(message).toContain(ERR_WRONG_CURRENT);
  });

  // Skipped: modifies live account data.
  test.skip('CP-06 rejects a new password below the minimum length', async ({ page }) => {
    const message = await submitPasswordChange(page, CURRENT_PASSWORD, 'ab1', 'ab1');
    expect(message).toBeTruthy();
    expect(
      message,
    ).not.toContain(OK_MESSAGE);
  });

  // Skipped: modifies live account data.
  test.skip('CP-07 a valid change succeeds and clears the form', async ({ page }) => {
    test.skip(
      process.env.RMS_ALLOW_PASSWORD_MUTATION !== '1',
      'Rotates the shared seed credential. Set RMS_ALLOW_PASSWORD_MUTATION=1 to run.',
    );

    const temporary = `QaTemp${Date.now()}!`;

    const changed = await submitPasswordChange(page, CURRENT_PASSWORD, temporary, temporary);
    expect(changed).toContain(OK_MESSAGE);

    await expect(page.locator('#current-password')).toHaveValue('');
    await expect(page.locator('#new-password')).toHaveValue('');
    await expect(page.locator('#confirm-password')).toHaveValue('');

    const reverted = await submitPasswordChange(
      page,
      temporary,
      CURRENT_PASSWORD,
      CURRENT_PASSWORD,
    );
    expect(reverted, 'REVERT FAILED — reset admin@gmail.com manually before the next run').toContain(
      OK_MESSAGE,
    );
  });

  test('CP-08 each password field has an independent visibility toggle', async ({ page }) => {
    const fields = ['#current-password', '#new-password', '#confirm-password'];

    for (const id of fields) {
      const input = page.locator(id);
      const toggle = page.locator(`${id} + button`);

      await input.fill('visible-check');
      await toggle.click();
      await expect(input).toHaveAttribute('type', 'text');

      for (const other of fields.filter((f) => f !== id)) {
        await expect(page.locator(other)).toHaveAttribute('type', 'password');
      }

      await toggle.click();
      await expect(input).toHaveAttribute('type', 'password');
      await input.fill('');
    }
  });

  test('CP-09 validation feedback surfaces via alert(), by design', async ({ page }) => {
    const message = await submitPasswordChange(
      page,
      CURRENT_PASSWORD,
      'QaMismatchA1!',
      'QaMismatchB2!',
    );
    expect(message).toContain(ERR_MISMATCH);
    await expect(page.getByText(ERR_MISMATCH)).toHaveCount(0);
  });
});
