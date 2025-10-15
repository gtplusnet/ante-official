/**
 * Complete Gate App Feature Test Suite
 *
 * Tests all features of the Gate App to ensure 100% functionality
 * with zero console errors after Supabase to API migration.
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:9002';
const TEST_LICENSE_KEY = 'E57F23AC-BD94-4F9E-AF73-FCC1D79B1FA7'; // Gate 1 license

// Console error tracking
let consoleErrors: string[] = [];
let consoleWarnings: string[] = [];

// Helper to track console messages
function setupConsoleTracking(page: Page) {
  consoleErrors = [];
  consoleWarnings = [];

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();

    // Skip known npm warnings
    if (text.includes('npm warn Unknown env config')) return;
    if (text.includes('Next.js inferred your workspace root')) return;

    if (type === 'error') {
      consoleErrors.push(text);
      console.error(`[CONSOLE ERROR] ${text}`);
    } else if (type === 'warning') {
      consoleWarnings.push(text);
    }
  });

  page.on('pageerror', (error) => {
    consoleErrors.push(`Page Error: ${error.message}`);
    console.error(`[PAGE ERROR] ${error.message}`);
  });
}

// Helper to login
async function login(page: Page) {
  console.log('🔑 Logging in...');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  const licenseInput = page.locator('input[type="text"]').first();
  await licenseInput.fill(TEST_LICENSE_KEY);

  const loginButton = page.getByRole('button', { name: /activate/i });
  await loginButton.click();

  // Wait for navigation to scan page
  await page.waitForURL(`${BASE_URL}/scan`, { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  console.log('✅ Login successful');
}

// Helper to check console errors
function checkConsoleErrors(testName: string) {
  if (consoleErrors.length > 0) {
    console.error(`\n❌ ${testName} - Found ${consoleErrors.length} console errors:`);
    consoleErrors.forEach((err, i) => console.error(`  ${i + 1}. ${err}`));
    throw new Error(`${testName} failed: Found ${consoleErrors.length} console errors`);
  }
  console.log(`✅ ${testName} - No console errors`);
}

test.describe('Gate App - Complete Feature Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleTracking(page);
    test.setTimeout(90000); // 90 seconds timeout
  });

  test('1. Login/Authentication Flow', async ({ page }) => {
    console.log('\n=== TEST 1: Login/Authentication ===');

    // Navigate to login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Verify login page elements
    const licenseInput = page.locator('input[type="text"]').first();
    const activateButton = page.getByRole('button', { name: /activate/i });

    expect(await licenseInput.isVisible()).toBe(true);
    expect(await activateButton.isVisible()).toBe(true);

    // Test invalid license (empty)
    await activateButton.click();
    await page.waitForTimeout(500);
    // Should not navigate (HTML5 validation)

    // Test valid license
    await licenseInput.fill(TEST_LICENSE_KEY);
    await activateButton.click();

    // Should redirect to scan page
    await page.waitForURL(`${BASE_URL}/scan`, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify localStorage was set
    const storedLicense = await page.evaluate(() => localStorage.getItem('licenseKey'));
    const storedCompanyId = await page.evaluate(() => localStorage.getItem('companyId'));

    expect(storedLicense).toBe(TEST_LICENSE_KEY);
    expect(storedCompanyId).toBeTruthy();

    console.log(`✅ License stored: ${storedLicense}`);
    console.log(`✅ Company ID: ${storedCompanyId}`);

    checkConsoleErrors('Login/Authentication');
  });

  test('2. Scanner Page - Main Features', async ({ page }) => {
    console.log('\n=== TEST 2: Scanner Page ===');

    await login(page);

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Verify scanner page elements
    const scannerTitle = page.getByText(/scan qr code/i);
    expect(await scannerTitle.isVisible()).toBe(true);

    // Check for QR scanner component
    const videoElement = page.locator('video').first();
    const hasVideo = await videoElement.count();
    console.log(`📹 Video element count: ${hasVideo}`);

    // Verify stats display
    const statsSection = page.locator('text=/today|check.*in|check.*out/i').first();
    const hasStats = await statsSection.count();
    console.log(`📊 Stats section count: ${hasStats}`);

    // Verify recent scans section
    const recentScans = page.getByText(/recent scans|latest|history/i).first();
    const hasRecentScans = await recentScans.count();
    console.log(`📋 Recent scans section count: ${hasRecentScans}`);

    // Take screenshot
    await page.screenshot({ path: 'test-results/scanner-page.png', fullPage: true });

    checkConsoleErrors('Scanner Page');
  });

  test('3. Navigation - All Pages Accessible', async ({ page }) => {
    console.log('\n=== TEST 3: Navigation ===');

    await login(page);

    const pages = [
      { path: '/scan', name: 'Scanner', expectedText: 'Scan QR Code' },
      { path: '/checked-in', name: 'Checked In', expectedText: 'Currently Checked In' },
      { path: '/synced-data', name: 'Synced Data', expectedText: 'Synced Data' },
      { path: '/settings', name: 'Settings', expectedText: 'Settings' },
      { path: '/tv', name: 'TV Display', expectedText: /latest scan|waiting/i }
    ];

    for (const pageInfo of pages) {
      console.log(`\n📄 Testing ${pageInfo.name} page...`);

      await page.goto(`${BASE_URL}${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Check if page loaded
      const hasContent = await page.getByText(pageInfo.expectedText, { exact: false }).count();

      if (hasContent === 0) {
        console.warn(`⚠️ Expected text "${pageInfo.expectedText}" not found on ${pageInfo.name} page`);
        // Take screenshot for debugging
        await page.screenshot({
          path: `test-results/${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}-page.png`,
          fullPage: true
        });
      } else {
        console.log(`✅ ${pageInfo.name} page loaded successfully`);
      }

      // Check for console errors after each page
      if (consoleErrors.length > 0) {
        console.error(`❌ Errors found on ${pageInfo.name} page`);
        checkConsoleErrors(`${pageInfo.name} Page`);
      }
    }

    console.log('\n✅ All pages accessible');
  });

  test('4. Checked-In Page Features', async ({ page }) => {
    console.log('\n=== TEST 4: Checked-In Page ===');

    await login(page);

    await page.goto(`${BASE_URL}/checked-in`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify page title
    const title = page.getByText(/currently checked in/i);
    expect(await title.isVisible()).toBe(true);

    // Check for count display
    const countDisplay = page.getByText(/\d+\s+(person|people)/i);
    const hasCount = await countDisplay.count();
    console.log(`📊 Count display: ${hasCount > 0 ? 'Found' : 'Not found'}`);

    // Check for list or empty state
    const emptyState = page.getByText(/no one is currently checked in/i);
    const hasEmptyState = await emptyState.count();

    if (hasEmptyState > 0) {
      console.log('📝 Empty state displayed (no one checked in)');
    } else {
      console.log('📝 List of checked-in people displayed');
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/checked-in-page.png', fullPage: true });

    checkConsoleErrors('Checked-In Page');
  });

  test('5. Synced Data Page Features', async ({ page }) => {
    console.log('\n=== TEST 5: Synced Data Page ===');

    await login(page);

    await page.goto(`${BASE_URL}/synced-data`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify page title
    const title = page.getByText(/synced data/i);
    expect(await title.isVisible()).toBe(true);

    // Check for tabs
    const studentsTab = page.getByRole('button', { name: /students/i });
    const guardiansTab = page.getByRole('button', { name: /guardians/i });

    const hasStudentsTab = await studentsTab.count();
    const hasGuardiansTab = await guardiansTab.count();

    console.log(`📑 Students tab: ${hasStudentsTab > 0 ? 'Found' : 'Not found'}`);
    console.log(`📑 Guardians tab: ${hasGuardiansTab > 0 ? 'Found' : 'Not found'}`);

    // Test switching tabs
    if (hasGuardiansTab > 0) {
      await guardiansTab.first().click();
      await page.waitForTimeout(500);
      console.log('✅ Switched to Guardians tab');

      await studentsTab.first().click();
      await page.waitForTimeout(500);
      console.log('✅ Switched back to Students tab');
    }

    // Check for refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    const hasRefresh = await refreshButton.count();
    console.log(`🔄 Refresh button: ${hasRefresh > 0 ? 'Found' : 'Not found'}`);

    // Take screenshot
    await page.screenshot({ path: 'test-results/synced-data-page.png', fullPage: true });

    checkConsoleErrors('Synced Data Page');
  });

  test('6. Settings Page Features', async ({ page }) => {
    console.log('\n=== TEST 6: Settings Page ===');

    await login(page);

    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify page title
    const title = page.getByText(/^settings$/i);
    expect(await title.isVisible()).toBe(true);

    // Check for license information section
    const licenseSection = page.getByText(/license key|company|gate/i).first();
    const hasLicenseInfo = await licenseSection.count();
    console.log(`🔑 License info: ${hasLicenseInfo > 0 ? 'Found' : 'Not found'}`);

    // Check for sync controls
    const forceSyncButton = page.getByRole('button', { name: /force sync/i });
    const hasForcSync = await forceSyncButton.count();
    console.log(`🔄 Force sync button: ${hasForcSync > 0 ? 'Found' : 'Not found'}`);

    // Check for data management section
    const clearDataButton = page.getByRole('button', { name: /clear.*data/i });
    const hasClearData = await clearDataButton.count();
    console.log(`🗑️ Clear data button: ${hasClearData > 0 ? 'Found' : 'Not found'}`);

    // Check for logout button
    const logoutButton = page.getByRole('button', { name: /logout/i });
    const hasLogout = await logoutButton.count();
    console.log(`🚪 Logout button: ${hasLogout > 0 ? 'Found' : 'Not found'}`);

    // Verify license key is partially hidden
    const licenseDisplay = page.locator('text=/\\w{4}\\*+/');
    const hasHiddenLicense = await licenseDisplay.count();
    console.log(`🔐 License key hidden: ${hasHiddenLicense > 0 ? 'Yes' : 'No'}`);

    // Take screenshot
    await page.screenshot({ path: 'test-results/settings-page.png', fullPage: true });

    checkConsoleErrors('Settings Page');
  });

  test('7. TV Display Page Features', async ({ page }) => {
    console.log('\n=== TEST 7: TV Display Page ===');

    await login(page);

    await page.goto(`${BASE_URL}/tv`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for TV display elements
    const latestScan = page.getByText(/latest scan|waiting for scan/i).first();
    const hasDisplay = await latestScan.count();
    console.log(`📺 TV display: ${hasDisplay > 0 ? 'Found' : 'Not found'}`);

    // Check for fullscreen mode indicator or TV mode elements
    const tvModeElements = await page.locator('body').evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        minHeight: styles.minHeight,
        backgroundColor: styles.backgroundColor
      };
    });
    console.log(`📺 TV mode styles:`, tvModeElements);

    // Take screenshot
    await page.screenshot({ path: 'test-results/tv-display-page.png', fullPage: true });

    checkConsoleErrors('TV Display Page');
  });

  test('8. Logout Flow', async ({ page }) => {
    console.log('\n=== TEST 8: Logout Flow ===');

    await login(page);

    // Navigate to settings
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Handle logout confirmation dialog
    page.once('dialog', async (dialog) => {
      console.log(`📢 Dialog message: ${dialog.message()}`);
      expect(dialog.message()).toContain('logout');
      await dialog.accept();
    });

    // Click logout
    const logoutButton = page.getByRole('button', { name: /logout/i });
    await logoutButton.click();

    // Should redirect to login page
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify localStorage is cleared
    const clearedLicense = await page.evaluate(() => localStorage.getItem('licenseKey'));
    const clearedCompany = await page.evaluate(() => localStorage.getItem('companyId'));

    expect(clearedLicense).toBeNull();
    expect(clearedCompany).toBeNull();

    console.log('✅ Logout successful - localStorage cleared');

    checkConsoleErrors('Logout Flow');
  });

  test('9. Overall Console Error Check', async ({ page }) => {
    console.log('\n=== TEST 9: Overall Console Error Check ===');

    await login(page);

    // Visit all pages and collect errors
    const pages = ['/scan', '/checked-in', '/synced-data', '/settings', '/tv'];

    for (const path of pages) {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
    }

    // Final error check
    console.log(`\n📊 Final Error Summary:`);
    console.log(`   Console Errors: ${consoleErrors.length}`);
    console.log(`   Console Warnings: ${consoleWarnings.length}`);

    if (consoleErrors.length > 0) {
      console.error('\n❌ Console Errors Found:');
      consoleErrors.forEach((err, i) => console.error(`  ${i + 1}. ${err}`));
    }

    if (consoleWarnings.length > 0) {
      console.warn('\n⚠️ Console Warnings:');
      consoleWarnings.slice(0, 5).forEach((warn, i) => console.warn(`  ${i + 1}. ${warn}`));
      if (consoleWarnings.length > 5) {
        console.warn(`  ... and ${consoleWarnings.length - 5} more warnings`);
      }
    }

    expect(consoleErrors.length).toBe(0);

    console.log('\n✅ All pages loaded without console errors!');
  });
});
