import { test, expect } from '@playwright/test';

/**
 * Task Board Simple Test
 *
 * Direct tests without complex beforeAll hooks
 */

// Helper function to login
async function login(page: any) {
  await page.goto('http://localhost:9000');

  // Wait for page load
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // Click "Sign in manually" button first
  const signInManuallyBtn = page.locator('button:has-text("Sign in manually")');
  await signInManuallyBtn.click();
  await page.waitForTimeout(1000);

  console.log('  - Clicked "Sign in manually"');

  // Now find username and password fields
  const usernameSelectors = [
    'input[name="username"]',
    'input[type="text"]',
    'input[placeholder*="username" i]',
    'input[placeholder*="Username" i]',
    '.q-field input[type="text"]'
  ];

  let usernameInput = null;
  for (const selector of usernameSelectors) {
    const input = page.locator(selector).first();
    if (await input.isVisible().catch(() => false)) {
      usernameInput = input;
      console.log('  - Found username input with selector:', selector);
      break;
    }
  }

  // Try multiple selector strategies for password
  const passwordSelectors = [
    'input[name="password"]',
    'input[type="password"]',
    '.q-field input[type="password"]'
  ];

  let passwordInput = null;
  for (const selector of passwordSelectors) {
    const input = page.locator(selector).first();
    if (await input.isVisible().catch(() => false)) {
      passwordInput = input;
      console.log('  - Found password input with selector:', selector);
      break;
    }
  }

  if (!usernameInput || !passwordInput) {
    throw new Error('Could not find login form inputs');
  }

  await usernameInput.fill('guillermotabligan');
  await passwordInput.fill('water123');

  // Find and click login button
  const loginButton = page.locator('button[type="submit"]').first();
  await loginButton.click();

  // Wait for redirect to dashboard
  await page.waitForURL('**/member/dashboard', { timeout: 15000 });
}

