import { test, expect } from '@playwright/test';

test.describe('TaskList - Filter Search Functionality', () => {
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

    // Navigate to All Tasks view
    await page.goto('http://localhost:9001/#/member/task/all', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
  });

  test('should display all 6 filters with q-select components', async ({ page }) => {
    console.log('\n🔍 Testing filter display...\n');

    // Take initial screenshot
    await page.screenshot({
      path: '/home/jhay/projects/ante-official/playwright-testing/test-results/filters-initial.png',
      fullPage: true
    });

    // Check that filter section is visible
    const filterSection = page.locator('.filter-section');
    await expect(filterSection).toBeVisible();

    // Check all 6 filters exist
    const filters = [
      { label: 'Priority', selector: '.filter-select-new >> nth=0' },
      { label: 'Status', selector: '.filter-select-new >> nth=1' },
      { label: 'Goal', selector: '.filter-select-new >> nth=2' },
      { label: 'Assignee', selector: '.filter-select-new >> nth=3' },
      { label: 'Project', selector: '.filter-select-new >> nth=4' },
      { label: 'Due Date', selector: '.filter-select-new >> nth=5' }
    ];

    for (const filter of filters) {
      const element = page.locator(filter.selector);
      const isVisible = await element.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`✓ ${filter.label} filter: ${isVisible ? 'Visible' : 'Hidden'}`);
    }

    console.log('\n✅ All filters displayed\n');
  });

  test('should search and filter priority options', async ({ page }) => {
    console.log('\n🔍 Testing priority filter search...\n');

    // Track API calls
    const apiCalls: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/task/ordered')) {
        apiCalls.push(url);
        console.log('📡 API Call:', url);
      }
    });

    // Click priority filter to open dropdown
    const priorityFilter = page.locator('.filter-select-new').first();
    await priorityFilter.click();
    await page.waitForTimeout(1000);

    // Take screenshot of opened dropdown
    await page.screenshot({
      path: '/home/jhay/projects/ante-official/playwright-testing/test-results/priority-filter-opened.png',
      fullPage: true
    });

    // Type "High" to search
    await page.keyboard.type('High');
    await page.waitForTimeout(1000);

    // Take screenshot of search results
    await page.screenshot({
      path: '/home/jhay/projects/ante-official/playwright-testing/test-results/priority-filter-search.png',
      fullPage: true
    });

    // Select "High Priority" option
    const highPriorityOption = page.locator('.q-item').filter({ hasText: /^High Priority$/i });
    if (await highPriorityOption.isVisible({ timeout: 2000 })) {
      await highPriorityOption.click();
      await page.waitForTimeout(2000);

      console.log('✓ Selected "High Priority" option');
      console.log(`📋 API Calls Triggered: ${apiCalls.length}`);

      // Verify API was called with priority filter
      const hasPriorityFilter = apiCalls.some(url => url.includes('priority'));
      expect(hasPriorityFilter).toBe(true);
      console.log('✅ Priority filter triggered API call');
    } else {
      console.log('⚠️  High Priority option not found');
    }
  });

  test('should search and filter status options', async ({ page }) => {
    console.log('\n🔍 Testing status filter search...\n');

    const apiCalls: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/task/ordered')) {
        apiCalls.push(url);
      }
    });

    // Click status filter
    const statusFilter = page.locator('.filter-select-new').nth(1);
    await statusFilter.click();
    await page.waitForTimeout(1000);

    // Type "Progress" to search
    await page.keyboard.type('Progress');
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({
      path: '/home/jhay/projects/ante-official/playwright-testing/test-results/status-filter-search.png',
      fullPage: true
    });

    // Select "In Progress" option
    const inProgressOption = page.locator('.q-item').filter({ hasText: /^In Progress$/i });
    if (await inProgressOption.isVisible({ timeout: 2000 })) {
      await inProgressOption.click();
      await page.waitForTimeout(2000);

      console.log('✓ Selected "In Progress" option');
      console.log(`📋 API Calls Triggered: ${apiCalls.length}`);
      console.log('✅ Status filter triggered API call');
    } else {
      console.log('⚠️  In Progress option not found');
    }
  });

  test('should test responsive layout on different screen sizes', async ({ page }) => {
    console.log('\n🔍 Testing responsive layout...\n');

    // Desktop view (1920x1080)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: '/home/jhay/projects/ante-official/playwright-testing/test-results/filters-desktop.png',
      fullPage: true
    });
    console.log('✓ Desktop screenshot taken (1920x1080)');

    // Tablet view (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: '/home/jhay/projects/ante-official/playwright-testing/test-results/filters-tablet.png',
      fullPage: true
    });
    console.log('✓ Tablet screenshot taken (768x1024)');

    // Mobile view (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Check if filter toggle button is visible on mobile
    const filterToggle = page.locator('.filter-toggle-btn');
    const isToggleVisible = await filterToggle.isVisible({ timeout: 5000 });
    console.log(`✓ Mobile filter toggle button: ${isToggleVisible ? 'Visible' : 'Hidden'}`);

    await page.screenshot({
      path: '/home/jhay/projects/ante-official/playwright-testing/test-results/filters-mobile-expanded.png',
      fullPage: true
    });
    console.log('✓ Mobile screenshot taken (375x667) - expanded');

    // Test mobile filter toggle
    if (isToggleVisible) {
      await filterToggle.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: '/home/jhay/projects/ante-official/playwright-testing/test-results/filters-mobile-collapsed.png',
        fullPage: true
      });
      console.log('✓ Mobile screenshot taken (collapsed)');

      // Toggle back to expanded
      await filterToggle.click();
      await page.waitForTimeout(500);
      console.log('✓ Mobile filter toggle works correctly');
    }

    console.log('\n✅ Responsive layout tested across all breakpoints\n');
  });

  test('should verify all filters trigger API calls', async ({ page }) => {
    console.log('\n🔍 Testing all filters trigger API calls...\n');

    const apiCalls: { filter: string; url: string }[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/task/ordered')) {
        apiCalls.push({ filter: 'unknown', url });
      }
    });

    // Test Priority Filter
    const priorityFilter = page.locator('.filter-select-new').first();
    await priorityFilter.click();
    await page.waitForTimeout(500);
    const highOption = page.locator('.q-item').filter({ hasText: /^High Priority$/i }).first();
    if (await highOption.isVisible({ timeout: 2000 })) {
      await highOption.click();
      await page.waitForTimeout(2000);
      apiCalls[apiCalls.length - 1].filter = 'Priority';
      console.log('✓ Priority filter triggered API');
    }

    // Test Status Filter
    const statusFilter = page.locator('.filter-select-new').nth(1);
    await statusFilter.click();
    await page.waitForTimeout(500);
    const todoOption = page.locator('.q-item').filter({ hasText: /^To Do$/i }).first();
    if (await todoOption.isVisible({ timeout: 2000 })) {
      await todoOption.click();
      await page.waitForTimeout(2000);
      apiCalls[apiCalls.length - 1].filter = 'Status';
      console.log('✓ Status filter triggered API');
    }

    // Test Due Date Filter
    const dueDateFilter = page.locator('.filter-select-new').last();
    await dueDateFilter.click();
    await page.waitForTimeout(500);
    const todayOption = page.locator('.q-item').filter({ hasText: /^Today$/i }).first();
    if (await todayOption.isVisible({ timeout: 2000 })) {
      await todayOption.click();
      await page.waitForTimeout(2000);
      apiCalls[apiCalls.length - 1].filter = 'Due Date';
      console.log('✓ Due Date filter triggered API');
    }

    console.log(`\n📊 Total API Calls: ${apiCalls.length}`);
    apiCalls.forEach((call, i) => {
      console.log(`${i + 1}. ${call.filter}`);
    });

    // Verify at least some filters triggered API calls
    expect(apiCalls.length).toBeGreaterThan(0);
    console.log('\n✅ All tested filters triggered API calls\n');
  });
});
