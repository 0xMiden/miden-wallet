import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/tests',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  // Browser extension tests are flaky when run in parallel due to Chrome/extension resource conflicts
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1,
  reporter: [['list']],
  use: {
    headless: true,
    trace: 'on-first-retry',
  },
});

