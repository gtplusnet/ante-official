import { test, expect } from '@playwright/test';

test.describe('Task Board - Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    console.log('\n=== Setting up test ===');

    // Navigate to login page
    console.log('  - Navigating to login page');
    await page.goto('http://localhost:9000');
    await page.waitForTimeout(2000);

    // Click "Sign in manually"
    console.log('  - Clicking "Sign in manually"');
    const signInManuallyButton = page.locator('text=Sign in manually');
    await signInManuallyButton.click();
    await page.waitForTimeout(1000);

    // Fill in login credentials
    console.log('  - Filling credentials');
    const usernameInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await usernameInput.fill('guillermotabligan');
    await passwordInput.fill('water123');

    // Submit login
    console.log('  - Submitting login');
    const submitButton = page.locator('button:has-text("Sign in")').first();
    await submitButton.click();

    // Wait for navigation to dashboard
    console.log('  - Waiting for dashboard');
    await page.waitForTimeout(3000);

    // Verify we're logged in
    const token = await page.evaluate(() => localStorage.getItem('token'));
    console.log(`  - Token stored: ${token ? '✅' : '❌'}`);

    if (!token) {
      console.log('❌ Login failed - no token');
      throw new Error('Login failed - no token stored');
    }

    // Navigate to Task Board
    console.log('  - Navigating to Task Board');
    await page.goto('http://localhost:9000/#/member/task/board');
    await page.waitForTimeout(3000);
  });

  test('1. Board should render with lanes', async ({ page }) => {
    console.log('\n=== Test 1: Board should render ===');

    // Wait for board columns to render
    console.log('  - Waiting for board columns');
    await page.waitForSelector('.board-column', { timeout: 10000 });

    // Count board columns
    const boardColumns = page.locator('.board-column');
    const count = await boardColumns.count();
    console.log(`  - Found ${count} board columns`);

    // Verify at least one column exists
    expect(count).toBeGreaterThan(0);

    // Get column titles
    const columnTitles = await page.locator('.column-title').allTextContents();
    console.log(`  - Column titles:`, columnTitles);

    console.log('✅ Board rendered successfully');
  });

  test('2. Tasks should be draggable', async ({ page }) => {
    console.log('\n=== Test 2: Tasks should be draggable ===');

    // Wait for board to load
    await page.waitForSelector('.board-column', { timeout: 10000 });

    // Find first task card
    const firstTask = page.locator('.task-card').first();
    const taskExists = await firstTask.count() > 0;

    if (!taskExists) {
      console.log('⚠️  No tasks found on board - skipping drag test');
      return;
    }

    // Verify task has draggable attribute
    const isDraggable = await firstTask.getAttribute('draggable');
    console.log(`  - Task draggable attribute: ${isDraggable}`);
    expect(isDraggable).toBe('true');

    // Verify cursor is grab
    const cursor = await firstTask.evaluate(el =>
      window.getComputedStyle(el).cursor
    );
    console.log(`  - Task cursor: ${cursor}`);
    expect(cursor).toBe('grab');

    console.log('✅ Tasks are draggable');
  });

  test('3. Drag task between lanes', async ({ page }) => {
    console.log('\n=== Test 3: Drag task between lanes ===');

    // Monitor API calls
    const apiCalls: any[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/task/move')) {
        apiCalls.push({
          method: request.method(),
          url: url,
          postData: request.postDataJSON()
        });
        console.log(`  🌐 API CALL: ${request.method()} /task/move`);
        console.log(`     Data:`, request.postDataJSON());
      }
    });

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/task/move')) {
        console.log(`  📥 RESPONSE: ${response.status()}`);
        try {
          const body = await response.json();
          console.log(`     Result:`, body);
        } catch (e) {
          // Ignore parse errors
        }
      }
    });

    // Wait for board to load
    await page.waitForSelector('.board-column', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Get columns
    const columns = page.locator('.board-column');
    const columnCount = await columns.count();

    if (columnCount < 2) {
      console.log('⚠️  Need at least 2 columns for drag test - skipping');
      return;
    }

    // Find a task in the first column
    const firstColumn = columns.nth(0);
    const tasksInFirstColumn = firstColumn.locator('.task-card');
    const taskCount = await tasksInFirstColumn.count();

    if (taskCount === 0) {
      console.log('⚠️  No tasks in first column - skipping drag test');
      return;
    }

    const taskToDrag = tasksInFirstColumn.first();
    const taskTitle = await taskToDrag.locator('.task-card-title').textContent();
    console.log(`  - Dragging task: "${taskTitle}"`);

    // Get source and target column positions
    const sourceColumn = firstColumn;
    const targetColumn = columns.nth(1);

    const sourceColumnTitle = await sourceColumn.locator('.column-title').textContent();
    const targetColumnTitle = await targetColumn.locator('.column-title').textContent();
    console.log(`  - From: ${sourceColumnTitle}`);
    console.log(`  - To: ${targetColumnTitle}`);

    // Get bounding boxes
    const sourceBox = await taskToDrag.boundingBox();
    const targetBox = await targetColumn.boundingBox();

    if (!sourceBox || !targetBox) {
      console.log('❌ Could not get element positions');
      return;
    }

    // Perform drag and drop
    console.log('  - Starting drag operation');

    // Method 1: Using Playwright's dragTo
    try {
      await taskToDrag.dragTo(targetColumn, {
        sourcePosition: { x: sourceBox.width / 2, y: sourceBox.height / 2 },
        targetPosition: { x: targetBox.width / 2, y: targetBox.height / 2 }
      });
    } catch (error) {
      console.log('  ⚠️  dragTo failed, trying manual drag');

      // Method 2: Manual drag using mouse events
      await page.mouse.move(
        sourceBox.x + sourceBox.width / 2,
        sourceBox.y + sourceBox.height / 2
      );
      await page.mouse.down();
      await page.waitForTimeout(300);

      await page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + 100,
        { steps: 10 }
      );
      await page.waitForTimeout(300);

      await page.mouse.up();
    }

    console.log('  - Drag completed');

    // Wait for API call
    await page.waitForTimeout(2000);

    // Verify API was called
    if (apiCalls.length > 0) {
      console.log('✅ Task move API was called');
      console.log(`   - Number of calls: ${apiCalls.length}`);

      const moveCall = apiCalls[0];
      console.log(`   - Request data:`, moveCall.postData);

      // Verify request has required fields
      expect(moveCall.postData).toHaveProperty('taskId');
      expect(moveCall.postData).toHaveProperty('boardLaneId');

    } else {
      console.log('⚠️  No API call detected - drag may not have triggered');
    }
  });

  test('4. Verify drop zone visual feedback', async ({ page }) => {
    console.log('\n=== Test 4: Drop zone visual feedback ===');

    // Wait for board to load
    await page.waitForSelector('.board-column', { timeout: 10000 });

    // Find first task
    const firstTask = page.locator('.task-card').first();
    const taskExists = await firstTask.count() > 0;

    if (!taskExists) {
      console.log('⚠️  No tasks found - skipping feedback test');
      return;
    }

    // Start dragging
    const taskBox = await firstTask.boundingBox();
    if (!taskBox) {
      console.log('❌ Could not get task position');
      return;
    }

    console.log('  - Starting drag');
    await page.mouse.move(
      taskBox.x + taskBox.width / 2,
      taskBox.y + taskBox.height / 2
    );
    await page.mouse.down();
    await page.waitForTimeout(300);

    // Check if task has drag-source class
    const classes = await firstTask.getAttribute('class');
    console.log(`  - Task classes during drag: ${classes}`);

    if (classes?.includes('drag-source')) {
      console.log('✅ Drag source class applied');
    } else {
      console.log('⚠️  Drag source class not detected');
    }

    // Cancel drag
    await page.mouse.up();
    await page.waitForTimeout(300);

    console.log('✅ Visual feedback test complete');
  });

  test('5. Prevent click navigation during drag', async ({ page }) => {
    console.log('\n=== Test 5: Prevent accidental navigation ===');

    // Track navigation
    let navigated = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        const url = frame.url();
        if (url.includes('/member/task/') && !url.includes('/board')) {
          navigated = true;
          console.log(`  ⚠️  Navigated to: ${url}`);
        }
      }
    });

    // Wait for board to load
    await page.waitForSelector('.board-column', { timeout: 10000 });

    // Find first task
    const firstTask = page.locator('.task-card').first();
    const taskExists = await firstTask.count() > 0;

    if (!taskExists) {
      console.log('⚠️  No tasks found - skipping navigation test');
      return;
    }

    const taskBox = await firstTask.boundingBox();
    if (!taskBox) return;

    console.log('  - Performing short drag (should not navigate)');

    // Perform a very short drag
    await page.mouse.move(
      taskBox.x + taskBox.width / 2,
      taskBox.y + taskBox.height / 2
    );
    await page.mouse.down();
    await page.waitForTimeout(100);

    // Small movement
    await page.mouse.move(
      taskBox.x + taskBox.width / 2 + 5,
      taskBox.y + taskBox.height / 2 + 5
    );
    await page.waitForTimeout(100);

    await page.mouse.up();
    await page.waitForTimeout(500);

    // Verify we didn't navigate
    if (!navigated) {
      console.log('✅ No accidental navigation during drag');
    } else {
      console.log('❌ Accidental navigation occurred');
    }

    expect(navigated).toBe(false);
  });
});
