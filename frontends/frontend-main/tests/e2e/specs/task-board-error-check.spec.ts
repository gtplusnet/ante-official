import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getTestUser } from '../fixtures/test-data';

test.describe('Task Board View - Error Check', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('Board view should have ZERO console errors', async ({ page }) => {
    const testUser = getTestUser('DEFAULT');
    const errors = [];
    const warnings = [];

    console.log('🔍 TASK BOARD ERROR CHECK');
    console.log('=' .repeat(60));

    // Capture ALL console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        errors.push(text);
        console.log(`\n❌ ERROR DETECTED:`);
        console.log(`   Type: ${type}`);
        console.log(`   Text: ${text}`);
        console.log(`   Time: ${new Date().toISOString()}`);
      } else if (type === 'warning' && !text.includes('GoTrueClient')) {
        if (!text.includes('Deprecation')) {
          warnings.push(text);
          console.log(`\n⚠️ WARNING:`);
          console.log(`   ${text}`);
        }
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`\n🔴 PAGE ERROR:`);
      console.log(`   ${error.message}`);
    });

    // Login
    await loginPage.login(testUser);
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
    console.log('✅ Logged in\n');

    // Navigate to tasks
    await page.waitForTimeout(2000);
    await page.locator('text=Task').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('✅ In task module\n');

    // Step 1: Start in list view to ensure data loads
    await test.step('1. Verify List View First', async () => {
      console.log('📋 STEP 1: List View Check');

      const listButton = page.locator('button:has-text("List")').first();
      if (await listButton.isVisible()) {
        await listButton.click();
        await page.waitForTimeout(1000);
      }

      const taskCount = await page.locator('.task-row').count();
      console.log(`  Tasks in list view: ${taskCount}`);

      if (errors.length === 0) {
        console.log('  ✅ No errors in list view');
      } else {
        console.log(`  ❌ ${errors.length} errors in list view`);
      }
    });

    // Step 2: Switch to board view
    await test.step('2. Switch to Board View', async () => {
      console.log('\n🎯 STEP 2: Switching to Board View');

      const boardButton = page.locator('button:has-text("Board")').first();

      if (await boardButton.isVisible()) {
        // Clear errors before switching
        const errorsBefore = errors.length;

        console.log('  Clicking board button...');
        await boardButton.click();
        await page.waitForTimeout(3000);

        const errorsAfter = errors.length;
        const newErrors = errorsAfter - errorsBefore;

        if (newErrors === 0) {
          console.log('  ✅ No errors when switching to board view');
        } else {
          console.log(`  ❌ ${newErrors} NEW ERRORS when switching to board view!`);
          for (let i = errorsBefore; i < errorsAfter; i++) {
            console.log(`     Error ${i + 1}: ${errors[i]}`);
          }
        }
      } else {
        console.log('  ❌ Board button not found');
      }
    });

    // Step 3: Check board view rendering
    await test.step('3. Board View Rendering', async () => {
      console.log('\n📊 STEP 3: Board View Rendering Check');

      // Check for task cards
      const cardCount = await page.locator('.task-card').count();
      console.log(`  Task cards found: ${cardCount}`);

      // Check if any Vue errors occurred
      const vueErrors = errors.filter(err =>
        err.includes('Vue warn') ||
        err.includes('TypeError') ||
        err.includes('Cannot read')
      );

      if (vueErrors.length > 0) {
        console.log(`  ❌ Vue errors detected: ${vueErrors.length}`);
        vueErrors.forEach((err, idx) => {
          console.log(`     ${idx + 1}. ${err.substring(0, 100)}...`);
        });
      } else {
        console.log('  ✅ No Vue errors');
      }

      // Check specific error patterns
      const priorityErrors = errors.filter(err =>
        err.includes('getPriorityColor') ||
        err.includes('toLowerCase')
      );

      if (priorityErrors.length > 0) {
        console.log(`  ❌ Priority-related errors: ${priorityErrors.length}`);
      } else {
        console.log('  ✅ No priority-related errors');
      }
    });

    // Step 4: Interact with board view
    await test.step('4. Board View Interactions', async () => {
      console.log('\n🖱️ STEP 4: Testing Interactions');

      // Try hovering over a card
      const firstCard = page.locator('.task-card').first();
      if (await firstCard.isVisible({ timeout: 1000 }).catch(() => false)) {
        const errorsBefore = errors.length;

        await firstCard.hover();
        await page.waitForTimeout(500);

        const errorsAfter = errors.length;
        if (errorsAfter === errorsBefore) {
          console.log('  ✅ No errors on card hover');
        } else {
          console.log(`  ❌ ${errorsAfter - errorsBefore} errors on hover`);
        }
      }
    });

    // Step 5: Switch back to list view
    await test.step('5. Switch Back to List View', async () => {
      console.log('\n🔄 STEP 5: Switching Back to List View');

      const listButton = page.locator('button:has-text("List")').first();
      if (await listButton.isVisible()) {
        const errorsBefore = errors.length;

        await listButton.click();
        await page.waitForTimeout(1000);

        const errorsAfter = errors.length;
        if (errorsAfter === errorsBefore) {
          console.log('  ✅ No errors switching back to list view');
        } else {
          console.log(`  ❌ ${errorsAfter - errorsBefore} errors switching back`);
        }
      }
    });

    // Final Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 FINAL ERROR SUMMARY');
    console.log('=' .repeat(60));

    if (errors.length === 0) {
      console.log('\n✅✅✅ PERFECT! ZERO CONSOLE ERRORS! ✅✅✅');
    } else {
      console.log(`\n❌ TOTAL ERRORS: ${errors.length}`);
      console.log('\nError Details:');
      errors.forEach((err, idx) => {
        console.log(`\n${idx + 1}. ${err}`);
      });
    }

    if (warnings.length > 0) {
      console.log(`\n⚠️ Total Warnings: ${warnings.length}`);
    }

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/board-error-check.png',
      fullPage: true
    });

    console.log('\n' + '=' .repeat(60));

    // STRICT ASSERTION: Board view must have ZERO errors
    expect(errors.length).toBe(0);
  });
});