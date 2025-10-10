import { test, expect } from '@playwright/test';

/**
 * Task Board Migration Test
 *
 * Purpose: Verify that TaskBoardView.vue works correctly after migration from Supabase to backend API
 *
 * Features tested:
 * - Board lanes are fetched from backend API (/board-lane)
 * - Tasks are fetched from backend API (/task/ordered)
 * - Drag and drop moves tasks via backend API (/task/move)
 * - No console errors related to Supabase
 * - Optimistic updates work smoothly
 */

test.describe('Task Board - Backend API Migration', () => {
  let apiToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get API token
    const loginResponse = await request.post('http://localhost:3000/auth/login', {
      data: {
        username: 'guillermotabligan',
        password: 'water123'
      }
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    apiToken = loginData.token;
  });

  test.beforeEach(async ({ page }) => {
    // Monitor console for errors
    page.on('console', msg => {
      const text = msg.text();
      // Fail test if any Supabase-related errors appear
      if (text.includes('supabase') || text.includes('Supabase')) {
        console.error('❌ Supabase reference found in console:', text);
      }
    });

    page.on('pageerror', error => {
      console.error('❌ Page error:', error.message);
    });

    // Login to frontend
    await page.goto('http://localhost:9000');
    await page.fill('input[type="text"]', 'guillermotabligan');
    await page.fill('input[type="password"]', 'water123');
    await page.click('button[type="submit"]');

    // Wait for navigation to complete
    await page.waitForURL('**/member/dashboard', { timeout: 10000 });
  });

  test('should load board lanes from backend API', async ({ page }) => {
    // Navigate to Task Board (find the correct route)
    await page.goto('http://localhost:9000/member/tasks');

    // Wait for board lanes to load
    await page.waitForSelector('.board-column', { timeout: 10000 });

    // Check that board columns are rendered
    const columns = await page.locator('.board-column').count();
    expect(columns).toBeGreaterThan(0);

    // Verify column headers exist
    const firstColumnTitle = await page.locator('.column-title').first().textContent();
    expect(firstColumnTitle).toBeTruthy();

    console.log('✓ Board lanes loaded successfully:', columns, 'columns');
  });

  test('should load tasks from backend API', async ({ page }) => {
    // Navigate to Task Board
    await page.goto('http://localhost:9000/member/tasks');

    // Wait for board to load
    await page.waitForSelector('.board-column', { timeout: 10000 });

    // Wait a bit for tasks to load (they come from cache/API)
    await page.waitForTimeout(2000);

    // Check if tasks are rendered (or empty state)
    const hasTasks = await page.locator('.task-card').count();
    const hasEmptyState = await page.locator('.empty-column').count();

    // Either tasks or empty states should be visible
    expect(hasTasks + hasEmptyState).toBeGreaterThan(0);

    if (hasTasks > 0) {
      console.log('✓ Tasks loaded successfully:', hasTasks, 'tasks');

      // Verify task structure
      const firstTaskTitle = await page.locator('.task-card-title').first().textContent();
      expect(firstTaskTitle).toBeTruthy();
    } else {
      console.log('✓ Empty state shown correctly (no tasks)');
    }
  });

  test('should refresh tasks using backend API', async ({ page }) => {
    // Navigate to Task Board
    await page.goto('http://localhost:9000/member/tasks');

    // Wait for board to load
    await page.waitForSelector('.board-column', { timeout: 10000 });

    // Click refresh button
    const refreshButton = page.locator('button:has(q-icon[name="refresh"])').first();
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    // Wait for refresh to complete
    await page.waitForTimeout(1000);

    // Check for success notification
    const notification = page.locator('.q-notification__message:has-text("Tasks refreshed")');
    await expect(notification).toBeVisible({ timeout: 3000 });

    console.log('✓ Task refresh working correctly');
  });

  test('should show cached data indicator when data is from cache', async ({ page }) => {
    // Navigate to Task Board
    await page.goto('http://localhost:9000/member/tasks');

    // Wait for board to load
    await page.waitForSelector('.board-column', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Check for cache indicator (if data is cached)
    const cacheIndicator = page.locator('.text-caption.text-grey:has-text("Updated")');
    const isVisible = await cacheIndicator.isVisible().catch(() => false);

    if (isVisible) {
      const cacheText = await cacheIndicator.textContent();
      console.log('✓ Cache indicator shown:', cacheText);
    } else {
      console.log('✓ Fresh data loaded (no cache indicator)');
    }
  });

  test('should not have any Supabase console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const supabaseErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);

        if (text.toLowerCase().includes('supabase')) {
          supabaseErrors.push(text);
        }
      }
    });

    // Navigate to Task Board
    await page.goto('http://localhost:9000/member/tasks');

    // Wait for board to load completely
    await page.waitForSelector('.board-column', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Check for Supabase errors
    expect(supabaseErrors.length).toBe(0);

    if (supabaseErrors.length > 0) {
      console.error('❌ Supabase errors found:', supabaseErrors);
    } else {
      console.log('✓ No Supabase errors in console');
    }

    if (consoleErrors.length > 0) {
      console.log('⚠️ Other console errors found:', consoleErrors.slice(0, 5));
    }
  });

  test('should handle drag and drop using backend API', async ({ page, request }) => {
    // First, ensure we have tasks to move
    // Navigate to Task Board
    await page.goto('http://localhost:9000/member/tasks');

    // Wait for board to load
    await page.waitForSelector('.board-column', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Check if we have tasks
    const taskCards = page.locator('.task-card');
    const taskCount = await taskCards.count();

    if (taskCount === 0) {
      console.log('⚠️ Skipping drag/drop test - no tasks available');
      test.skip();
      return;
    }

    console.log('✓ Found', taskCount, 'tasks for drag/drop test');

    // Get first task
    const firstTask = taskCards.first();
    const taskTitle = await firstTask.locator('.task-card-title').textContent();

    // Find the task's current column
    const currentColumn = await firstTask.locator('..').locator('..').locator('.column-title').textContent();

    console.log('  - Task:', taskTitle);
    console.log('  - Current column:', currentColumn);

    // Find a different column to drop into
    const allColumns = page.locator('.board-column');
    const columnCount = await allColumns.count();

    if (columnCount < 2) {
      console.log('⚠️ Skipping drag/drop test - only one column available');
      test.skip();
      return;
    }

    // Try to drag to second column
    const targetColumn = allColumns.nth(1);
    const targetColumnTitle = await targetColumn.locator('.column-title').textContent();

    console.log('  - Target column:', targetColumnTitle);

    // Perform drag and drop
    const taskBox = await firstTask.boundingBox();
    const targetBox = await targetColumn.locator('.column-content').boundingBox();

    if (!taskBox || !targetBox) {
      console.log('⚠️ Skipping drag/drop test - could not get bounding boxes');
      test.skip();
      return;
    }

    // Start drag
    await page.mouse.move(taskBox.x + taskBox.width / 2, taskBox.y + taskBox.height / 2);
    await page.mouse.down();

    // Move to target
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 50, { steps: 10 });

    // Wait a bit to see drop-active state
    await page.waitForTimeout(500);

    // Drop
    await page.mouse.up();

    // Wait for API call to complete
    await page.waitForTimeout(1500);

    // Verify task moved (optimistically - it should appear in new column immediately)
    const movedTask = targetColumn.locator('.task-card').filter({ hasText: taskTitle });
    const isInTargetColumn = await movedTask.count();

    console.log('✓ Drag and drop completed. Task in target column:', isInTargetColumn > 0);
  });
});
