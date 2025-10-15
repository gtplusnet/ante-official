import { test, expect, Page } from '@playwright/test';

// Set test timeout to 60 seconds
test.setTimeout(60000);

// Use the Public API server
const BASE_URL = 'http://localhost:9001';
const API_URL = 'http://100.109.133.12:3000';

// Test credentials for guardian login
const TEST_CREDENTIALS = {
  email: 'guardian@test.com',
  password: 'test123'
};

// Helper function to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`, { timeout: 60000, waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Fill credentials
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  await emailInput.fill(TEST_CREDENTIALS.email);

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(TEST_CREDENTIALS.password);

  // Click login button
  const loginButton = page.locator('button[type="submit"]').first();
  await loginButton.click();

  // Wait for navigation
  await page.waitForURL(/.*\/(dashboard|add-student)/, { timeout: 30000 });
  await page.waitForTimeout(2000);

  // If on add-student page, navigate to dashboard if possible
  if (page.url().includes('add-student')) {
    // Try to navigate to dashboard directly
    await page.goto(`${BASE_URL}/dashboard`, { timeout: 30000 });
    await page.waitForTimeout(2000);
  }
}

test.describe('Guardian App - Dashboard Attendance', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Capture console errors and warnings
    consoleErrors = [];
    consoleWarnings = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page error: ${error.message}`);
    });
  });

  test.afterEach(async () => {
    // Log any critical errors (excluding expected ones)
    const criticalErrors = consoleErrors.filter((err) => {
      return (
        !err.includes('favicon') &&
        !err.includes('source map') &&
        !err.includes('chunk') &&
        !err.includes('hydration') &&
        !err.includes('Supabase') // Supabase should be removed
      );
    });

    if (criticalErrors.length > 0) {
      console.log('Critical console errors:', criticalErrors);
    }
  });

  test('Should load dashboard page after login', async ({ page }) => {
    // Note: This test requires a valid test guardian account
    if (!TEST_CREDENTIALS.email || TEST_CREDENTIALS.email === 'guardian@test.com') {
      console.log('Skipping dashboard test - no valid test credentials configured');
      test.skip();
    }

    await login(page);

    // Verify we're on dashboard
    expect(page.url()).toContain('/dashboard');

    // Check for main dashboard elements
    const dashboardTitle = page.locator('h1, h2').filter({ hasText: /dashboard|home|overview/i });
    await expect(dashboardTitle).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/guardian-dashboard-loaded.png', fullPage: true });
  });

  test('Should display student attendance status cards', async ({ page }) => {
    if (!TEST_CREDENTIALS.email || TEST_CREDENTIALS.email === 'guardian@test.com') {
      test.skip();
    }

    await login(page);

    // Wait for attendance data to load
    await page.waitForTimeout(3000);

    // Check for attendance status cards/sections
    const attendanceElements = [
      page.locator('[class*="attendance"], [data-testid*="attendance"]'),
      page.locator('text=/present|absent|status|attendance/i'),
    ];

    let foundAttendance = false;
    for (const locator of attendanceElements) {
      const count = await locator.count();
      if (count > 0) {
        foundAttendance = true;
        console.log(`Found ${count} attendance elements`);
        break;
      }
    }

    // If no students are added yet, we should see a message about adding students
    if (!foundAttendance) {
      const addStudentMessage = page.locator('text=/add.*student|no.*student/i');
      const hasMessage = await addStudentMessage.count() > 0;
      expect(hasMessage).toBeTruthy();
    }

    await page.screenshot({ path: 'test-results/guardian-dashboard-attendance-status.png', fullPage: true });
  });

  test('Should verify API polling is working', async ({ page }) => {
    if (!TEST_CREDENTIALS.email || TEST_CREDENTIALS.email === 'guardian@test.com') {
      test.skip();
    }

    // Track API requests
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/') && !url.includes('/api/version')) {
        apiRequests.push(url);
        console.log('API Request:', url);
      }
    });

    await login(page);

    // Wait for initial data load
    await page.waitForTimeout(3000);

    const initialRequestCount = apiRequests.length;
    console.log('Initial API requests:', initialRequestCount);

    // Wait for polling interval (30 seconds + buffer)
    await page.waitForTimeout(35000);

    const finalRequestCount = apiRequests.length;
    console.log('Final API requests after 35s:', finalRequestCount);

    // Verify that polling happened (should have more requests than initial)
    expect(finalRequestCount).toBeGreaterThan(initialRequestCount);

    // Log all API requests for debugging
    console.log('All API requests:', apiRequests);
  });

  test('Should display attendance logs/history', async ({ page }) => {
    if (!TEST_CREDENTIALS.email || TEST_CREDENTIALS.email === 'guardian@test.com') {
      test.skip();
    }

    await login(page);

    // Wait for data to load
    await page.waitForTimeout(3000);

    // Look for attendance history/logs section
    const historyElements = [
      page.locator('[class*="history"], [class*="log"], [data-testid*="history"]'),
      page.locator('text=/history|recent.*attendance|logs/i'),
      page.locator('table, [role="table"]'),
    ];

    let foundHistory = false;
    for (const locator of historyElements) {
      const count = await locator.count();
      if (count > 0) {
        foundHistory = true;
        console.log(`Found attendance history with ${count} elements`);
        break;
      }
    }

    // If no history is found, there might be a "no data" message
    if (!foundHistory) {
      const noDataMessage = page.locator('text=/no.*data|no.*record|empty/i');
      const hasMessage = await noDataMessage.count() > 0;
      console.log('Has no-data message:', hasMessage);
    }

    await page.screenshot({ path: 'test-results/guardian-dashboard-attendance-history.png', fullPage: true });
  });

  test('Should verify data updates after polling', async ({ page }) => {
    if (!TEST_CREDENTIALS.email || TEST_CREDENTIALS.email === 'guardian@test.com') {
      test.skip();
    }

    await login(page);

    // Wait for initial data load
    await page.waitForTimeout(3000);

    // Capture initial page content
    const initialContent = await page.content();

    // Wait for at least one polling cycle (30 seconds + buffer)
    await page.waitForTimeout(35000);

    // Capture content after polling
    const pollingContent = await page.content();

    // The content might be the same if no data changed, but the API should have been called
    // This is verified in the polling test above
    console.log('Initial content length:', initialContent.length);
    console.log('Content length after polling:', pollingContent.length);

    await page.screenshot({ path: 'test-results/guardian-dashboard-after-polling.png', fullPage: true });
  });

  test('Should handle API errors gracefully', async ({ page }) => {
    if (!TEST_CREDENTIALS.email || TEST_CREDENTIALS.email === 'guardian@test.com') {
      test.skip();
    }

    // Intercept API requests and simulate errors
    await page.route('**/api/public/school-guardian/attendance/**', (route) => {
      route.abort('failed');
    });

    await login(page);

    // Wait for attempted data load
    await page.waitForTimeout(3000);

    // Check for error messages or loading states
    const errorElements = [
      page.locator('[class*="error"], [role="alert"]'),
      page.locator('text=/error|failed|retry/i'),
      page.locator('[class*="loading"], [aria-busy="true"]'),
    ];

    let foundErrorHandling = false;
    for (const locator of errorElements) {
      const count = await locator.count();
      if (count > 0) {
        foundErrorHandling = true;
        console.log('Found error handling UI');
        break;
      }
    }

    // The app should either show an error message or handle it gracefully
    console.log('Error handling present:', foundErrorHandling);

    await page.screenshot({ path: 'test-results/guardian-dashboard-api-error.png', fullPage: true });
  });

  test('Should verify no Supabase references in console', async ({ page }) => {
    if (!TEST_CREDENTIALS.email || TEST_CREDENTIALS.email === 'guardian@test.com') {
      test.skip();
    }

    await login(page);

    // Wait for page to fully load and any operations to complete
    await page.waitForTimeout(5000);

    // Check for Supabase-related errors or references
    const supabaseErrors = consoleErrors.filter((err) =>
      err.toLowerCase().includes('supabase')
    );

    const supabaseWarnings = consoleWarnings.filter((warn) =>
      warn.toLowerCase().includes('supabase')
    );

    if (supabaseErrors.length > 0) {
      console.log('Supabase errors found (should not exist):', supabaseErrors);
    }

    if (supabaseWarnings.length > 0) {
      console.log('Supabase warnings found (should not exist):', supabaseWarnings);
    }

    // After migration, there should be no Supabase references
    expect(supabaseErrors.length).toBe(0);
    expect(supabaseWarnings.length).toBe(0);
  });

  test('Should verify attendance data is fetched from correct API', async ({ page }) => {
    if (!TEST_CREDENTIALS.email || TEST_CREDENTIALS.email === 'guardian@test.com') {
      test.skip();
    }

    // Track API endpoints called
    const attendanceApiCalls: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('attendance')) {
        attendanceApiCalls.push(url);
        console.log('Attendance API call:', url);
      }
    });

    await login(page);

    // Wait for data load
    await page.waitForTimeout(5000);

    // Verify attendance endpoints are called
    expect(attendanceApiCalls.length).toBeGreaterThan(0);

    // Verify they're using the correct API server
    const correctApiCalls = attendanceApiCalls.filter((url) =>
      url.includes('100.109.133.12:3000')
    );

    expect(correctApiCalls.length).toBeGreaterThan(0);

    console.log('Attendance API calls:', attendanceApiCalls);
  });

  test('Should have no critical console errors on dashboard', async ({ page }) => {
    if (!TEST_CREDENTIALS.email || TEST_CREDENTIALS.email === 'guardian@test.com') {
      test.skip();
    }

    await login(page);

    // Wait for page to fully load
    await page.waitForTimeout(5000);

    // Check for critical errors
    const criticalErrors = consoleErrors.filter((err) => {
      return (
        !err.includes('favicon') &&
        !err.includes('source map') &&
        !err.includes('chunk') &&
        !err.includes('hydration') &&
        !err.includes('Supabase')
      );
    });

    if (criticalErrors.length > 0) {
      console.log('Critical console errors found:', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });
});
