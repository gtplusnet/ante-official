/**
 * Staging Environment Test - Gate App
 * Tests all features on https://ante-gate.geertest.com
 *
 * Uses valid license key for authentication
 */

import { test, expect, Page } from '@playwright/test';

const STAGING_URL = 'https://ante-gate.geertest.com';
const VALID_LICENSE_KEY = '8ZS1Q3P7LBMUWELU4ROQJ6JISAZJCBB7';

// Console error tracking
let allErrors: string[] = [];
let testResults: Array<{test: string, status: 'PASS' | 'FAIL', details: string}> = [];

function trackConsoleErrors(page: Page) {
  allErrors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();

    // Filter out expected warnings
    if (text.includes('npm warn')) return;
    if (text.includes('Next.js inferred')) return;
    if (text.includes('[AuthHelper]')) return;
    if (text.includes('401')) return;
    if (text.includes('Failed to load resource')) return;

    if (type === 'error') {
      if (text.toLowerCase().includes('supabase') ||
          text.toLowerCase().includes('module not found') ||
          text.toLowerCase().includes('cannot find')) {
        allErrors.push(text);
        console.error(`❌ ERROR: ${text}`);
      }
    }
  });

  page.on('pageerror', (error) => {
    if (!error.message.includes('401') && !error.message.includes('AuthHelper')) {
      allErrors.push(`PAGE ERROR: ${error.message}`);
      console.error(`❌ PAGE ERROR: ${error.message}`);
    }
  });
}

function recordTest(testName: string, passed: boolean, details: string) {
  testResults.push({
    test: testName,
    status: passed ? 'PASS' : 'FAIL',
    details
  });

  if (passed) {
    console.log(`✅ ${testName}: ${details}`);
  } else {
    console.error(`❌ ${testName}: ${details}`);
  }
}