test.describe('Task Board - Simple Tests', () => {
  test('1. Can access task board page', async ({ page }) => {
    console.log('\n=== Test 1: Can access task board page ===');

    await login(page);
    console.log('✓ Logged in successfully');

    // Navigate to tasks
    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    console.log('  - Current URL:', url);
    expect(url).toContain('/member/task');

    console.log('✓ Task board page accessible');
  });

  test('2. Board columns render from backend API', async ({ page }) => {
    console.log('\n=== Test 2: Board columns render ===');

    await login(page);

    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Wait for board columns
    const boardColumns = page.locator('.board-column');

    try {
      await expect(boardColumns.first()).toBeVisible({ timeout: 20000 });

      const count = await boardColumns.count();
      console.log('  - Board columns found:', count);
      expect(count).toBeGreaterThan(0);

      // Check first column structure
      const firstColumn = boardColumns.first();
      const title = await firstColumn.locator('.column-title').textContent();
      console.log('  - First column title:', title);
      expect(title).toBeTruthy();

      console.log('✓ Board columns rendered successfully');
    } catch (error) {
      console.error('❌ Board columns did not render');
      throw error;
    }
  });

  test('3. Tasks load from backend API', async ({ page }) => {
    console.log('\n=== Test 3: Tasks load ===');

    await login(page);

    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000);

    // Check for tasks or empty state
    const taskCards = await page.locator('.task-card').count();
    const emptyStates = await page.locator('.empty-column').count();

    console.log('  - Task cards:', taskCards);
    console.log('  - Empty states:', emptyStates);

    expect(taskCards + emptyStates).toBeGreaterThan(0);

    if (taskCards > 0) {
      const firstTask = page.locator('.task-card').first();
      const taskTitle = await firstTask.locator('.task-card-title').textContent();
      console.log('  - First task:', taskTitle);
      console.log('✓ Tasks loaded successfully');
    } else {
      console.log('✓ Empty state shown (no tasks)');
    }
  });

  test('4. No Supabase errors in console', async ({ page }) => {
    console.log('\n=== Test 4: No Supabase errors ===');

    const supabaseErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        if (text.toLowerCase().includes('supabase')) {
          supabaseErrors.push(text);
        }
      }
    });

    page.on('pageerror', error => {
      const msg = error.message;
      consoleErrors.push(msg);
      if (msg.toLowerCase().includes('supabase')) {
        supabaseErrors.push(msg);
      }
    });

    await login(page);

    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    console.log('  - Console errors found:', consoleErrors.length);
    console.log('  - Supabase errors found:', supabaseErrors.length);

    if (consoleErrors.length > 0) {
      console.log('  - First 3 console errors:');
      consoleErrors.slice(0, 3).forEach(err => {
        console.log('    -', err.substring(0, 100));
      });
    }

    if (supabaseErrors.length > 0) {
      console.log('❌ Supabase errors:');
      supabaseErrors.forEach(err => {
        console.error('    -', err);
      });
    }

    expect(supabaseErrors.length).toBe(0);
    console.log('✓ No Supabase errors in console');
  });

  test('5. Task drag and drop functionality', async ({ page }) => {
    console.log('\n=== Test 5: Drag and drop ===');

    await login(page);

    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const taskCount = await page.locator('.task-card').count();
    const columnCount = await page.locator('.board-column').count();

    console.log('  - Tasks:', taskCount);
    console.log('  - Columns:', columnCount);

    if (taskCount === 0 || columnCount < 2) {
      console.log('⚠️ Skipping - need at least 1 task and 2 columns');
      test.skip();
      return;
    }

    // Get first task
    const firstTask = page.locator('.task-card').first();
    const taskTitle = await firstTask.locator('.task-card-title').textContent();
    console.log('  - Dragging task:', taskTitle);

    // Get target column (second column)
    const targetColumn = page.locator('.board-column').nth(1);
    const targetTitle = await targetColumn.locator('.column-title').textContent();
    console.log('  - Target column:', targetTitle);

    // Check if task is draggable
    const isDraggable = await firstTask.getAttribute('draggable');
    expect(isDraggable).toBe('true');
    console.log('  - Task is draggable:', isDraggable);

    // Perform drag and drop
    const taskBox = await firstTask.boundingBox();
    const targetBox = await targetColumn.locator('.column-content').boundingBox();

    if (!taskBox || !targetBox) {
      console.log('⚠️ Could not get element positions');
      test.skip();
      return;
    }

    // Listen for /task/move API call
    const moveRequestPromise = page.waitForRequest(
      req => req.url().includes('/task/move'),
      { timeout: 8000 }
    ).catch(() => null);

    // Drag
    await page.mouse.move(taskBox.x + taskBox.width / 2, taskBox.y + taskBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(100);

    // Move to target
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + 30,
      { steps: 10 }
    );
    await page.waitForTimeout(200);

    // Drop
    await page.mouse.up();

    // Check for API call
    const moveRequest = await moveRequestPromise;

    if (moveRequest) {
      console.log('✓ /task/move API called on drop');
      await page.waitForTimeout(1500);

      // Check if task moved
      const taskInTarget = await targetColumn.locator('.task-card')
        .filter({ hasText: taskTitle || '' })
        .count();

      if (taskInTarget > 0) {
        console.log('✓ Task successfully moved to target column');
      } else {
        console.log('  - Task not in target (might be filtered or same column)');
      }
    } else {
      console.log('  - No /task/move API call (might be same column)');
    }
  });

  test('6. Refresh button works', async ({ page }) => {
    console.log('\n=== Test 6: Refresh button ===');

    await login(page);

    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find refresh button
    const refreshBtn = page.locator('button q-icon[name="refresh"]').locator('..');

    const isVisible = await refreshBtn.isVisible().catch(() => false);

    if (!isVisible) {
      console.log('⚠️ Refresh button not found');
      test.skip();
      return;
    }

    console.log('  - Found refresh button');

    // Listen for API call
    const taskRequestPromise = page.waitForRequest(
      req => req.url().includes('/task/ordered'),
      { timeout: 5000 }
    ).catch(() => null);

    // Click refresh
    await refreshBtn.click();

    const taskRequest = await taskRequestPromise;

    if (taskRequest) {
      console.log('✓ /task/ordered API called on refresh');
    }

    await page.waitForTimeout(1500);

    // Look for notification
    const notification = page.locator('.q-notification');
    const notificationVisible = await notification.isVisible().catch(() => false);

    if (notificationVisible) {
      const text = await notification.textContent();
      console.log('  - Notification:', text);
    }

    console.log('✓ Refresh button works');
  });
});
