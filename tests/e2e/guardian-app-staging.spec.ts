import { test, expect } from '@playwright/test';

/**
 * Guardian App - Staging Environment Tests
 * Tests the deployed Guardian App on https://ante-guardian.geertest.com/
 */

const BASE_URL = 'https://ante-guardian.geertest.com';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'guillermotabligan@gmail.com',
  password: 'water123',
};

// Helper function to filter out expected network errors
function filterNetworkErrors(errors: string[]): string[] {
  return errors.filter(
    (error) =>
      !error.includes('_app-client_reference_manifest.js') &&
      !error.includes('Could not find the module') &&
      !error.includes('ResizeObserver loop') &&
      !error.includes('Hydration') &&
      !error.includes('Expected server HTML')
  );
}

test.describe('Guardian App - Staging Environment', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset error tracking
    consoleErrors = [];
    consoleWarnings = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });

    // Navigate to login page (with trailing slash to avoid redirect)
    await page.goto(`${BASE_URL}/login/`);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    // Filter out expected errors
    const unexpectedErrors = filterNetworkErrors(consoleErrors);

    // Report console errors if any
    if (unexpectedErrors.length > 0) {
      console.log('\n❌ Unexpected Console Errors Found:');
      unexpectedErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    // Report warnings (informational only)
    if (consoleWarnings.length > 0) {
      console.log('\n⚠️  Console Warnings:');
      consoleWarnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
    }
  });

  test('Staging - Login page should load without errors', async ({ page }) => {
    // Verify login page loaded
    const emailInput = await page.locator('input[type="email"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();
    const submitButton = await page.locator('button[type="submit"]').count();

    expect(emailInput).toBeGreaterThan(0);
    expect(passwordInput).toBeGreaterThan(0);
    expect(submitButton).toBeGreaterThan(0);

    // Verify no unexpected console errors
    const unexpectedErrors = filterNetworkErrors(consoleErrors);
    expect(unexpectedErrors.length).toBe(0);

    console.log('\n✅ Login page loaded successfully without errors');
  });

  test('Staging - Should login with valid credentials', async ({ page }) => {
    console.log('\n🔐 Attempting login...');

    // Fill login form
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);

    // Submit login
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    // Should be redirected away from login
    expect(currentUrl).not.toContain('/login');

    // Verify no unexpected console errors
    const unexpectedErrors = filterNetworkErrors(consoleErrors);
    expect(unexpectedErrors.length).toBe(0);

    console.log('\n✅ Login successful');
  });

  test('Staging - Full authenticated flow', async ({ page }) => {
    console.log('\n🧪 Testing full authenticated user flow...');

    // Login
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Verify redirected to dashboard
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
    console.log('✅ Logged in, current page:', currentUrl);

    // Test navigation to different pages
    const pagesToTest = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/log-history', name: 'Log History' },
      { path: '/notifications', name: 'Notifications' },
      { path: '/account', name: 'Account' },
    ];

    for (const pageInfo of pagesToTest) {
      console.log(`\n🔍 Testing: ${pageInfo.name}`);

      await page.goto(`${BASE_URL}${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const pageUrl = page.url();
      console.log(`   Current URL: ${pageUrl}`);

      // Should not redirect to login
      expect(pageUrl).not.toContain('/login');

      console.log(`   ✅ ${pageInfo.name} loaded successfully`);
    }

    // Verify no unexpected console errors throughout the flow
    const unexpectedErrors = filterNetworkErrors(consoleErrors);
    expect(unexpectedErrors.length).toBe(0);

    console.log('\n✅ All authenticated pages working correctly');
  });

  test('Staging - Dashboard should display data', async ({ page }) => {
    console.log('\n📊 Testing dashboard data display...');

    // Login
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for dashboard content (students list or data)
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();

    console.log('✅ Dashboard has content');

    // Verify no unexpected console errors
    const unexpectedErrors = filterNetworkErrors(consoleErrors);
    expect(unexpectedErrors.length).toBe(0);
  });

  test('Staging - Notifications page should work', async ({ page }) => {
    console.log('\n🔔 Testing notifications page...');

    // Login
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to notifications
    await page.goto(`${BASE_URL}/notifications`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify page loaded
    const currentUrl = page.url();
    expect(currentUrl).toContain('/notifications');

    console.log('✅ Notifications page loaded');

    // Verify no unexpected console errors
    const unexpectedErrors = filterNetworkErrors(consoleErrors);
    expect(unexpectedErrors.length).toBe(0);
  });

  test('Staging - Log history page should work', async ({ page }) => {
    console.log('\n📜 Testing log history page...');

    // Login
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to log history
    await page.goto(`${BASE_URL}/log-history`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify page loaded
    const currentUrl = page.url();
    expect(currentUrl).toContain('/log-history');

    console.log('✅ Log history page loaded');

    // Verify no unexpected console errors
    const unexpectedErrors = filterNetworkErrors(consoleErrors);
    expect(unexpectedErrors.length).toBe(0);
  });
});
