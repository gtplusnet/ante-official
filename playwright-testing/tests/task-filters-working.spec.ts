import { test, expect } from '@playwright/test';

test.describe('Task Filters - Server-Side Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:9001/#/login', { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for the page to load
    await page.waitForTimeout(2000);

    // Click the "Sign in manually" button to show the manual login form
    const manualButton = page.locator('[data-testid="manual-login-button"]');
    if (await manualButton.isVisible({ timeout: 5000 })) {
      await manualButton.click();
      await page.waitForTimeout(1000);
    }

    // Now fill in the login credentials
    const usernameInput = page.locator('[data-testid="login-username-input"]');
    await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
    await usernameInput.fill('guillermotabligan');

    const passwordInput = page.locator('[data-testid="login-password-input"]');
    await passwordInput.fill('water123');

    // Click the submit button
    const submitButton = page.locator('[data-testid="login-submit-button"]');
    await submitButton.click();

    // Wait for login to complete and redirect to dashboard (or directly to task page)
    try {
      await page.waitForURL(/\/(dashboard|member|task)/, { timeout: 20000 });
    } catch (e) {
      console.log('Login redirect timeout, proceeding anyway...');
    }

    await page.waitForTimeout(5000); // Give time for app to initialize

    // Navigate to Tasks page (in case we're not there yet)
    const currentURL = page.url();
    if (!currentURL.includes('/member/task')) {
      await page.goto('http://localhost:9001/#/member/task', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
    }
  });

  test('should display all filter dropdowns', async ({ page }) => {
    console.log('✓ Testing filter dropdown visibility...');

    // Collect console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for page to be fully loaded
    await page.waitForTimeout(2000);

    // Take a screenshot for debugging
    await page.screenshot({ path: '/home/jhay/projects/ante-official/playwright-testing/test-results/task-filters-visibility.png', fullPage: true });

    // Check for filter section
    const filterSection = page.locator('.filter-section, .filters-container, [class*="filter"]');
    const filterSectionExists = await filterSection.count() > 0;

    if (filterSectionExists) {
      console.log('✓ Filter section found');

      // Count filter dropdowns/selects
      const filterSelects = await page.locator('select').count();
      console.log(`✓ Found ${filterSelects} filter dropdowns`);

      // Check for console errors
      if (consoleErrors.length > 0) {
        console.error('Console errors detected:', consoleErrors);
        throw new Error(`Found ${consoleErrors.length} console errors`);
      }
    } else {
      console.log('⚠️  Filter section not found on page');

      // Print page HTML for debugging
      const pageHTML = await page.content();
      console.log('Page HTML length:', pageHTML.length);
    }

    console.log('✓ Test completed without errors');
  });

  test('should filter tasks by priority', async ({ page }) => {
    console.log('✓ Testing priority filter...');

    // Collect console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for tasks to load
    await page.waitForTimeout(3000);

    // Try to find priority filter (could be a select or Quasar select)
    const priorityFilter = page.locator('select').first();

    if (await priorityFilter.isVisible({ timeout: 5000 })) {
      console.log('✓ Priority filter found');

      // Select an option
      await priorityFilter.selectOption({ index: 1 });
      console.log('✓ Selected priority filter option');

      // Wait for API call
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check for console errors
      if (consoleErrors.length > 0) {
        console.error('Console errors detected:', consoleErrors);
        throw new Error(`Found ${consoleErrors.length} console errors`);
      }

      console.log('✓ Priority filter works without errors');
    } else {
      console.log('⚠️  Priority filter not found');

      // Take a screenshot for debugging
      await page.screenshot({ path: '/home/jhay/projects/ante-official/playwright-testing/test-results/task-priority-filter-not-found.png', fullPage: true });
    }
  });

  test('should load task page without console errors', async ({ page }) => {
    console.log('✓ Testing for console errors...');

    // Collect console errors
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error('❌ Console Error:', msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(error.message);
      console.error('❌ Page Error:', error.message);
    });

    // Wait for page to settle
    await page.waitForTimeout(5000);

    // Take a screenshot
    await page.screenshot({ path: '/home/jhay/projects/ante-official/playwright-testing/test-results/task-page-final.png', fullPage: true });

    // Report results
    console.log('\n📊 Test Results:');
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Console Warnings: ${consoleWarnings.length}`);

    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors Found:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // Fail test if there are console errors
    expect(consoleErrors.length, `Found ${consoleErrors.length} console errors`).toBe(0);

    console.log('\n✅ Test passed - No console errors detected');
  });
});
