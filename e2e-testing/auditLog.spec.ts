import { test, expect, Page } from '@playwright/test';

// Suite 17: Audit Log (issue #5). Titles that start with a case number (17-1) implement that case
// in the STSWENG automation test plan. Audit rows come from a Postgres trigger, so these cases run
// against the real API and database. test.fail marks a case issue #5 asks for but the app does not
// have yet; remove it once the case passes.

const API = 'http://localhost:8080';
const MANAGER_EMAIL = process.env.TEST_MANAGER_EMAIL ?? 'admin@gmail.com';

type AuditEntry = {
  id: number;
  table_name: string;
  record_id: string | null;
  action: string;
  actor: { id: string | null; name: string; email: string | null };
  details: string;
  created_at: string;
};

async function signedInToken(page: Page) {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 30_000 });
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  expect(token, 'access_token in localStorage').toBeTruthy();
  return { Authorization: `Bearer ${token}` };
}

function uniquePlate() {
  return `QA${Date.now().toString().slice(-7)}`;
}

async function createVehicle(page: Page, headers: Record<string, string>, plate: string) {
  const res = await page.request.post(`${API}/api/vehicles`, {
    headers,
    data: { plate_number: plate, year: 2022, initial_odometer: 1000, expected_kml: 12, vehicle_type: 'VAN' },
  });
  expect(res.ok(), await res.text()).toBe(true);
  return (await res.json()).data as { id_: string };
}

async function entriesFor(page: Page, headers: Record<string, string>, recordId: string) {
  const res = await page.request.get(`${API}/api/audit_log`, { headers });
  expect(res.status()).toBe(200);
  const { data } = (await res.json()) as { data: AuditEntry[] };
  return data.filter((e) => e.record_id === recordId);
}

async function openAuditLog(page: Page) {
  await page.goto('/audit-log');
  await expect(page.getByRole('heading', { name: 'Recent Logs' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('combobox').selectOption('50');
}

// The same parts formatDateTime in client/lib/routing/formatters.ts produces: "July 07, 2026, 2:22PM".
function manilaDateTime(when: Date) {
  const date = when.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric', timeZone: 'Asia/Manila' });
  const time = when
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' })
    .replace(/\s/g, '');
  return `${date}, ${time}`;
}

test.describe('Audit Log', () => {
  test('17-1 records an entry when a vehicle is created', async ({ page }) => {
    const headers = await signedInToken(page);
    const plate = uniquePlate();
    const vehicle = await createVehicle(page, headers, plate);

    const [entry, ...rest] = await entriesFor(page, headers, vehicle.id_);
    expect(rest).toHaveLength(0);
    expect(entry).toMatchObject({ table_name: 'vehicle', action: 'INSERT' });
    expect(entry.details).toMatch(/^Created/);
    expect(entry.details).toContain(plate);
    expect(entry.actor.email).toBe(MANAGER_EMAIL);

    await openAuditLog(page);
    const row = page.getByRole('row').filter({ hasText: plate });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('CREATE');
    await expect(row).toContainText(MANAGER_EMAIL);
  });

  test('17-8 keeps entries after their object is archived', async ({ page }) => {
    const headers = await signedInToken(page);
    const plate = uniquePlate();
    const vehicle = await createVehicle(page, headers, plate);
    const archive = await page.request.patch(`${API}/api/vehicles/${vehicle.id_}/archive`, { headers });
    expect(archive.ok(), await archive.text()).toBe(true);

    const entries = await entriesFor(page, headers, vehicle.id_);
    expect(entries.map((e) => e.details)).toEqual([`Archived vehicle ${plate}.`, `Created vehicle ${plate}.`]);

    await openAuditLog(page);
    await expect(page.getByRole('row').filter({ hasText: plate })).toHaveCount(2);
  });

  // Issue #5: opening a vehicle, trip or driver shows an audit history limited to that object.
  test('17-11 shows only an object\'s own history', async ({ page }) => {
    test.fail(true, 'Issue #5: per-object audit history is not built yet');
    const headers = await signedInToken(page);
    const ids = [`QA-D${Date.now().toString().slice(-6)}`, `QA-E${Date.now().toString().slice(-6)}`];
    for (const driver_id of ids) {
      const created = await page.request.post(`${API}/api/drivers`, { headers, data: { driver_id } });
      expect(created.ok(), await created.text()).toBe(true);
      const { data } = await created.json();
      const edited = await page.request.put(`${API}/api/drivers/${data.id_}`, { headers, data: { contact_number: '09170000000' } });
      expect(edited.ok(), await edited.text()).toBe(true);
    }

    await page.goto('/driver-management');
    await page.getByRole('row').filter({ hasText: ids[0] }).click({ timeout: 5_000 });
    const history = page.getByRole('region', { name: /history/i });
    await expect(history).toContainText(ids[0], { timeout: 5_000 });
    await expect(history).not.toContainText(ids[1]);
  });

  test.describe('in the Asia/Manila time zone', () => {
    test.use({ timezoneId: 'Asia/Manila' });

    test('17-12 shows date and time in the app-wide format and time zone', async ({ page }) => {
      const headers = await signedInToken(page);
      const plate = uniquePlate();
      const before = new Date();
      await createVehicle(page, headers, plate);
      const after = new Date();

      await openAuditLog(page);
      const timestamp = page.getByRole('row').filter({ hasText: plate }).getByRole('cell').first();
      const text = (await timestamp.textContent())?.trim() ?? '';

      expect(text).toMatch(/^[A-Z][a-z]+ \d{2}, \d{4}, \d{1,2}:\d{2}(AM|PM)$/);
      expect([manilaDateTime(before), manilaDateTime(after)]).toContain(text);
    });
  });
});
