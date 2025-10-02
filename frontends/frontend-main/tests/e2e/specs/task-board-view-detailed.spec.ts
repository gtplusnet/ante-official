import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getTestUser } from '../fixtures/test-data';

test.describe('Task Board View - Detailed Check', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('Board view comprehensive functionality test', async ({ page }) => {
    const testUser = getTestUser('DEFAULT');
    const errors = {
      console: [],
      api: [],
      warnings: []
    };

    console.log('🎯 TASK BOARD VIEW - DETAILED ANALYSIS');
    console.log('=' .repeat(60));

    // Setup error monitoring
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        errors.console.push(text);
        console.log(`❌ Console Error: ${text}`);
      } else if (type === 'warning' && !text.includes('Deprecation') && !text.includes('GoTrueClient')) {
        errors.warnings.push(text);
        console.log(`⚠️ Warning: ${text}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/rest/v1/') && response.status() >= 400) {
        const error = `${response.status()} - ${response.url()}`;
        errors.api.push(error);
        console.log(`🔴 API Error: ${error.substring(0, 150)}...`);
      }
    });

    // Login
    await loginPage.login(testUser);
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
    console.log('✅ Logged in successfully\n');

    // Navigate to tasks
    await page.waitForTimeout(2000);
    await page.locator('text=Task').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('✅ Navigated to task module\n');

    // Step 1: Verify list view is working first
    await test.step('1. Verify List View', async () => {
      console.log('📋 STEP 1: Verifying List View First');

      const listButton = page.locator('button:has-text("List"), [aria-label*="list"]').first();
      if (await listButton.isVisible()) {
        await listButton.click();
        await page.waitForTimeout(1000);
      }

      const taskRows = page.locator('.task-row');
      const rowCount = await taskRows.count();
      console.log(`  ✅ List view has ${rowCount} task rows`);

      // Check for errors in list view
      if (errors.console.length === 0) {
        console.log('  ✅ No console errors in list view');
      }
    });

    // Step 2: Switch to board view
    await test.step('2. Switch to Board View', async () => {
      console.log('\n🎯 STEP 2: Switching to Board View');

      // Clear previous errors
      errors.console = [];
      errors.api = [];

      const boardButton = page.locator('button:has-text("Board"), [aria-label*="board"], button:has-text("Kanban")').first();

      if (await boardButton.isVisible()) {
        console.log('  Found board button, clicking...');
        await boardButton.click();
        await page.waitForTimeout(3000); // Give more time for board to load

        // Check immediate errors
        if (errors.console.length > 0) {
          console.log('  ❌ Errors when switching to board view:');
          errors.console.forEach(err => console.log(`    - ${err}`));
        } else {
          console.log('  ✅ No errors when switching to board view');
        }
      } else {
        console.log('  ❌ Board view button not found');
      }
    });

    // Step 3: Analyze board structure
    await test.step('3. Analyze Board Structure', async () => {
      console.log('\n📊 STEP 3: Analyzing Board Structure');

      // Check for board container
      const boardContainers = [
        '.board-view',
        '.kanban-board',
        '.board-container',
        '.task-board',
        '[class*="board"]'
      ];

      let boardFound = false;
      for (const selector of boardContainers) {
        const container = page.locator(selector).first();
        if (await container.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`  ✅ Found board container: ${selector}`);
          boardFound = true;

          // Get container classes
          const classes = await container.getAttribute('class');
          console.log(`     Classes: ${classes}`);
          break;
        }
      }

      if (!boardFound) {
        console.log('  ⚠️ No board container found');
      }

      // Check for columns/lanes
      const columnSelectors = [
        '.board-column',
        '.kanban-column',
        '.board-lane',
        '.lane',
        '.column',
        '[class*="column"]'
      ];

      for (const selector of columnSelectors) {
        const columns = page.locator(selector);
        const count = await columns.count();
        if (count > 0) {
          console.log(`  ✅ Found ${count} columns with selector: ${selector}`);

          // List column headers
          for (let i = 0; i < Math.min(count, 5); i++) {
            const column = columns.nth(i);
            const headerText = await column.locator('.column-header, .lane-header, .column-title, h3, h4').first().textContent().catch(() => null);
            if (headerText) {
              console.log(`     Column ${i + 1}: "${headerText.trim()}"`);
            }
          }
          break;
        }
      }
    });

    // Step 4: Check task cards
    await test.step('4. Check Task Cards', async () => {
      console.log('\n🃏 STEP 4: Checking Task Cards');

      const cardSelectors = [
        '.task-card',
        '.board-card',
        '.kanban-card',
        '.card',
        '[class*="card"]'
      ];

      let cardsFound = false;
      for (const selector of cardSelectors) {
        const cards = page.locator(selector);
        const count = await cards.count();
        if (count > 0) {
          console.log(`  ✅ Found ${count} task cards with selector: ${selector}`);
          cardsFound = true;

          // Check first card structure
          const firstCard = cards.first();
          const cardTitle = await firstCard.locator('.card-title, .task-title, [class*="title"]').first().textContent().catch(() => null);
          if (cardTitle) {
            console.log(`     First card title: "${cardTitle.trim()}"`);
          }

          // Check card elements
          const hasAssignee = await firstCard.locator('[class*="assignee"]').isVisible({ timeout: 500 }).catch(() => false);
          const hasPriority = await firstCard.locator('[class*="priority"]').isVisible({ timeout: 500 }).catch(() => false);
          const hasDueDate = await firstCard.locator('[class*="due"]').isVisible({ timeout: 500 }).catch(() => false);

          console.log(`     Card elements: Assignee=${hasAssignee}, Priority=${hasPriority}, DueDate=${hasDueDate}`);
          break;
        }
      }

      if (!cardsFound) {
        console.log('  ⚠️ No task cards found in board view');

        // Check if there's an empty state message
        const emptyState = page.locator('.empty-state, .no-tasks, [class*="empty"]').first();
        if (await emptyState.isVisible({ timeout: 500 }).catch(() => false)) {
          const emptyText = await emptyState.textContent();
          console.log(`  ℹ️ Empty state message: "${emptyText?.trim()}"`);
        }
      }
    });

    // Step 5: Test drag and drop
    await test.step('5. Test Drag and Drop', async () => {
      console.log('\n🎯 STEP 5: Testing Drag and Drop');

      const firstCard = page.locator('.task-card, .board-card').first();

      if (await firstCard.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Check if card has draggable attribute
        const isDraggable = await firstCard.getAttribute('draggable');
        console.log(`  Card draggable attribute: ${isDraggable}`);

        if (isDraggable === 'true') {
          console.log('  ✅ Cards are marked as draggable');

          // Try to drag
          try {
            const targetColumn = page.locator('.board-column, .kanban-column').nth(1);
            if (await targetColumn.isVisible()) {
              await firstCard.dragTo(targetColumn);
              await page.waitForTimeout(1000);
              console.log('  ✅ Drag action executed');

              // Check for errors after drag
              if (errors.console.length === 0) {
                console.log('  ✅ No errors during drag operation');
              }
            }
          } catch (e) {
            console.log('  ⚠️ Could not test drag and drop');
          }
        } else {
          console.log('  ℹ️ Cards are not draggable');
        }
      }
    });

    // Step 6: Check board view data loading
    await test.step('6. Check Data Loading', async () => {
      console.log('\n📡 STEP 6: Checking Data Loading');

      // Check network requests
      const taskApiCalls = await page.evaluate(() => {
        return window.performance.getEntries()
          .filter(entry => entry.name.includes('/rest/v1/Task'))
          .map(entry => ({
            url: entry.name.substring(0, 100),
            duration: Math.round(entry.duration)
          }));
      });

      if (taskApiCalls.length > 0) {
        console.log(`  ✅ Found ${taskApiCalls.length} Task API calls`);
        taskApiCalls.slice(0, 3).forEach(call => {
          console.log(`     - ${call.url}... (${call.duration}ms)`);
        });
      } else {
        console.log('  ⚠️ No Task API calls detected');
      }

      // Check if data is actually displayed
      const visibleTasks = await page.locator('.task-card:visible, .board-card:visible').count();
      console.log(`  Tasks visible in board: ${visibleTasks}`);
    });

    // Step 7: Compare with list view
    await test.step('7. Compare with List View', async () => {
      console.log('\n🔄 STEP 7: Comparing with List View');

      // Count tasks in board view
      const boardTasks = await page.locator('.task-card, .board-card').count();
      console.log(`  Board view tasks: ${boardTasks}`);

      // Switch back to list view
      const listButton = page.locator('button:has-text("List")').first();
      if (await listButton.isVisible()) {
        await listButton.click();
        await page.waitForTimeout(1000);

        const listTasks = await page.locator('.task-row').count();
        console.log(`  List view tasks: ${listTasks}`);

        if (boardTasks === listTasks) {
          console.log('  ✅ Task count matches between views');
        } else {
          console.log(`  ⚠️ Task count mismatch: Board=${boardTasks}, List=${listTasks}`);
        }
      }
    });

    // Step 8: Take screenshots
    await test.step('8. Screenshots', async () => {
      console.log('\n📸 STEP 8: Taking Screenshots');

      // Switch back to board view for screenshot
      const boardButton = page.locator('button:has-text("Board")').first();
      if (await boardButton.isVisible()) {
        await boardButton.click();
        await page.waitForTimeout(2000);
      }

      await page.screenshot({
        path: 'screenshots/board-view-detailed.png',
        fullPage: true
      });
      console.log('  ✅ Screenshot saved: board-view-detailed.png');
    });

    // Final Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 BOARD VIEW TEST SUMMARY');
    console.log('=' .repeat(60));

    if (errors.console.length === 0) {
      console.log('\n✅ NO CONSOLE ERRORS');
    } else {
      console.log(`\n❌ CONSOLE ERRORS (${errors.console.length}):`);
      errors.console.forEach(err => console.log(`  - ${err}`));
    }

    if (errors.api.length === 0) {
      console.log('✅ NO API ERRORS');
    } else {
      console.log(`\n❌ API ERRORS (${errors.api.length}):`);
      errors.api.forEach(err => console.log(`  - ${err}`));
    }

    if (errors.warnings.length > 0) {
      console.log(`\n⚠️ WARNINGS (${errors.warnings.length}):`);
      errors.warnings.forEach(warn => console.log(`  - ${warn}`));
    }

    const hasErrors = errors.console.length > 0 || errors.api.length > 0;
    if (!hasErrors) {
      console.log('\n🎉 BOARD VIEW IS WORKING WITHOUT ERRORS!');
    } else {
      console.log('\n⚠️ BOARD VIEW HAS ISSUES THAT NEED ATTENTION');
    }

    console.log('=' .repeat(60));

    // Assert no critical errors
    expect(errors.console.length).toBe(0);
    expect(errors.api.length).toBe(0);
  });
});