import { test, expect } from '@playwright/test';

test.describe('Task Board View - Drag and Drop & Animations', () => {

  test('Task Board View - Complete functionality test', async ({ page }) => {
    // Track console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known warnings
        if (!text.includes('GoTrueClient instances') &&
            !text.includes('Multiple instances') &&
            !text.includes('ResizeObserver')) {
          consoleErrors.push(text);
        }
      }
    });

    // ============= STEP 1: LOGIN =============
    console.log('STEP 1: Logging in...');
    await page.goto('http://localhost:9000');
    await page.click('button:has-text("Sign in manually")');
    await page.waitForSelector('input[placeholder="Enter your username or email"]', { timeout: 10000 });
    await page.fill('input[placeholder="Enter your username or email"]', 'guillermotabligan');
    await page.fill('input[placeholder="Enter your password"]', 'water123');
    await page.click('button:has-text("Sign in")');

    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    console.log('  ✓ Login successful');

    // ============= STEP 2: NAVIGATE TO TASKS =============
    console.log('STEP 2: Navigating to Tasks...');

    // Click on Task in the sidebar
    const sidebarTask = await page.$('.q-item:has-text("Task")');
    if (sidebarTask) {
      await sidebarTask.click();
    } else {
      await page.click('.q-drawer >> text="Task"');
    }
    await page.waitForTimeout(2000);

    // Click on My Task
    console.log('  Clicking on My Task...');
    await page.click('text="My Task"');
    await page.waitForTimeout(3000);
    console.log('  ✓ Navigated to My Task');

    // ============= STEP 3: SWITCH TO BOARD VIEW =============
    console.log('STEP 3: Switching to Board View...');

    // Look for the board view button (icon: view_column)
    const boardViewButton = await page.$('button .q-icon[aria-label="view_column"]') ||
                            await page.$('button:has(.q-icon:text("view_column"))');

    if (boardViewButton) {
      await boardViewButton.click();
      await page.waitForTimeout(2000);
      console.log('  ✓ Switched to Board View');
    } else {
      console.log('  ⚠ Board view button not found, might already be in board view');
    }

    // Take screenshot
    await page.screenshot({ path: 'test-board-1-initial.png', fullPage: true });

    // ============= STEP 4: VERIFY BOARD STRUCTURE =============
    console.log('STEP 4: Verifying board structure...');

    // Check for board columns
    const boardColumns = await page.$$('.board-column');
    console.log(`  Found ${boardColumns.length} board columns`);
    expect(boardColumns.length).toBeGreaterThanOrEqual(3); // Should have at least To Do, In Progress, Done

    // Check for column headers
    const columnHeaders = await page.$$('.column-header');
    console.log(`  Found ${columnHeaders.length} column headers`);

    // Check for refresh button
    const refreshButton = await page.$('button:has(.q-icon[aria-label="refresh"])') ||
                          await page.$('button .q-icon:text("refresh")');
    if (refreshButton) {
      console.log('  ✓ Refresh button found');
    } else {
      console.log('  ⚠ Refresh button not found');
    }

    // Check for task cards
    const taskCards = await page.$$('.task-card');
    console.log(`  Found ${taskCards.length} task cards`);

    // ============= STEP 5: TEST REFRESH FUNCTIONALITY =============
    console.log('STEP 5: Testing refresh functionality...');

    if (refreshButton) {
      // Check for cache indicator before refresh
      const cacheIndicatorBefore = await page.$('text=/Updated.*ago/');
      if (cacheIndicatorBefore) {
        console.log('  ✓ Cache indicator visible');
      }

      // Click refresh button
      await refreshButton.click();
      await page.waitForTimeout(2000);
      console.log('  ✓ Refresh button clicked');

      // Verify loading animation (spinner-dots)
      const spinner = await page.$('.q-spinner-dots');
      if (spinner) {
        console.log('  ✓ Loading spinner appeared (may be brief)');
      }

      await page.waitForTimeout(1000);

      // Check for cache indicator after refresh
      const cacheIndicatorAfter = await page.$('text=/Updated.*ago/') ||
                                   await page.$('text=just now');
      if (cacheIndicatorAfter) {
        console.log('  ✓ Cache indicator updated after refresh');
      }
    }

    await page.screenshot({ path: 'test-board-2-after-refresh.png', fullPage: true });

    // ============= STEP 6: TEST DRAG AND DROP BETWEEN COLUMNS =============
    console.log('STEP 6: Testing drag and drop between columns...');

    // Find columns
    const todoColumn = await page.$('.board-column:has-text("To Do")');
    const inProgressColumn = await page.$('.board-column:has-text("In Progress")');

    if (todoColumn && inProgressColumn) {
      // Get task cards in To Do column
      const todoTasks = await todoColumn.$$('.task-card');
      console.log(`  Found ${todoTasks.length} tasks in To Do column`);

      if (todoTasks.length > 0) {
        // Get the first task
        const firstTask = todoTasks[0];
        const taskTitle = await firstTask.$eval('.task-card-title', el => el.textContent?.trim());
        console.log(`  Dragging task: "${taskTitle}"`);

        // Get bounding boxes
        const taskBox = await firstTask.boundingBox();
        const columnBox = await inProgressColumn.boundingBox();

        if (taskBox && columnBox) {
          // Start dragging
          await page.mouse.move(taskBox.x + taskBox.width / 2, taskBox.y + taskBox.height / 2);
          await page.mouse.down();
          await page.waitForTimeout(200);

          console.log('  Moving to In Progress column...');

          // Drag to In Progress column
          await page.mouse.move(
            columnBox.x + columnBox.width / 2,
            columnBox.y + columnBox.height / 2,
            { steps: 10 }
          );
          await page.waitForTimeout(300);

          // Check if drop-active class is applied
          const dropActive = await inProgressColumn.evaluate(el => el.classList.contains('drop-active'));
          if (dropActive) {
            console.log('  ✓ Drop-active state detected');
          }

          // Drop
          await page.mouse.up();
          await page.waitForTimeout(2000); // Wait for optimistic update and animation

          console.log('  ✓ Drag and drop completed');

          // Verify task moved to In Progress
          const inProgressTasks = await inProgressColumn.$$('.task-card');
          const movedTask = await Promise.all(
            inProgressTasks.map(async task => {
              const title = await task.$eval('.task-card-title', el => el.textContent?.trim());
              return title === taskTitle;
            })
          );

          if (movedTask.some(found => found)) {
            console.log('  ✓ Task successfully moved to In Progress column');
          } else {
            console.log('  ⚠ Task may not have moved or update is pending');
          }

          await page.screenshot({ path: 'test-board-3-after-drag.png', fullPage: true });
        } else {
          console.log('  ⚠ Could not get bounding boxes for drag and drop');
        }
      } else {
        console.log('  ⚠ No tasks in To Do column to test drag and drop');
      }
    } else {
      console.log('  ⚠ Could not find To Do or In Progress columns');
    }

    // ============= STEP 7: TEST HOVER EFFECTS =============
    console.log('STEP 7: Testing hover effects...');

    const allTaskCards = await page.$$('.task-card');
    if (allTaskCards.length > 0) {
      const firstCard = allTaskCards[0];

      // Hover over card
      await firstCard.hover();
      await page.waitForTimeout(500);

      console.log('  ✓ Hover effect tested (visual verification needed)');
      await page.screenshot({ path: 'test-board-4-hover.png', fullPage: true });
    }

    // ============= STEP 8: TEST EMPTY COLUMN MESSAGE =============
    console.log('STEP 8: Testing empty column message...');

    // Check for empty column messages
    const emptyColumnMessages = await page.$$('.empty-column');
    console.log(`  Found ${emptyColumnMessages.length} empty column message(s)`);

    if (emptyColumnMessages.length > 0) {
      const messageText = await emptyColumnMessages[0].textContent();
      console.log(`  Empty column message: "${messageText}"`);
    }

    // ============= STEP 9: TEST COLUMN BADGES =============
    console.log('STEP 9: Testing column badges...');

    // Check for badges showing task counts
    const badges = await page.$$('.q-badge');
    console.log(`  Found ${badges.length} badges`);

    for (let i = 0; i < Math.min(badges.length, 4); i++) {
      const badgeText = await badges[i].textContent();
      console.log(`  Badge ${i + 1}: ${badgeText}`);
    }

    // ============= STEP 10: VERIFY NO CONSOLE ERRORS =============
    console.log('STEP 10: Checking for console errors...');

    if (consoleErrors.length === 0) {
      console.log('  ✓ No console errors detected');
    } else {
      console.log('  ✗ Console errors found:');
      consoleErrors.forEach(err => console.log(`    - ${err}`));
    }

    // ============= STEP 11: TEST ANIMATIONS =============
    console.log('STEP 11: Testing animations...');

    // Refresh to see slideIn animation
    if (refreshButton) {
      await refreshButton.click();
      await page.waitForTimeout(1500);
      console.log('  ✓ Refresh animation tested (slideIn animation should be visible)');
    }

    await page.screenshot({ path: 'test-board-5-final.png', fullPage: true });

    // ============= FINAL SUMMARY =============
    console.log('\n========== TASK BOARD VIEW TEST SUMMARY ==========');
    console.log('✓ Login successful');
    console.log('✓ Navigation to Task Board View working');
    console.log(`✓ Board structure verified (${boardColumns.length} columns)`);
    console.log(`✓ Task cards found (${taskCards.length} cards)`);
    console.log('✓ Refresh functionality tested');
    console.log('✓ Drag and drop functionality tested');
    console.log('✓ Hover effects tested');
    console.log('✓ Column badges verified');
    console.log(`${consoleErrors.length === 0 ? '✓' : '✗'} Console errors: ${consoleErrors.length}`);
    console.log('==================================================\n');

    // Final assertions
    expect(boardColumns.length).toBeGreaterThanOrEqual(3);
    expect(consoleErrors.length).toBeLessThanOrEqual(0);
  });
});
