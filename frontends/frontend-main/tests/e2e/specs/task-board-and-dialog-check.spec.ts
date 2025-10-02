import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getTestUser } from '../fixtures/test-data';

test.describe('Task Board View and Dialog Check', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('Check board view and task dialog errors', async ({ page }) => {
    const testUser = getTestUser('DEFAULT');
    const consoleErrors = [];

    // Capture all console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        consoleErrors.push({ type: 'error', text });
        console.log(`❌ ERROR: ${text}`);
      } else if (type === 'warning' && !text.includes('Deprecation')) {
        console.log(`⚠️ WARNING: ${text}`);
      }
    });

    // Capture network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        const url = response.url();
        if (url.includes('/rest/v1/') || url.includes('/api/')) {
          console.log(`🔴 API Error ${response.status()}: ${url.substring(0, 100)}...`);
        }
      }
    });

    console.log('🎯 Testing Board View and Task Dialog');

    // Login
    await loginPage.login(testUser);
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
    console.log('✅ Logged in');

    // Navigate to tasks
    await page.waitForTimeout(2000);
    await page.locator('text=Task').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Step 1: Test clicking on task to open dialog
    await test.step('Test task dialog opening', async () => {
      console.log('\n📋 Testing Task Dialog:');

      // Clear any previous errors
      consoleErrors.length = 0;

      // Find and click on first task
      const taskRow = page.locator('.task-row').first();
      const taskTitle = taskRow.locator('.task-title').first();

      if (await taskTitle.isVisible()) {
        const titleText = await taskTitle.textContent();
        console.log(`  Clicking on task: "${titleText?.trim()}"`);

        // Click and wait
        await taskTitle.click();
        await page.waitForTimeout(2000);

        // Check for console errors
        if (consoleErrors.length > 0) {
          console.log('  Console errors after clicking task:');
          consoleErrors.forEach(err => {
            console.log(`    - ${err.text}`);
          });
        } else {
          console.log('  No console errors when clicking task');
        }

        // Check what elements are present
        const possibleDialogs = [
          { selector: '[role="dialog"]', name: 'Role dialog' },
          { selector: '.q-dialog', name: 'Q-Dialog' },
          { selector: '.task-dialog', name: 'Task dialog' },
          { selector: '.task-details', name: 'Task details' },
          { selector: '.modal', name: 'Modal' },
          { selector: '.q-card', name: 'Q-Card' }
        ];

        console.log('  Checking for dialog elements:');
        for (const dialog of possibleDialogs) {
          const isVisible = await page.locator(dialog.selector).isVisible({ timeout: 500 }).catch(() => false);
          if (isVisible) {
            console.log(`    ✅ ${dialog.name} is visible`);
          }
        }

        // Try clicking elsewhere to see if it's a routing issue
        console.log('  Checking if it navigates to a different route:');
        const currentUrl = page.url();
        console.log(`    Current URL: ${currentUrl}`);

        // Close any open dialog
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    });

    // Step 2: Test board view
    await test.step('Test board view', async () => {
      console.log('\n🎯 Testing Board View:');

      // Clear errors
      consoleErrors.length = 0;

      // Find and click board view button
      const boardButton = page.locator('button:has-text("Board")').first();

      if (await boardButton.isVisible()) {
        console.log('  Clicking Board view button...');
        await boardButton.click();
        await page.waitForTimeout(3000);

        // Check for console errors
        if (consoleErrors.length > 0) {
          console.log('  Console errors after switching to board view:');
          consoleErrors.forEach(err => {
            console.log(`    - ${err.text}`);
          });
        } else {
          console.log('  No console errors when switching to board view');
        }

        // Check what's visible
        const boardElements = [
          { selector: '.board-view', name: 'Board view container' },
          { selector: '.kanban-board', name: 'Kanban board' },
          { selector: '.board-column', name: 'Board columns' },
          { selector: '.kanban-column', name: 'Kanban columns' },
          { selector: '.lane', name: 'Lanes' },
          { selector: '.board-lane', name: 'Board lanes' },
          { selector: '.task-card', name: 'Task cards' },
          { selector: '.board-card', name: 'Board cards' }
        ];

        console.log('  Checking for board elements:');
        for (const element of boardElements) {
          const count = await page.locator(element.selector).count();
          if (count > 0) {
            console.log(`    ✅ Found ${count} ${element.name}`);
          }
        }

        // Check if list view is still visible (might not be switching properly)
        const listViewVisible = await page.locator('.task-list-view, .list-view').isVisible({ timeout: 500 }).catch(() => false);
        if (listViewVisible) {
          console.log('  ⚠️ List view is still visible - view might not be switching');
        }

        // Take screenshot of board view attempt
        await page.screenshot({
          path: 'screenshots/board-view-attempt.png',
          fullPage: true
        });
      }
    });

    // Step 3: Check for specific error patterns
    await test.step('Analyze error patterns', async () => {
      console.log('\n🔍 Error Analysis:');

      // Check if there are any Vue errors
      const vueErrors = consoleErrors.filter(err =>
        err.text.includes('Vue') ||
        err.text.includes('Cannot read') ||
        err.text.includes('undefined')
      );

      if (vueErrors.length > 0) {
        console.log('  Vue/Component errors found:');
        vueErrors.forEach(err => {
          console.log(`    - ${err.text}`);
        });
      }

      // Check for missing component errors
      const componentErrors = consoleErrors.filter(err =>
        err.text.includes('component') ||
        err.text.includes('Component') ||
        err.text.includes('Failed to resolve')
      );

      if (componentErrors.length > 0) {
        console.log('  Component resolution errors:');
        componentErrors.forEach(err => {
          console.log(`    - ${err.text}`);
        });
      }

      // Check for API/permission errors
      const apiErrors = consoleErrors.filter(err =>
        err.text.includes('403') ||
        err.text.includes('permission') ||
        err.text.includes('401')
      );

      if (apiErrors.length > 0) {
        console.log('  API/Permission errors:');
        apiErrors.forEach(err => {
          console.log(`    - ${err.text}`);
        });
      }

      if (consoleErrors.length === 0) {
        console.log('  ✅ No console errors detected');
      } else {
        console.log(`  Total errors found: ${consoleErrors.length}`);
      }
    });

    // Step 4: Try alternative ways to open task details
    await test.step('Try alternative task opening methods', async () => {
      console.log('\n🔄 Alternative Task Opening Methods:');

      // Switch back to list view if needed
      const listButton = page.locator('button:has-text("List")').first();
      if (await listButton.isVisible()) {
        await listButton.click();
        await page.waitForTimeout(1000);
      }

      // Try double-click
      const firstTask = page.locator('.task-row').first();
      if (await firstTask.isVisible()) {
        console.log('  Trying double-click on task row...');
        await firstTask.dblclick();
        await page.waitForTimeout(1000);

        const dialogOpen = await page.locator('[role="dialog"], .q-dialog').isVisible({ timeout: 500 }).catch(() => false);
        console.log(`    Dialog after double-click: ${dialogOpen}`);

        if (dialogOpen) {
          await page.keyboard.press('Escape');
        }
      }

      // Check if there's an edit button
      const editButton = firstTask.locator('[aria-label*="edit"], .edit-button, button:has-text("Edit")').first();
      if (await editButton.isVisible({ timeout: 500 }).catch(() => false)) {
        console.log('  Found edit button, clicking...');
        await editButton.click();
        await page.waitForTimeout(1000);

        const dialogOpen = await page.locator('[role="dialog"], .q-dialog').isVisible({ timeout: 500 }).catch(() => false);
        console.log(`    Dialog after edit button: ${dialogOpen}`);

        if (dialogOpen) {
          await page.keyboard.press('Escape');
        }
      }

      // Check if there's a view button
      const viewButton = firstTask.locator('[aria-label*="view"], .view-button, button:has-text("View")').first();
      if (await viewButton.isVisible({ timeout: 500 }).catch(() => false)) {
        console.log('  Found view button, clicking...');
        await viewButton.click();
        await page.waitForTimeout(1000);

        const dialogOpen = await page.locator('[role="dialog"], .q-dialog').isVisible({ timeout: 500 }).catch(() => false);
        console.log(`    Dialog after view button: ${dialogOpen}`);

        if (dialogOpen) {
          await page.keyboard.press('Escape');
        }
      }
    });

    console.log('\n✅ Board view and dialog check completed');
    console.log(`Total console errors: ${consoleErrors.length}`);
  });
});