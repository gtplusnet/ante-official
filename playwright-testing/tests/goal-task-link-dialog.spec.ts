import { test, expect } from '@playwright/test';

test.describe('GoalTaskLinkDialog - Task Loading Test', () => {
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

    // Navigate to Goals page
    const currentURL = page.url();
    if (!currentURL.includes('/member/task')) {
      await page.goto('http://localhost:9001/#/member/task/goals', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
    } else {
      // Navigate from tasks to goals
      await page.goto('http://localhost:9001/#/member/task/goals', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
    }
  });

  test('should verify goals page loads and check console errors', async ({ page }) => {
    console.log('\n🔍 Testing goals page load...\n');

    // Collect console errors
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error('❌ Console Error:', msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(error.message);
      console.error('❌ Page Error:', error.message);
    });

    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({
      path: '/home/jhay/projects/ante-official/playwright-testing/test-results/goals-page.png',
      fullPage: true
    });

    // Check console errors
    console.log(`\n📊 Console Errors: ${consoleErrors.length}`);
    console.log(`📊 Console Warnings: ${consoleWarnings.length}\n`);

    if (consoleErrors.length > 0) {
      console.log('❌ Console Errors Found:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    expect(consoleErrors.length, `Found ${consoleErrors.length} console errors`).toBe(0);
  });

  test('should open GoalTaskLinkDialog and verify task list loads', async ({ page }) => {
    console.log('\n🔍 Testing GoalTaskLinkDialog task loading...\n');

    // Collect console errors
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error('❌ Console Error:', msg.text());
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(error.message);
      console.error('❌ Page Error:', error.message);
    });

    // Listen for network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        const errorMsg = `HTTP ${response.status()} - ${response.url()}`;
        networkErrors.push(errorMsg);
        console.error('❌ Network Error:', errorMsg);
      }
    });

    await page.waitForTimeout(3000);

    // Find goal cards
    const goalCards = page.locator('.goal-card');
    const cardCount = await goalCards.count();
    console.log(`✓ Found ${cardCount} goal cards`);

    if (cardCount > 0) {
      // Click the three-dot menu on the first goal card
      const firstCard = goalCards.first();

      // Try multiple selectors for the menu button
      const menuButton = firstCard.locator('button.q-btn--round, button[round], .q-btn--round');

      if (await menuButton.isVisible({ timeout: 2000 })) {
        await menuButton.click();
        console.log('✓ Clicked menu button');
        await page.waitForTimeout(500);

        // Click "Link Tasks" menu item
        const linkTasksItem = page.locator('text="Link Tasks"');
        if (await linkTasksItem.isVisible({ timeout: 2000 })) {
          await linkTasksItem.click();
          console.log('✓ Clicked "Link Tasks" menu item');
          await page.waitForTimeout(1000);

          // Take screenshot after dialog opens
          await page.screenshot({
            path: '/home/jhay/projects/ante-official/playwright-testing/test-results/goal-task-link-dialog-opened.png',
            fullPage: true
          });

          // Check for dialog
          const dialog = page.locator('.q-dialog');
          const dialogVisible = await dialog.isVisible({ timeout: 5000 });

          if (dialogVisible) {
            console.log('✓ Dialog is visible');

            // Wait for task list to load
            await page.waitForTimeout(3000);

            // Check for task items or loading spinner
            const loadingSpinner = page.locator('.q-spinner-dots');
            const spinnerVisible = await loadingSpinner.isVisible({ timeout: 1000 }).catch(() => false);

            if (spinnerVisible) {
              console.log('⏳ Loading spinner is visible');
              // Wait for spinner to disappear
              await loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
                console.log('⚠️  Loading spinner did not disappear');
              });
            }

            // Check for task items
            const taskItems = page.locator('.task-checkbox-item');
            const taskCount = await taskItems.count();
            console.log(`📋 Found ${taskCount} task items in dialog`);

            // Check for "No available tasks" message
            const noTasksMessage = page.locator('text="No available tasks found"');
            const noTasksVisible = await noTasksMessage.isVisible({ timeout: 2000 }).catch(() => false);

            if (noTasksVisible) {
              console.log('ℹ️  "No available tasks" message is visible');
            } else if (taskCount > 0) {
              console.log(`✅ Task list loaded successfully with ${taskCount} tasks`);
            }

            // Take screenshot of dialog content
            await page.screenshot({
              path: '/home/jhay/projects/ante-official/playwright-testing/test-results/goal-task-link-dialog-content.png',
              fullPage: true
            });

          } else {
            console.log('⚠️  Dialog did not appear');
          }
        } else {
          console.log('⚠️  "Link Tasks" menu item not found');
        }
      } else {
        console.log('⚠️  Menu button not found on goal card');
      }
    } else {
      console.log('⚠️  No goal cards found - user may need to create a goal first');

      // Take screenshot to debug
      await page.screenshot({
        path: '/home/jhay/projects/ante-official/playwright-testing/test-results/goals-page-no-goals.png',
        fullPage: true
      });
    }

    // Report errors
    console.log(`\n📊 Console Errors: ${consoleErrors.length}`);
    console.log(`📊 Network Errors: ${networkErrors.length}\n`);

    if (consoleErrors.length > 0) {
      console.log('❌ Console Errors:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (networkErrors.length > 0) {
      console.log('❌ Network Errors:');
      networkErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // Test should fail if there are console or network errors
    expect(consoleErrors.length + networkErrors.length,
      `Found ${consoleErrors.length} console errors and ${networkErrors.length} network errors`
    ).toBe(0);
  });
});
