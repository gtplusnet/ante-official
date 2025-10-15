import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 *
 * CRITICAL: Tests MUST run in headless mode (CLAUDE.md requirement)
 * Never use --headed or --ui flags
 */

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:9000',
    trace: 'on-first-retry',
    // CRITICAL: Enforce headless mode (CLAUDE.md)
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // CRITICAL: Enforce headless mode (CLAUDE.md)
        headless: true,
      },
    },
  ],

  // Run local dev server before starting tests
  // webServer: {
  //   command: 'yarn dev',
  //   url: 'http://localhost:9000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
