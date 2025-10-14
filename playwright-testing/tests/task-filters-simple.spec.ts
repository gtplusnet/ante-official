import { test, expect } from '@playwright/test';

test.describe('Task Filters - Console Error Check', () => {
  test('should load task page and filters without console errors', async ({ page }) => {
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

    console.log('🔍 Navigating to login page...');
    await page.goto('http://localhost:9001/#/login', { timeout: 60000 });
    await page.waitForTimeout(2000);

    console.log('🔍 Looking for login form...');
    // Try different selectors for username
    const usernameSelectors = [
      'input[type="text"]',
      'input[placeholder*="username" i]',
      'input[name="username"]',
      'input[aria-label*="username" i]',
      '.q-field input'
    ];

    let usernameInput;
    for (const selector of usernameSelectors) {
      try {
        usernameInput = page.locator(selector).first();
        if (await usernameInput.isVisible({ timeout: 2000 })) {
          console.log(`✓ Found username input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!usernameInput) {
      console.log('⚠️  Could not find username input, trying to navigate directly to tasks...');
      await page.goto('http://localhost:9001/#/member/task', { timeout: 60000 });
      await page.waitForTimeout(3000);
    } else {
      console.log('🔑 Logging in...');
      await usernameInput.fill('guillermotabligan');

      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill('water123');

      const loginButton = page.locator('button[type="submit"], button:has-text("Login")').first();
      await loginButton.click();

      console.log('⏳ Waiting for dashboard...');
      await page.waitForTimeout(5000);

      console.log('🔍 Navigating to tasks page...');
      await page.goto('http://localhost:9001/#/member/task', { timeout: 60000 });
      await page.waitForTimeout(3000);
    }

    console.log('✓ Page loaded');

    // Take a screenshot for debugging
    await page.screenshot({ path: '/home/jhay/projects/ante-official/playwright-testing/test-results/task-page.png', fullPage: true });
    console.log('✓ Screenshot saved');

    // Check for filter section
    const filterSection = page.locator('.filter-section');
    const filterSectionExists = await filterSection.count() > 0;

    if (filterSectionExists) {
      console.log('✓ Filter section found');

      // Count filter dropdowns
      const filterDropdowns = await page.locator('.filter-section select').count();
      console.log(`✓ Found ${filterDropdowns} filter dropdowns`);

      if (filterDropdowns > 0) {
        // Try to interact with first filter
        console.log('🔍 Testing priority filter interaction...');
        const priorityFilter = page.locator('.filter-section select').first();

        // Get available options
        const optionCount = await priorityFilter.locator('option').count();
        console.log(`✓ Priority filter has ${optionCount} options`);

        if (optionCount > 2) {
          // Select an option (not "none" or "all")
          await priorityFilter.selectOption({ index: 1 });
          console.log('✓ Selected priority filter option');

          // Wait for API call
          await page.waitForTimeout(2000);
          console.log('✓ Waited for filter to apply');
        }
      }
    } else {
      console.log('⚠️  Filter section not found on page');
    }

    // Wait a bit more to catch any delayed errors
    await page.waitForTimeout(2000);

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