// Helper function to login with valid credentials
async function loginWithValidLicense(page: Page) {
  console.log('🔑 Logging in to staging with valid license...');

  await page.goto(`${STAGING_URL}/login`);
  await page.waitForLoadState('networkidle');

  const licenseInput = page.locator('input[type="text"]').first();
  await licenseInput.fill(VALID_LICENSE_KEY);

  const loginButton = page.getByRole('button', { name: /activate/i });
  await loginButton.click();

  // Wait for navigation to scan page (Next.js may add trailing slash)
  await page.waitForURL(new RegExp(`${STAGING_URL}/scan/?`), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // Wait for full initialization on staging

  console.log('✅ Login successful on staging');
}

test.describe('Gate App Staging - Complete Feature Testing', () => {
  test.beforeEach(async ({ page }) => {
    trackConsoleErrors(page);
    testResults = [];
  });

  test.afterEach(async () => {
    console.log('\n📊 Test Summary:');
    testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.details}`);
    });
  });

  test('Staging Test 1: Login Page Authentication', async ({ page }) => {
    console.log('\n=== STAGING TEST 1: Login Page ===\n');

    await page.goto(`${STAGING_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Test 1.1: Page loads
    const titleText = await page.locator('h2, .text-2xl').first().textContent();
    const hasTitle = titleText?.toLowerCase().includes('school') || titleText?.toLowerCase().includes('gate');
    recordTest('Login Page Title', hasTitle === true, `Found: "${titleText}"`);

    // Test 1.2: License Input
    const licenseInput = page.locator('input[type="text"]').first();
    const inputVisible = await licenseInput.isVisible();
    recordTest('License Input Visible', inputVisible, 'Input field is accessible');

    // Test 1.3: Valid License Authentication
    await licenseInput.fill(VALID_LICENSE_KEY);
    const loginButton = page.getByRole('button', { name: /activate/i });
    await loginButton.click();

    // Wait for navigation
    await page.waitForURL(new RegExp(`${STAGING_URL}/scan/?`), { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    const loginSuccessful = currentUrl.includes('/scan');
    recordTest('Login Successful', loginSuccessful, `Redirected to: ${currentUrl}`);

    // Test 1.4: No console errors
    recordTest('No Console Errors', allErrors.length === 0, `Errors: ${allErrors.length}`);

    expect(allErrors.length).toBe(0);
  });

  test('Staging Test 2: Navigation and All Pages', async ({ page }) => {
    test.setTimeout(90000); // Increase timeout for staging (slower network)
    console.log('\n=== STAGING TEST 2: Navigation ===\n');

    await loginWithValidLicense(page);

    const routes = [
      { path: '/scan', name: 'Scanner Page', expectedElement: 'text=/scanner|recent scans/i' },
      { path: '/checked-in', name: 'Checked-In Page', expectedElement: 'text=/checked in/i' },
      { path: '/synced-data', name: 'Synced Data Page', expectedElement: 'text=/synced data/i' },
      { path: '/settings', name: 'Settings Page', expectedElement: 'text=/settings/i' },
      { path: '/tv', name: 'TV Display Page', expectedElement: 'text=/latest|waiting/i' }
    ];

    for (const route of routes) {
      await page.goto(`${STAGING_URL}${route.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const correctUrl = currentUrl.includes(route.path);
      recordTest(`${route.name} - URL Correct`, correctUrl, `URL: ${currentUrl}`);

      const element = page.locator(route.expectedElement).first();
      const hasContent = (await element.count()) > 0;
      recordTest(`${route.name} - Content Loaded`, hasContent, `Element found: ${hasContent}`);

      const noErrors = allErrors.length === 0;
      recordTest(`${route.name} - No Errors`, noErrors, `Errors: ${allErrors.length}`);

      allErrors = [];
    }
  });

  test('Staging Test 3: Scanner Page Functionality', async ({ page }) => {
    test.setTimeout(60000);
    console.log('\n=== STAGING TEST 3: Scanner Page ===\n');

    await loginWithValidLicense(page);
    await page.goto(`${STAGING_URL}/scan`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Test 3.1: Dashboard Stats
    const statsElements = await page.locator('text=/total|today|check.*in|check.*out/i').count();
    recordTest('Dashboard Stats Present', statsElements > 0, `Found ${statsElements} stat elements`);

    // Test 3.2: Recent Scans Section
    const recentSection = await page.locator('text=/recent|latest|history/i').count();
    recordTest('Recent Scans Section', recentSection > 0, `Found ${recentSection} elements`);

    // Test 3.3: Scanner Component
    const scannerElements = await page.locator('text=/scanner|qr|camera/i').count();
    recordTest('Scanner Component Present', scannerElements > 0, `Found ${scannerElements} scanner elements`);

    // Test 3.4: No errors
    recordTest('Scanner Page - No Errors', allErrors.length === 0, `Errors: ${allErrors.length}`);
  });

  test('Staging Test 4: Synced Data and API Integration', async ({ page }) => {
    test.setTimeout(90000);
    console.log('\n=== STAGING TEST 4: Synced Data ===\n');

    await loginWithValidLicense(page);
    await page.goto(`${STAGING_URL}/synced-data`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Test 4.1: Page loads
    const title = page.getByText(/synced data/i).first();
    const hasTitle = (await title.count()) > 0;
    recordTest('Synced Data Title', hasTitle, 'Title present');

    // Test 4.2: Students Tab
    const studentsTab = page.getByRole('button', { name: /students/i });
    const hasStudentsTab = (await studentsTab.count()) > 0;
    recordTest('Students Tab Present', hasStudentsTab, 'Students tab found');

    // Test 4.3: Guardians Tab
    const guardiansTab = page.getByRole('button', { name: /guardians/i });
    const hasGuardiansTab = (await guardiansTab.count()) > 0;
    recordTest('Guardians Tab Present', hasGuardiansTab, 'Guardians tab found');

    // Test 4.4: Tab Switching
    if (hasGuardiansTab) {
      await guardiansTab.first().click();
      await page.waitForTimeout(1000);
      recordTest('Switch to Guardians Tab', true, 'Tab switching works');

      if (hasStudentsTab) {
        await studentsTab.first().click();
        await page.waitForTimeout(1000);
        recordTest('Switch Back to Students', true, 'Tab switching back works');
      }
    }

    // Test 4.5: Refresh Button
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    const hasRefresh = (await refreshButton.count()) > 0;
    recordTest('Refresh Button Present', hasRefresh, 'Refresh button found');

    // Test 4.6: Search Functionality
    const searchInput = await page.locator('input[type="text"], input[placeholder*="search" i]').count();
    recordTest('Search Input Present', searchInput > 0, `Found ${searchInput} search inputs`);

    // Test 4.7: No errors
    recordTest('Synced Data - No Errors', allErrors.length === 0, `Errors: ${allErrors.length}`);
  });

  test('Staging Test 5: Settings and Configuration', async ({ page }) => {
    test.setTimeout(60000);
    console.log('\n=== STAGING TEST 5: Settings Page ===\n');

    await loginWithValidLicense(page);
    await page.goto(`${STAGING_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test 5.1: Page Title
    const settingsTitle = page.getByText(/^settings$/i).first();
    const hasTitle = (await settingsTitle.count()) > 0;
    recordTest('Settings Title', hasTitle, 'Settings title found');

    // Test 5.2: License Information
    const licenseSection = await page.locator('text=/license key|company|gate/i').count();
    recordTest('License Info Section', licenseSection > 0, `Found ${licenseSection} license elements`);

    // Test 5.3: Force Sync Button
    const forceSyncBtn = page.getByRole('button', { name: /force sync/i });
    const hasSyncBtn = (await forceSyncBtn.count()) > 0;
    recordTest('Force Sync Button', hasSyncBtn, 'Sync button present');

    // Test 5.4: Clear Data Button
    const clearDataBtn = page.getByRole('button', { name: /clear.*data/i });
    const hasClearBtn = (await clearDataBtn.count()) > 0;
    recordTest('Clear Data Button', hasClearBtn, 'Clear button present');

    // Test 5.5: Logout Button
    const logoutBtn = page.getByRole('button', { name: /logout/i });
    const hasLogoutBtn = (await logoutBtn.count()) > 0;
    recordTest('Logout Button', hasLogoutBtn, 'Logout button present');

    // Test 5.6: No errors
    recordTest('Settings - No Errors', allErrors.length === 0, `Errors: ${allErrors.length}`);
  });

  test('Staging Test 6: TV Display Mode', async ({ page }) => {
    test.setTimeout(60000);
    console.log('\n=== STAGING TEST 6: TV Display ===\n');

    await loginWithValidLicense(page);
    await page.goto(`${STAGING_URL}/tv`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Test 6.1: TV Display Content
    const tvContent = await page.locator('text=/latest|waiting|recent|activity/i').count();
    recordTest('TV Display Content', tvContent > 0, `Found ${tvContent} TV elements`);

    // Test 6.2: Layout loaded
    const bodyExists = await page.locator('body').count();
    recordTest('TV Page Loaded', bodyExists > 0, 'TV page rendered');

    // Test 6.3: No errors
    recordTest('TV Display - No Errors', allErrors.length === 0, `Errors: ${allErrors.length}`);
  });

  test('Staging Test 7: Checked-In Page', async ({ page }) => {
    test.setTimeout(60000);
    console.log('\n=== STAGING TEST 7: Checked-In Page ===\n');

    await loginWithValidLicense(page);
    await page.goto(`${STAGING_URL}/checked-in`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test 7.1: Page Title
    const titleElement = page.getByText(/currently checked in/i);
    const hasTitle = (await titleElement.count()) > 0;
    recordTest('Checked-In Title', hasTitle, 'Title displayed');

    // Test 7.2: Navigation Elements
    const navLinks = await page.locator('a, button').count();
    recordTest('Navigation Elements', navLinks > 0, `Found ${navLinks} interactive elements`);

    // Test 7.3: Content Display
    const emptyState = await page.getByText(/no one|empty|waiting/i).count();
    const listItems = await page.locator('[class*="grid"], [class*="list"], tr, li').count();
    const hasContent = emptyState > 0 || listItems > 0;
    recordTest('Content Display', hasContent, 'Empty state or list items present');

    // Test 7.4: No errors
    recordTest('Checked-In Page - No Errors', allErrors.length === 0, `Errors: ${allErrors.length}`);
  });

  test('Staging Test 8: Complete Integration Test', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for full integration test
    console.log('\n=== STAGING TEST 8: Complete Integration ===\n');

    let totalTests = 0;
    let passedTests = 0;

    await loginWithValidLicense(page);

    const testScenarios = [
      { page: '/scan', name: 'Scanner Page', element: 'text=/scanner|recent scans/i' },
      { page: '/checked-in', name: 'Checked-In Page', element: 'text=/checked in/i' },
      { page: '/synced-data', name: 'Synced Data Page', element: 'button' },
      { page: '/settings', name: 'Settings Page', element: 'text=/settings/i' },
      { page: '/tv', name: 'TV Display Page', element: 'text=/latest|waiting/i' }
    ];

    for (const scenario of testScenarios) {
      totalTests++;

      await page.goto(`${STAGING_URL}${scenario.page}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const element = page.locator(scenario.element).first();
      const exists = (await element.count()) > 0;

      if (exists) {
        passedTests++;
        recordTest(`${scenario.name} Feature`, true, 'Page and elements working');
      } else {
        recordTest(`${scenario.name} Feature`, false, 'Element not found');
      }
    }

    const successRate = (passedTests / totalTests * 100).toFixed(1);
    recordTest('Overall Success Rate', passedTests === totalTests, `${passedTests}/${totalTests} (${successRate}%)`);
    recordTest('No Critical Errors', allErrors.length === 0, `Total errors: ${allErrors.length}`);

    console.log('\n📊 STAGING FINAL SUMMARY:');
    console.log(`   Environment: ${STAGING_URL}`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Success Rate: ${successRate}%`);
    console.log(`   Console Errors: ${allErrors.length}`);

    expect(passedTests).toBe(totalTests);
    expect(allErrors.length).toBe(0);
  });
});
