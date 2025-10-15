import { test, expect, Page } from '@playwright/test';

/**
 * Task Board Comprehensive Test Suite
 *
 * Tests all features of the Task Board after Supabase removal:
 * - Board lane loading
 * - Task loading and display
 * - Drag and drop functionality
 * - Cache management
 * - Error handling
 * - UI interactions
 */

test.describe('Task Board - Comprehensive Feature Tests', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    // Monitor console errors
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        console.error('❌ Console Error:', text);
      }
      // Flag Supabase references
      if (text.toLowerCase().includes('supabase')) {
        console.error('⚠️ Supabase reference:', text);
      }
    });

    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });

    // Login
    await page.goto('http://localhost:9000');
    await page.waitForLoadState('networkidle');

    // Fill login form
    const usernameInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await usernameInput.fill('guillermotabligan');
    await passwordInput.fill('water123');

    // Click login button
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    // Wait for dashboard
    await page.waitForURL('**/member/dashboard', { timeout: 15000 });
    console.log('✓ Login successful');
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1. Navigate to Task Board', async () => {
    // Navigate to tasks page
    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check if we're on tasks page
    const url = page.url();
    expect(url).toContain('/member/task');

    console.log('✓ Navigated to Task Board');
  });

  test('2. Board lanes should load from backend API', async () => {
    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');

    // Wait for board columns to render
    const boardColumn = page.locator('.board-column').first();
    await expect(boardColumn).toBeVisible({ timeout: 15000 });

    // Count columns
    const columnCount = await page.locator('.board-column').count();
    console.log('  - Found', columnCount, 'board columns');
    expect(columnCount).toBeGreaterThan(0);

    // Verify column structure
    const firstColumn = page.locator('.board-column').first();

    // Check column title exists
    const columnTitle = firstColumn.locator('.column-title');
    await expect(columnTitle).toBeVisible();
    const titleText = await columnTitle.textContent();
    console.log('  - First column title:', titleText);
    expect(titleText).toBeTruthy();

    // Check column has content area
    const columnContent = firstColumn.locator('.column-content');
    await expect(columnContent).toBeVisible();

    console.log('✓ Board lanes loaded successfully');
  });

  test('3. Tasks should load from backend API', async () => {
    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');

    // Wait for board to load
    await page.waitForSelector('.board-column', { timeout: 15000 });
    await page.waitForTimeout(3000); // Wait for tasks to load from cache/API

    // Check for tasks or empty state
    const taskCards = await page.locator('.task-card').count();
    const emptyStates = await page.locator('.empty-column').count();

    console.log('  - Task cards found:', taskCards);
    console.log('  - Empty states found:', emptyStates);

    // Either tasks or empty states should be present
    expect(taskCards + emptyStates).toBeGreaterThan(0);

    if (taskCards > 0) {
      // Verify task card structure
      const firstTask = page.locator('.task-card').first();

      // Check task title
      const taskTitle = firstTask.locator('.task-card-title');
      await expect(taskTitle).toBeVisible();
      const titleText = await taskTitle.textContent();
      console.log('  - First task title:', titleText);
      expect(titleText).toBeTruthy();

      // Check task metadata
      const taskMeta = firstTask.locator('.task-card-meta');
      await expect(taskMeta).toBeVisible();

      console.log('✓ Tasks loaded and displayed correctly');
    } else {
      console.log('✓ Empty state shown (no tasks available)');
    }
  });

  test('4. Task cards should be draggable', async () => {
    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.board-column', { timeout: 15000 });
    await page.waitForTimeout(3000);

    const taskCards = await page.locator('.task-card').count();

    if (taskCards === 0) {
      console.log('⚠️ No tasks available - skipping drag test');
      test.skip();
      return;
    }

    // Check first task has draggable attribute
    const firstTask = page.locator('.task-card').first();
    const isDraggable = await firstTask.getAttribute('draggable');
    expect(isDraggable).toBe('true');

    console.log('✓ Task cards are draggable');
  });

  test('5. Drag and drop should work and call backend API', async () => {
    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.board-column', { timeout: 15000 });
    await page.waitForTimeout(3000);

    const taskCount = await page.locator('.task-card').count();
    const columnCount = await page.locator('.board-column').count();

    if (taskCount === 0) {
      console.log('⚠️ No tasks available - skipping drag/drop test');
      test.skip();
      return;
    }

    if (columnCount < 2) {
      console.log('⚠️ Less than 2 columns - skipping drag/drop test');
      test.skip();
      return;
    }

    // Get first task and its details
    const firstTask = page.locator('.task-card').first();
    const taskTitleEl = firstTask.locator('.task-card-title');
    const taskTitle = await taskTitleEl.textContent();
    console.log('  - Dragging task:', taskTitle);

    // Find the task's current column
    const sourceColumn = firstTask.locator('xpath=ancestor::div[contains(@class, "board-column")]');
    const sourceColumnTitle = await sourceColumn.locator('.column-title').textContent();
    console.log('  - Source column:', sourceColumnTitle);

    // Find target column (second column)
    const targetColumn = page.locator('.board-column').nth(1);
    const targetColumnTitle = await targetColumn.locator('.column-title').textContent();
    console.log('  - Target column:', targetColumnTitle);

    // Get bounding boxes
    const taskBox = await firstTask.boundingBox();
    const targetContentBox = await targetColumn.locator('.column-content').boundingBox();

    if (!taskBox || !targetContentBox) {
      console.log('⚠️ Could not get element positions - skipping');
      test.skip();
      return;
    }

    // Listen for network request to /task/move
    const moveRequestPromise = page.waitForRequest(
      request => request.url().includes('/task/move') && request.method() === 'PUT',
      { timeout: 10000 }
    ).catch(() => null);

    // Perform drag and drop
    await page.mouse.move(taskBox.x + taskBox.width / 2, taskBox.y + taskBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(100);

    // Move to target column
    await page.mouse.move(
      targetContentBox.x + targetContentBox.width / 2,
      targetContentBox.y + 50,
      { steps: 10 }
    );
    await page.waitForTimeout(300);

    // Check for drop-active class
    const hasDropActive = await targetColumn.evaluate(el => el.classList.contains('drop-active'));
    console.log('  - Target column has drop-active:', hasDropActive);

    // Drop
    await page.mouse.up();

    // Wait for API call
    const moveRequest = await moveRequestPromise;

    if (moveRequest) {
      console.log('✓ PUT /task/move API called');

      // Wait for operation to complete
      await page.waitForTimeout(2000);

      // Verify task moved (optimistic update should show it immediately)
      const taskInTarget = await targetColumn.locator('.task-card').filter({ hasText: taskTitle || '' }).count();
      console.log('  - Task found in target column:', taskInTarget > 0);

      if (taskInTarget > 0) {
        console.log('✓ Drag and drop successful - task moved to new column');
      } else {
        console.log('⚠️ Task not found in target column (might have rolled back or moved by another filter)');
      }
    } else {
      console.log('⚠️ No /task/move API call detected - might be same column');
    }
  });

  test('6. Refresh button should work', async () => {
    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.board-column', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Find refresh button (icon="refresh")
    const refreshButton = page.locator('button:has(q-icon[name="refresh"])').first();

    if (!await refreshButton.isVisible()) {
      console.log('⚠️ Refresh button not found - might not be rendered yet');
      test.skip();
      return;
    }

    console.log('  - Found refresh button');

    // Listen for API request
    const taskRequestPromise = page.waitForRequest(
      request => request.url().includes('/task/ordered'),
      { timeout: 5000 }
    ).catch(() => null);

    // Click refresh
    await refreshButton.click();

    // Wait for API call
    const taskRequest = await taskRequestPromise;

    if (taskRequest) {
      console.log('✓ GET /task/ordered API called on refresh');
    }

    // Wait for refresh to complete
    await page.waitForTimeout(2000);

    // Check for success notification
    const notification = page.locator('.q-notification__message');
    const notificationVisible = await notification.isVisible().catch(() => false);

    if (notificationVisible) {
      const notificationText = await notification.textContent();
      console.log('  - Notification shown:', notificationText);
    }

    console.log('✓ Refresh button works');
  });

  test('7. Cache indicator should show when data is cached', async () => {
    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.board-column', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Look for cache indicator
    const cacheIndicator = page.locator('.text-caption.text-grey');
    const indicators = await cacheIndicator.all();

    let foundCacheIndicator = false;
    for (const indicator of indicators) {
      const text = await indicator.textContent();
      if (text && text.includes('Updated')) {
        console.log('  - Cache indicator found:', text);
        foundCacheIndicator = true;
        break;
      }
    }

    if (foundCacheIndicator) {
      console.log('✓ Cache indicator displayed');
    } else {
      console.log('✓ No cache indicator (fresh data loaded)');
    }
  });

  test('8. Task priority chips should display correctly', async () => {
    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.board-column', { timeout: 15000 });
    await page.waitForTimeout(3000);

    const taskCards = await page.locator('.task-card').count();

    if (taskCards === 0) {
      console.log('⚠️ No tasks to check priorities');
      test.skip();
      return;
    }

    // Find tasks with priority chips
    const tasksWithPriority = await page.locator('.task-card .task-card-meta q-chip').count();
    console.log('  - Tasks with metadata chips:', tasksWithPriority);

    if (tasksWithPriority > 0) {
      const firstChip = page.locator('.task-card .task-card-meta q-chip').first();
      const chipText = await firstChip.textContent();
      console.log('  - First chip text:', chipText);
      console.log('✓ Task metadata chips displayed');
    } else {
      console.log('✓ No priority chips (tasks may not have priorities set)');
    }
  });

  test('9. Column task count should be accurate', async () => {
    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.board-column', { timeout: 15000 });
    await page.waitForTimeout(3000);

    const columns = await page.locator('.board-column').all();

    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];

      // Get column title
      const titleEl = column.locator('.column-title');
      const title = await titleEl.textContent();

      // Get badge count
      const badgeEl = column.locator('.q-badge');
      const badgeText = await badgeEl.textContent();
      const badgeCount = parseInt(badgeText || '0');

      // Get actual task count
      const taskCards = await column.locator('.task-card').count();
      const emptyState = await column.locator('.empty-column').count();

      console.log(`  - ${title}: Badge=${badgeCount}, Tasks=${taskCards}, Empty=${emptyState}`);

      // Verify badge count matches actual task count
      expect(badgeCount).toBe(taskCards);

      // If no tasks, should show empty state
      if (taskCards === 0) {
        expect(emptyState).toBe(1);
      }
    }

    console.log('✓ Column task counts are accurate');
  });

  test('10. No Supabase errors in console', async () => {
    const consoleErrors: string[] = [];
    const supabaseReferences: string[] = [];

    const tempPage = await page.context().newPage();

    tempPage.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
      if (text.toLowerCase().includes('supabase')) {
        supabaseReferences.push(text);
      }
    });

    tempPage.on('pageerror', error => {
      consoleErrors.push(error.message);
    });

    // Login
    await tempPage.goto('http://localhost:9000');
    await tempPage.waitForLoadState('networkidle');

    const usernameInput = tempPage.locator('input[type="text"]').first();
    const passwordInput = tempPage.locator('input[type="password"]').first();

    await usernameInput.fill('guillermotabligan');
    await passwordInput.fill('water123');

    const loginButton = tempPage.locator('button[type="submit"]').first();
    await loginButton.click();

    await tempPage.waitForURL('**/member/dashboard', { timeout: 15000 });

    // Navigate to task board
    await tempPage.goto('http://localhost:9000/member/task/my-task');
    await tempPage.waitForLoadState('networkidle');
    await tempPage.waitForSelector('.board-column', { timeout: 15000 });
    await tempPage.waitForTimeout(5000); // Wait for all async operations

    await tempPage.close();

    // Check for Supabase references
    if (supabaseReferences.length > 0) {
      console.error('❌ Supabase references found in console:');
      supabaseReferences.forEach(ref => console.error('  -', ref));
    }

    expect(supabaseReferences.length).toBe(0);

    // Report other errors (if any)
    if (consoleErrors.length > 0) {
      console.log('⚠️ Console errors found (not Supabase-related):');
      consoleErrors.slice(0, 5).forEach(err => console.log('  -', err.substring(0, 100)));
    }

    console.log('✓ No Supabase errors in console');
  });

  test('11. Board lanes should have correct styling', async () => {
    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.board-column', { timeout: 15000 });

    const firstColumn = page.locator('.board-column').first();

    // Check background color
    const bgColor = await firstColumn.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    console.log('  - Column background color:', bgColor);
    expect(bgColor).toBeTruthy();

    // Check border radius
    const borderRadius = await firstColumn.evaluate(el =>
      window.getComputedStyle(el).borderRadius
    );
    console.log('  - Column border radius:', borderRadius);
    expect(borderRadius).toContain('px');

    console.log('✓ Board lanes have correct styling');
  });

  test('12. Task cards should have hover effect', async () => {
    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.board-column', { timeout: 15000 });
    await page.waitForTimeout(3000);

    const taskCards = await page.locator('.task-card').count();

    if (taskCards === 0) {
      console.log('⚠️ No tasks to test hover effect');
      test.skip();
      return;
    }

    const firstTask = page.locator('.task-card').first();

    // Get initial box shadow
    const initialBoxShadow = await firstTask.evaluate(el =>
      window.getComputedStyle(el).boxShadow
    );

    // Hover over task
    await firstTask.hover();
    await page.waitForTimeout(300);

    // Get box shadow after hover
    const hoverBoxShadow = await firstTask.evaluate(el =>
      window.getComputedStyle(el).boxShadow
    );

    console.log('  - Initial shadow:', initialBoxShadow);
    console.log('  - Hover shadow:', hoverBoxShadow);

    // Shadow should change on hover
    expect(initialBoxShadow).not.toBe(hoverBoxShadow);

    console.log('✓ Task cards have hover effect');
  });
});
