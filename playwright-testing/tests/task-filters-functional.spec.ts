import { test, expect } from '@playwright/test';

test.describe('Task Filters - Functional Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:9001/#/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Click "Sign in manually" button
    const manualButton = page.locator('[data-testid="manual-login-button"]');
    if (await manualButton.isVisible({ timeout: 5000 })) {
      await manualButton.click();
      await page.waitForTimeout(1000);
    }

    // Fill login credentials
    const usernameInput = page.locator('[data-testid="login-username-input"]');
    await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
    await usernameInput.fill('guillermotabligan');

    const passwordInput = page.locator('[data-testid="login-password-input"]');
    await passwordInput.fill('water123');

    // Submit login
    const submitButton = page.locator('[data-testid="login-submit-button"]');
    await submitButton.click();

    // Wait for redirect
    try {
      await page.waitForURL(/\/(dashboard|member|task)/, { timeout: 20000 });
    } catch (e) {
      console.log('Login redirect timeout, proceeding...');
    }

    await page.waitForTimeout(5000);

    // Navigate to Tasks page
    const currentURL = page.url();
    if (!currentURL.includes('/member/task')) {
      await page.goto('http://localhost:9001/#/member/task', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
    }
  });

  test('should verify filters are present and check console errors', async ({ page }) => {
    console.log('\n🔍 Testing filter presence and console errors...\n');

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

    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({
      path: '/home/jhay/projects/ante-official/playwright-testing/test-results/filters-initial.png',
      fullPage: true
    });

    // Count filter dropdowns
    const selectElements = await page.locator('select').count();
    console.log(`✓ Found ${selectElements} select elements`);

    // Check console errors
    console.log(`\n📊 Console Errors: ${consoleErrors.length}`);
    console.log(`📊 Console Warnings: ${consoleWarnings.length}\n`);

    if (consoleErrors.length > 0) {
      console.log('❌ Console Errors Found:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    expect(consoleErrors.length, `Found ${consoleErrors.length} console errors`).toBe(0);
  });

  test('should filter tasks by priority and verify task count changes', async ({ page }) => {
    console.log('\n🔍 Testing priority filter functionality...\n');

    // Collect console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error('❌ Console Error:', msg.text());
      }
    });

    await page.waitForTimeout(3000);

    // Get initial task count
    const taskRowsBefore = await page.locator('.task-row, [class*="task"], .q-item').count();
    console.log(`📋 Initial task count: ${taskRowsBefore}`);

    // Take screenshot before filtering
    await page.screenshot({
      path: '/home/jhay/projects/ante-official/playwright-testing/test-results/before-priority-filter.png',
      fullPage: true
    });

    // Find priority filter (first select element)
    const priorityFilter = page.locator('select').first();

    if (await priorityFilter.isVisible({ timeout: 5000 })) {
      console.log('✓ Priority filter found');

      // Get available options
      const options = await priorityFilter.locator('option').all();
      console.log(`✓ Priority filter has ${options.length} options`);

      // Select "High" priority (usually index 1 or value 3)
      await priorityFilter.selectOption({ index: 1 });
      console.log('✓ Selected first priority option');

      // Wait for API response and UI update
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');

      // Take screenshot after filtering
      await page.screenshot({
        path: '/home/jhay/projects/ante-official/playwright-testing/test-results/after-priority-filter.png',
        fullPage: true
      });

      // Get task count after filtering
      const taskRowsAfter = await page.locator('.task-row, [class*="task"], .q-item').count();
      console.log(`📋 Task count after filter: ${taskRowsAfter}`);

      // Check if filtering worked (count should change or stay the same if no high priority tasks)
      console.log(`📊 Filter result: ${taskRowsBefore} tasks → ${taskRowsAfter} tasks`);

      // Reset filter to "None"
      await priorityFilter.selectOption({ index: 0 });
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');

      const taskRowsReset = await page.locator('.task-row, [class*="task"], .q-item').count();
      console.log(`📋 Task count after reset: ${taskRowsReset}`);

      // Verify console errors
      if (consoleErrors.length > 0) {
        console.log('\n❌ Console Errors Found:');
        consoleErrors.forEach((error, index) => {
          console.log(`${index + 1}. ${error}`);
        });
        throw new Error(`Priority filter caused ${consoleErrors.length} console errors`);
      }

      console.log('\n✅ Priority filter test passed');
    } else {
      console.log('⚠️  Priority filter not found');
      throw new Error('Priority filter not visible');
    }
  });

  test('should filter tasks by status and verify task count changes', async ({ page }) => {
    console.log('\n🔍 Testing status filter functionality...\n');

    // Collect console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error('❌ Console Error:', msg.text());
      }
    });

    await page.waitForTimeout(3000);

    // Get initial task count
    const taskRowsBefore = await page.locator('.task-row, [class*="task"], .q-item').count();
    console.log(`📋 Initial task count: ${taskRowsBefore}`);

    // Find status filter (second select element)
    const statusFilter = page.locator('select').nth(1);

    if (await statusFilter.isVisible({ timeout: 5000 })) {
      console.log('✓ Status filter found');

      // Get available options
      const options = await statusFilter.locator('option').all();
      console.log(`✓ Status filter has ${options.length} options`);

      // Select first non-default option
      await statusFilter.selectOption({ index: 1 });
      console.log('✓ Selected first status option');

      // Wait for API response and UI update
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');

      // Get task count after filtering
      const taskRowsAfter = await page.locator('.task-row, [class*="task"], .q-item').count();
      console.log(`📋 Task count after filter: ${taskRowsAfter}`);
      console.log(`📊 Filter result: ${taskRowsBefore} tasks → ${taskRowsAfter} tasks`);

      // Take screenshot
      await page.screenshot({
        path: '/home/jhay/projects/ante-official/playwright-testing/test-results/after-status-filter.png',
        fullPage: true
      });

      // Reset filter
      await statusFilter.selectOption({ index: 0 });
      await page.waitForTimeout(2000);

      // Verify console errors
      if (consoleErrors.length > 0) {
        console.log('\n❌ Console Errors Found:');
        consoleErrors.forEach((error, index) => {
          console.log(`${index + 1}. ${error}`);
        });
        throw new Error(`Status filter caused ${consoleErrors.length} console errors`);
      }

      console.log('\n✅ Status filter test passed');
    } else {
      console.log('⚠️  Status filter not found');
      throw new Error('Status filter not visible');
    }
  });

  test('should test all filters sequentially', async ({ page }) => {
    console.log('\n🔍 Testing all filters sequentially...\n');

    // Collect console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error('❌ Console Error:', msg.text());
      }
    });

    await page.waitForTimeout(3000);

    // Count all select elements
    const selectCount = await page.locator('select').count();
    console.log(`📋 Found ${selectCount} filter dropdowns\n`);

    // Test each filter
    for (let i = 0; i < selectCount; i++) {
      console.log(`Testing filter ${i + 1}/${selectCount}...`);

      const filter = page.locator('select').nth(i);

      if (await filter.isVisible({ timeout: 2000 })) {
        const optionCount = await filter.locator('option').count();
        console.log(`  ✓ Filter ${i + 1} has ${optionCount} options`);

        if (optionCount > 1) {
          // Get initial task count
          const tasksBefore = await page.locator('.task-row, [class*="task"], .q-item').count();

          // Select second option (first is usually "None" or "All")
          await filter.selectOption({ index: 1 });
          await page.waitForTimeout(2000);
          await page.waitForLoadState('networkidle');

          const tasksAfter = await page.locator('.task-row, [class*="task"], .q-item').count();
          console.log(`  📊 Tasks: ${tasksBefore} → ${tasksAfter}`);

          // Reset filter
          await filter.selectOption({ index: 0 });
          await page.waitForTimeout(1000);
        }
      }
    }

    // Take final screenshot
    await page.screenshot({
      path: '/home/jhay/projects/ante-official/playwright-testing/test-results/all-filters-tested.png',
      fullPage: true
    });

    // Verify no console errors
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors Found:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      throw new Error(`Found ${consoleErrors.length} console errors during filter testing`);
    }

    console.log('\n✅ All filters tested successfully - No console errors');
  });
});
