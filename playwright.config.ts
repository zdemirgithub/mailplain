import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/e2e',    // path to your e2e tests folder
  timeout: 30 * 1000,            // max time per test in ms (30 seconds)
  retries: 1,                   // retry once on failure (can adjust)
  reporter: 'html',             // generates a nice HTML report
  use: {
    headless: true,             // run tests in headless mode (no UI)
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10 * 1000,   // max time per action (click, type, etc)
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure', // record video only if test fails
    screenshot: 'only-on-failure', // take screenshot on failure
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
});
