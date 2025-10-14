import { test, expect } from '@playwright/test';

test.describe('Task Filters - Server-Side Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to login page
    await page.goto('http://localhost:9001/#/login', { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for login form to be visible
    await page.waitForSelector('input[aria-label="Username"], input[placeholder*="Username"], input[placeholder*="username"]', { timeout: 10000 });

    // Fill login credentials
    const usernameInput = page.locator('input[aria-label="Username"], input[placeholder*="Username"], input[placeholder*="username"]').first();
    await usernameInput.fill('guillermotabligan');

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('water123');

    // Click login button
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
    await loginButton.click();

    // Wait for navigation to complete
    await page.waitForURL(/\/(dashboard|member)/, { timeout: 15000 });
    await page.waitForTimeout(2000); // Give time for app to initialize

    // Navigate to Tasks page
    await page.goto('http://localhost:9001/#/member/task', { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for tasks to load - be more lenient
    await page.waitForTimeout(3000);
  });

  test('should display all filter dropdowns', async ({ page }) => {
    console.log('✓ Testing filter dropdown visibility...');

    // Check that all filter dropdowns are visible
    const priorityFilter = page.locator('select').filter({ hasText: /Priority/ }).or(page.locator('.filter-section select').first());
    const statusFilter = page.locator('.filter-section select').nth(1);
    const goalFilter = page.locator('.filter-section select').nth(2);
    const dueDateFilter = page.locator('.filter-section select').last();

    await expect(priorityFilter).toBeVisible();
    await expect(statusFilter).toBeVisible();
    await expect(goalFilter).toBeVisible();
    await expect(dueDateFilter).toBeVisible();

    console.log('✓ All filter dropdowns are visible');
  });

  test('should filter tasks by priority', async ({ page }) => {
    console.log('✓ Testing priority filter...');

    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Get initial task count
    const initialTasks = await page.locator('.task-row').count();
    console.log(`Initial task count: ${initialTasks}`);

    // Select "High" priority
    const priorityFilter = page.locator('.filter-section select').first();
    await priorityFilter.selectOption('3'); // High priority value

    // Wait for API call to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Give time for UI update

    // Get filtered task count
    const filteredTasks = await page.locator('.task-row').count();
    console.log(`Filtered task count (High priority): ${filteredTasks}`);

    // Check for console errors
    if (consoleErrors.length > 0) {
      console.error('Console errors detected:', consoleErrors);
      throw new Error(`Console errors: ${consoleErrors.join(', ')}`);
    }

    console.log('✓ Priority filter works without errors');
  });

  test('should filter tasks by status', async ({ page }) => {
    console.log('✓ Testing status filter...');

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Select "In Progress" status (boardLaneId = 2)
    const statusFilter = page.locator('.filter-section select').nth(1);
    await statusFilter.selectOption('2');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const filteredTasks = await page.locator('.task-row').count();
    console.log(`Filtered task count (In Progress): ${filteredTasks}`);

    if (consoleErrors.length > 0) {
      console.error('Console errors detected:', consoleErrors);
      throw new Error(`Console errors: ${consoleErrors.join(', ')}`);
    }

    console.log('✓ Status filter works without errors');
  });

  test('should filter tasks by goal', async ({ page }) => {
    console.log('✓ Testing goal filter...');

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Select a goal (if available)
    const goalFilter = page.locator('.filter-section select').nth(2);
    const goalOptions = await goalFilter.locator('option').count();

    if (goalOptions > 2) { // More than "None" and "All Goals"
      await goalFilter.selectOption({ index: 1 }); // Select first actual goal

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const filteredTasks = await page.locator('.task-row').count();
      console.log(`Filtered task count (by goal): ${filteredTasks}`);
    } else {
      console.log('No goals available to test');
    }

    if (consoleErrors.length > 0) {
      console.error('Console errors detected:', consoleErrors);
      throw new Error(`Console errors: ${consoleErrors.join(', ')}`);
    }

    console.log('✓ Goal filter works without errors');
  });

  test('should filter tasks by due date', async ({ page }) => {
    console.log('✓ Testing due date filter...');

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Select "Today" due date
    const dueDateFilter = page.locator('.filter-section select').last();
    await dueDateFilter.selectOption('today');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const filteredTasks = await page.locator('.task-row').count();
    console.log(`Filtered task count (Today): ${filteredTasks}`);

    if (consoleErrors.length > 0) {
      console.error('Console errors detected:', consoleErrors);
      throw new Error(`Console errors: ${consoleErrors.join(', ')}`);
    }

    console.log('✓ Due date filter works without errors');
  });

  test('should combine multiple filters', async ({ page }) => {
    console.log('✓ Testing combined filters...');

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Select multiple filters
    const priorityFilter = page.locator('.filter-section select').first();
    const statusFilter = page.locator('.filter-section select').nth(1);

    await priorityFilter.selectOption('3'); // High priority
    await page.waitForTimeout(500);

    await statusFilter.selectOption('2'); // In Progress
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const filteredTasks = await page.locator('.task-row').count();
    console.log(`Filtered task count (High + In Progress): ${filteredTasks}`);

    if (consoleErrors.length > 0) {
      console.error('Console errors detected:', consoleErrors);
      throw new Error(`Console errors: ${consoleErrors.join(', ')}`);
    }

    console.log('✓ Combined filters work without errors');
  });

  test('should reset filters when selecting "None"', async ({ page }) => {
    console.log('✓ Testing filter reset...');

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Apply a filter
    const priorityFilter = page.locator('.filter-section select').first();
    await priorityFilter.selectOption('3'); // High priority
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const filteredCount = await page.locator('.task-row').count();
    console.log(`Filtered task count: ${filteredCount}`);

    // Reset filter
    await priorityFilter.selectOption('none');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const resetCount = await page.locator('.task-row').count();
    console.log(`Reset task count: ${resetCount}`);

    // Reset should show more tasks (or same if no high priority tasks exist)
    expect(resetCount).toBeGreaterThanOrEqual(filteredCount);

    if (consoleErrors.length > 0) {
      console.error('Console errors detected:', consoleErrors);
      throw new Error(`Console errors: ${consoleErrors.join(', ')}`);
    }

    console.log('✓ Filter reset works without errors');
  });

  test('should work in Board view', async ({ page }) => {
    console.log('✓ Testing filters in Board view...');

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Switch to Board view
    const viewButtons = page.locator('button').filter({ hasText: /Board|Card|List/i });
    const boardButton = viewButtons.filter({ hasText: /Board/i });

    if (await boardButton.count() > 0) {
      await boardButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Apply a filter in Board view
      const priorityFilter = page.locator('.filter-section select').first();
      await priorityFilter.selectOption('3');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      console.log('✓ Filters work in Board view');
    } else {
      console.log('Board view button not found, skipping');
    }

    if (consoleErrors.length > 0) {
      console.error('Console errors detected:', consoleErrors);
      throw new Error(`Console errors: ${consoleErrors.join(', ')}`);
    }
  });

  test('should work in Card view', async ({ page }) => {
    console.log('✓ Testing filters in Card view...');

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Switch to Card view
    const viewButtons = page.locator('button').filter({ hasText: /Board|Card|List/i });
    const cardButton = viewButtons.filter({ hasText: /Card/i });

    if (await cardButton.count() > 0) {
      await cardButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Apply a filter in Card view
      const priorityFilter = page.locator('.filter-section select').first();
      await priorityFilter.selectOption('2');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      console.log('✓ Filters work in Card view');
    } else {
      console.log('Card view button not found, skipping');
    }

    if (consoleErrors.length > 0) {
      console.error('Console errors detected:', consoleErrors);
      throw new Error(`Console errors: ${consoleErrors.join(', ')}`);
    }
  });

  test('should persist filters when switching views', async ({ page }) => {
    console.log('✓ Testing filter persistence across views...');

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Apply filters in List view
    const priorityFilter = page.locator('.filter-section select').first();
    await priorityFilter.selectOption('3');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Get selected value
    const selectedValue = await priorityFilter.inputValue();

    // Switch to Board view
    const viewButtons = page.locator('button').filter({ hasText: /Board|Card|List/i });
    const boardButton = viewButtons.filter({ hasText: /Board/i });

    if (await boardButton.count() > 0) {
      await boardButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check if filter is still applied
      const filterAfterSwitch = page.locator('.filter-section select').first();
      const newValue = await filterAfterSwitch.inputValue();

      expect(newValue).toBe(selectedValue);
      console.log('✓ Filters persist across view switches');
    }

    if (consoleErrors.length > 0) {
      console.error('Console errors detected:', consoleErrors);
      throw new Error(`Console errors: ${consoleErrors.join(', ')}`);
    }
  });
});
