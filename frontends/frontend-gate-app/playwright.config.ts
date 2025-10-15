import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:9002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true, // CRITICAL: Always run headless
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], headless: true },
    },
  ],

  // Gate app runs on PM2 (port 9002) - no need to start server
  // webServer: {
  //   command: 'yarn dev',
  //   port: 9002,
  //   reuseExistingServer: !process.env.CI,
  // },
});