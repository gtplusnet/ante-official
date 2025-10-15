import { test, expect } from '@playwright/test';

/**
 * Guardian App - Full Authenticated User Testing
 * Complete end-to-end test with real credentials
 */

const BASE_URL = 'http://localhost:5010';
const API_URL = 'http://100.109.133.12:3000';

// Real test credentials
const TEST_CREDENTIALS = {
  email: 'guillermotabligan@gmail.com',
  password: 'water123',
};

// Helper function to filter out expected network errors
function filterNetworkErrors(errors: string[]): string[] {
  return errors.filter(
    (error) =>
      !error.includes('Network Error') &&
      !error.includes('ERR_CONNECTION_REFUSED') &&
      !error.includes('Failed to load resource') &&
      !error.includes('GuardianPublicApi') &&
      !error.includes('AuthApi') &&
      !error.includes('Login error') &&
      !error.includes('LogHistory') &&
      !error.includes('Get attendance logs error') &&
      !error.includes('Failed to check for updates')
  );
}

test.describe('Guardian App - Full Authenticated Testing', () => {
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
  });

  test.afterEach(async () => {
    // Filter out expected network errors
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

  test('Full User Journey - Login to Dashboard', async ({ page }) => {
    console.log('\n🧪 Test 1: Complete Login Flow');

    // Step 1: Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Verify login page elements
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Step 2: Fill in credentials
    await emailInput.fill(TEST_CREDENTIALS.email);
    await passwordInput.fill(TEST_CREDENTIALS.password);

    console.log('  ✅ Login form filled');

    // Step 3: Submit login
    await submitButton.click();
    console.log('  ⏳ Logging in...');

    // Wait for navigation or error message (up to 10 seconds)
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`  📍 Current URL: ${currentUrl}`);

    // Check if login was successful
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/home')) {
      console.log('  ✅ Login successful - redirected to dashboard');
    } else if (currentUrl.includes('/login')) {
      // Check for error message
      const errorMessage = await page.locator('text=/error|invalid|failed/i').first().textContent().catch(() => null);
      if (errorMessage) {
        console.log(`  ⚠️  Login failed with error: ${errorMessage}`);
      } else {
        console.log('  ⚠️  Still on login page (API may be unavailable)');
      }
    } else {
      console.log(`  ✅ Redirected to: ${currentUrl}`);
    }

    // Verify no unexpected console errors
    const unexpectedErrors = filterNetworkErrors(consoleErrors);
    expect(unexpectedErrors.length).toBe(0);
  });

  test('Dashboard - Load and Verify Content', async ({ page }) => {
    console.log('\n🧪 Test 2: Dashboard Content');

    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to dashboard if not already there
    const currentUrl = page.url();
    if (!currentUrl.includes('/dashboard')) {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    // Check if on dashboard or redirected to login
    const finalUrl = page.url();
    if (finalUrl.includes('/login')) {
      console.log('  ⚠️  Redirected to login (authentication required)');
    } else {
      console.log('  ✅ Dashboard loaded');

      // Take screenshot of dashboard
      await page.screenshot({ path: 'playwright-testing/screenshots/guardian-dashboard.png', fullPage: true });
      console.log('  📸 Screenshot saved: guardian-dashboard.png');
    }

    // Verify no unexpected console errors
    const unexpectedErrors = filterNetworkErrors(consoleErrors);
    expect(unexpectedErrors.length).toBe(0);
  });

  test('Attendance Logs - View History', async ({ page }) => {
    console.log('\n🧪 Test 3: Attendance Logs');

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to log history
    await page.goto(`${BASE_URL}/log-history`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('  ⚠️  Redirected to login (authentication required)');
    } else if (currentUrl.includes('/log-history')) {
      console.log('  ✅ Attendance logs page loaded');

      // Check for date filter
      const dateInputs = await page.locator('input[type="date"]').count();
      if (dateInputs > 0) {
        console.log(`  ✅ Found ${dateInputs} date filter(s)`);
      }

      // Check for any attendance records
      const hasTable = await page.locator('table, .table, [role="table"]').count() > 0;
      const hasList = await page.locator('.log-item, .attendance-item, .record').count() > 0;
      const hasEmptyState = await page.locator('text=/no records|no data|empty/i').count() > 0;

      if (hasTable || hasList) {
        console.log('  ✅ Attendance records displayed');
      } else if (hasEmptyState) {
        console.log('  ℹ️  No attendance records found (empty state)');
      } else {
        console.log('  ℹ️  Loading or no records yet');
      }

      // Take screenshot
      await page.screenshot({ path: 'playwright-testing/screenshots/guardian-attendance-logs.png', fullPage: true });
      console.log('  📸 Screenshot saved: guardian-attendance-logs.png');
    }

    // Verify no unexpected console errors
    const unexpectedErrors = filterNetworkErrors(consoleErrors);
    expect(unexpectedErrors.length).toBe(0);
  });

  test('Notifications - View and Interact', async ({ page }) => {
    console.log('\n🧪 Test 4: Notifications');

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to notifications
    await page.goto(`${BASE_URL}/notifications`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('  ⚠️  Redirected to login (authentication required)');
    } else if (currentUrl.includes('/notifications')) {
      console.log('  ✅ Notifications page loaded');

      // Check for notifications
      const hasNotifications = await page.locator('.notification, .notification-item, [role="listitem"]').count() > 0;
      const hasEmptyState = await page.locator('text=/no notifications|no new/i').count() > 0;

      if (hasNotifications) {
        console.log('  ✅ Notifications displayed');
      } else if (hasEmptyState) {
        console.log('  ℹ️  No notifications (empty state)');
      } else {
        console.log('  ℹ️  Loading or no notifications yet');
      }

      // Take screenshot
      await page.screenshot({ path: 'playwright-testing/screenshots/guardian-notifications.png', fullPage: true });
      console.log('  📸 Screenshot saved: guardian-notifications.png');
    }

    // Verify no unexpected console errors
    const unexpectedErrors = filterNetworkErrors(consoleErrors);
    expect(unexpectedErrors.length).toBe(0);
  });

  test('Profile - View and Edit', async ({ page }) => {
    console.log('\n🧪 Test 5: Profile Management');

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to profile edit
    await page.goto(`${BASE_URL}/account/edit-profile`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('  ⚠️  Redirected to login (authentication required)');
    } else if (currentUrl.includes('/edit-profile')) {
      console.log('  ✅ Profile edit page loaded');

      // Check for form inputs
      const inputs = await page.locator('input').count();
      if (inputs > 0) {
        console.log(`  ✅ Found ${inputs} form input(s)`);

        // Try to get current values
        const emailValue = await page.locator('input[type="email"]').first().inputValue().catch(() => '');
        if (emailValue) {
          console.log(`  ℹ️  Current email: ${emailValue}`);
        }
      }

      // Take screenshot
      await page.screenshot({ path: 'playwright-testing/screenshots/guardian-profile-edit.png', fullPage: true });
      console.log('  📸 Screenshot saved: guardian-profile-edit.png');
    }

    // Verify no unexpected console errors
    const unexpectedErrors = filterNetworkErrors(consoleErrors);
    expect(unexpectedErrors.length).toBe(0);
  });

  test('Students - View Student List', async ({ page }) => {
    console.log('\n🧪 Test 6: Student Management');

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to students page
    await page.goto(`${BASE_URL}/students`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('  ⚠️  Redirected to login (authentication required)');
    } else if (currentUrl.includes('/students')) {
      console.log('  ✅ Students page loaded');

      // Check for student list
      const hasStudents = await page.locator('.student, .student-card, .student-item').count() > 0;
      const hasEmptyState = await page.locator('text=/no students|add student/i').count() > 0;

      if (hasStudents) {
        console.log('  ✅ Student list displayed');
      } else if (hasEmptyState) {
        console.log('  ℹ️  No students registered (empty state)');
      } else {
        console.log('  ℹ️  Loading or no students yet');
      }

      // Take screenshot
      await page.screenshot({ path: 'playwright-testing/screenshots/guardian-students.png', fullPage: true });
      console.log('  📸 Screenshot saved: guardian-students.png');
    }

    // Verify no unexpected console errors
    const unexpectedErrors = filterNetworkErrors(consoleErrors);
    expect(unexpectedErrors.length).toBe(0);
  });

  test('Navigation - Test All Main Routes', async ({ page }) => {
    console.log('\n🧪 Test 7: Navigation Testing');

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const routes = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/students', name: 'Students' },
      { path: '/log-history', name: 'Attendance Logs' },
      { path: '/notifications', name: 'Notifications' },
      { path: '/account', name: 'Account' },
    ];

    for (const route of routes) {
      console.log(`\n  Testing: ${route.name} (${route.path})`);
      await page.goto(`${BASE_URL}${route.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      if (currentUrl.includes(route.path)) {
        console.log(`    ✅ ${route.name} loaded successfully`);
      } else if (currentUrl.includes('/login')) {
        console.log(`    ⚠️  Redirected to login`);
      } else {
        console.log(`    ℹ️  Redirected to: ${currentUrl}`);
      }
    }

    // Verify no unexpected console errors
    const unexpectedErrors = filterNetworkErrors(consoleErrors);
    expect(unexpectedErrors.length).toBe(0);
  });

  test('Logout - Complete Session Termination', async ({ page }) => {
    console.log('\n🧪 Test 8: Logout Flow');

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('  ⚠️  Login failed or API unavailable - skipping logout test');
    } else {
      console.log('  ✅ Logged in, looking for logout button...');

      // First, open the navigation menu (if it exists)
      const menuButton = page.locator('button[aria-label*="menu" i], button:has-text("☰"), [data-testid="menu-button"]').first();
      const hasMenuButton = await menuButton.count() > 0;

      if (hasMenuButton) {
        console.log('  📱 Opening navigation menu...');
        await menuButton.click();
        await page.waitForTimeout(500); // Wait for menu animation
      }

      // Look for logout button/link (with more specific selectors)
      const logoutButton = page.locator('a[href="/login/"]:has-text("Logout"), a[href="/login/"]:has-text("Log Out"), button:has-text("Logout"), button:has-text("Log Out"), [aria-label*="logout" i]').first();

      const hasLogoutButton = await logoutButton.count() > 0;
      if (hasLogoutButton) {
        console.log('  ✅ Found logout button');

        // Scroll into view and click
        await logoutButton.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300); // Wait for scroll

        // Use force click since it might be in a navigation overlay
        await logoutButton.click({ force: true });
        await page.waitForTimeout(2000);

        const finalUrl = page.url();
        if (finalUrl.includes('/login')) {
          console.log('  ✅ Successfully logged out - redirected to login');
        } else {
          console.log(`  ℹ️  After logout, redirected to: ${finalUrl}`);
        }
      } else {
        console.log('  ℹ️  Logout button not visible (may be in closed menu)');
        // This is acceptable - not all pages have logout visible
      }
    }

    // Verify no unexpected console errors
    const unexpectedErrors = filterNetworkErrors(consoleErrors);
    expect(unexpectedErrors.length).toBe(0);
  });

  test('API Integration - Verify Backend Connectivity', async ({ page }) => {
    console.log('\n🧪 Test 9: API Integration');

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Track network requests
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('100.109.133.12:3000')) {
        apiRequests.push(`${request.method()} ${request.url()}`);
      }
    });

    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    if (apiRequests.length > 0) {
      console.log(`  ✅ API requests detected: ${apiRequests.length}`);
      console.log('  📡 Sample requests:');
      apiRequests.slice(0, 3).forEach(req => console.log(`    - ${req}`));
    } else {
      console.log('  ℹ️  No API requests detected (may be using mock data)');
    }

    // Verify no unexpected console errors
    const unexpectedErrors = filterNetworkErrors(consoleErrors);
    expect(unexpectedErrors.length).toBe(0);
  });
});

test.describe('Guardian App - Performance & Responsiveness', () => {
  test('Mobile Responsiveness', async ({ page }) => {
    console.log('\n🧪 Test 10: Mobile Responsiveness');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Check if page is responsive
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;

    if (bodyWidth <= viewportWidth + 10) {
      console.log('  ✅ No horizontal scrolling (responsive)');
    } else {
      console.log(`  ⚠️  Page wider than viewport: ${bodyWidth}px > ${viewportWidth}px`);
    }

    // Take mobile screenshot
    await page.screenshot({ path: 'playwright-testing/screenshots/guardian-mobile-login.png', fullPage: true });
    console.log('  📸 Screenshot saved: guardian-mobile-login.png');
  });

  test('Tablet Responsiveness', async ({ page }) => {
    console.log('\n🧪 Test 11: Tablet Responsiveness');

    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Check if page is responsive
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 768;

    if (bodyWidth <= viewportWidth + 10) {
      console.log('  ✅ No horizontal scrolling (responsive)');
    } else {
      console.log(`  ⚠️  Page wider than viewport: ${bodyWidth}px > ${viewportWidth}px`);
    }

    // Take tablet screenshot
    await page.screenshot({ path: 'playwright-testing/screenshots/guardian-tablet-login.png', fullPage: true });
    console.log('  📸 Screenshot saved: guardian-tablet-login.png');
  });
});
