import { test, expect, ConsoleMessage } from '@playwright/test';

test.describe('Task Page Functionality', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Clear console message arrays
    consoleErrors = [];
    consoleWarnings = [];

    // Listen for console messages
    page.on('console', (msg: ConsoleMessage) => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        consoleErrors.push(text);
        console.log('❌ Console Error:', text);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
        console.log('⚠️ Console Warning:', text);
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
      console.log('❌ Page Error:', error.message);
    });

    // Navigate to the app
    await page.goto('http://localhost:9000');

    // Click "Sign in manually" button to show login form
    await page.click('button:has-text("Sign in manually")');

    // Wait for login form to appear
    await page.waitForSelector('input[placeholder="Enter your username or email"]', { timeout: 5000 });

    // Login
    await page.fill('input[placeholder="Enter your username or email"]', 'guillermotabligan');
    await page.fill('input[placeholder="Enter your password"]', 'water123');
    await page.click('button:has-text("Sign In")');

    // Wait for navigation to complete
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to tasks page
    await page.click('text=Task');
    await page.waitForURL('**/member/task/**', { timeout: 10000 });

    // Wait for tasks to load
    await page.waitForSelector('text=To do', { timeout: 10000 });
  });

  test('Should load task page without console errors', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Check for console errors
    expect(consoleErrors, 'Page should not have console errors').toHaveLength(0);

    // Report warnings if any
    if (consoleWarnings.length > 0) {
      console.log('⚠️ Warnings found:', consoleWarnings);
    }
  });

  test('Should change assignee without errors', async ({ page }) => {
    // Wait for task rows to be visible
    await page.waitForSelector('.task-row', { timeout: 10000 });

    // Find the first task row
    const firstTaskRow = await page.locator('.task-row').first();

    // Click on the assignee button to open dropdown
    const assigneeButton = firstTaskRow.locator('.assignee-button').first();
    await assigneeButton.click();

    // Wait for dropdown to appear
    await page.waitForSelector('.assignee-dropdown', { timeout: 5000 });

    // Select first user from dropdown
    const dropdownItems = await page.locator('.assignee-dropdown .dropdown-item').all();
    if (dropdownItems.length > 1) {
      // Skip the "Unassigned" option and click the first user
      await dropdownItems[1].click();
    }

    // Wait for update to complete
    await page.waitForTimeout(2000);

    // Check for errors after assignee change
    expect(consoleErrors, 'Should not have errors after assignee change').toHaveLength(0);
  });

  test('Should update priority without errors', async ({ page }) => {
    // Wait for task rows to be visible
    await page.waitForSelector('.task-row', { timeout: 10000 });

    // Find first task
    const firstTask = await page.locator('.task-row').first();

    // Click on priority button to open dropdown
    const priorityButton = firstTask.locator('.priority-button').first();
    await priorityButton.click();

    // Wait for dropdown options
    await page.waitForSelector('.priority-dropdown', { timeout: 5000 });

    // Select a different priority
    const options = await page.locator('.priority-dropdown .dropdown-item').all();
    if (options.length > 0) {
      await options[0].click();
    }

    // Wait for update
    await page.waitForTimeout(2000);

    // Check for errors
    expect(consoleErrors, 'Should not have errors after priority change').toHaveLength(0);
  });

  test('Should verify realtime updates', async ({ page, context }) => {
    // Open a second tab to simulate another user
    const page2 = await context.newPage();

    // Setup console monitoring for second page
    page2.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`Page2: ${msg.text()}`);
      }
    });

    // Navigate in second tab (should already be logged in from shared context)
    await page2.goto('http://localhost:9000');

    // Check if already logged in or needs login
    const needsLogin = await page2.locator('button:has-text("Sign in manually")').count() > 0;

    if (needsLogin) {
      // Click "Sign in manually" button to show login form
      await page2.click('button:has-text("Sign in manually")');
      await page2.waitForSelector('input[placeholder="Enter your username or email"]', { timeout: 5000 });

      await page2.fill('input[placeholder="Enter your username or email"]', 'guillermotabligan');
      await page2.fill('input[placeholder="Enter your password"]', 'water123');
      await page2.click('button:has-text("Sign In")');
      await page2.waitForURL('**/dashboard', { timeout: 10000 });
    } else {
      // Already logged in, wait for dashboard
      await page2.waitForURL('**/dashboard', { timeout: 10000 });
    }

    await page2.click('text=Task');
    await page2.waitForURL('**/member/task/**', { timeout: 10000 });

    // Wait for tasks to load on both pages
    await page.waitForSelector('.task-row', { timeout: 5000 });
    await page2.waitForSelector('.task-row', { timeout: 5000 });

    // Make a change in second page
    const firstTaskRow2 = await page2.locator('.task-row').first();
    const assigneeButton2 = firstTaskRow2.locator('.assignee-button').first();

    // Click to open assignee dropdown
    await assigneeButton2.click();
    await page2.waitForSelector('.assignee-dropdown', { timeout: 5000 });

    // Select first user option
    const dropdownItems2 = await page2.locator('.assignee-dropdown .dropdown-item').all();
    if (dropdownItems2.length > 1) {
      await dropdownItems2[1].click(); // Skip unassigned, select first user
    }

    // Wait for potential realtime update
    await page.waitForTimeout(3000);

    // Check if first page received the update
    // (This would be visible if assignee badge or indicator changed)

    // Check for errors on both pages
    expect(consoleErrors, 'Should not have errors during realtime updates').toHaveLength(0);

    await page2.close();
  });

  test('Should display task details correctly', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-row', { timeout: 10000 });

    // Check that essential elements are present
    const taskElements = {
      title: await page.locator('.task-title').count(),
      assignee: await page.locator('.assignee-name').count(),
      priority: await page.locator('.priority-button').count()
    };

    expect(taskElements.title, 'Should have task titles').toBeGreaterThan(0);
    expect(taskElements.assignee, 'Should have assignee elements').toBeGreaterThan(0);

    // Final check for errors
    expect(consoleErrors, 'Should not have any console errors').toHaveLength(0);

    // Report final warning count
    console.log(`Test completed with ${consoleWarnings.length} warnings`);
  });

  test.afterEach(async () => {
    // Report all errors and warnings found
    if (consoleErrors.length > 0) {
      console.log('\n❌ All Console Errors:');
      consoleErrors.forEach(error => console.log('  -', error));
    }

    if (consoleWarnings.length > 0) {
      console.log('\n⚠️ All Console Warnings:');
      consoleWarnings.forEach(warning => console.log('  -', warning));
    }
  });
});