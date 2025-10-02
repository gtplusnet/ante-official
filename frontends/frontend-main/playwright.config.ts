import { defineConfig } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:9000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global test timeout */
    actionTimeout: 10000,
    
    /* Navigation timeout */
    navigationTimeout: 30000,
    
    /* IMPORTANT: Headless mode - no browser window */
    headless: true,
    
    /* Standard viewport for consistent testing */
    viewport: { width: 1920, height: 1080 },
    
    /* Browser context options */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        // Standard viewport for headless testing
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--no-sandbox'
          ],
        },
      },
    },
    
    // Uncomment for additional browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Global setup and teardown */
  globalSetup: './tests/e2e/config/global-setup.ts',
  globalTeardown: './tests/e2e/config/global-teardown.ts',

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'VITE_PLUGIN_CHECKER=false yarn dev',
    url: 'http://localhost:9000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  
  /* Test timeout */
  timeout: 120000,
  
  /* Expect timeout */
  expect: {
    timeout: 10000,
  },
  
  /* Test output directory */
  outputDir: 'screenshots/',
  
  /* Preserve output directory */
  preserveOutput: 'always',
});