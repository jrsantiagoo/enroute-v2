import { defineConfig, devices } from '@playwright/test';

export const STORAGE_STATE = 'playwright/.auth/manager.json';

const LOGGED_OUT_SPECS = /login\.spec\.ts/;

export default defineConfig({
  testDir: './e2e-testing',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: process.env.CI ? 'on-first-retry' : 'on',
  },

  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
      testIgnore: LOGGED_OUT_SPECS,
    },
    {
      name: 'chromium-logged-out',
      use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] } },
      testMatch: LOGGED_OUT_SPECS,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
      testIgnore: LOGGED_OUT_SPECS,
    },
  ],
});
