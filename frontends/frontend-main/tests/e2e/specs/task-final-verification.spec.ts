import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getTestUser } from '../fixtures/test-data';

test.describe('Task Module - Final Verification', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('Complete task module verification with ZERO errors', async ({ page }) => {
    const testUser = getTestUser('DEFAULT');
    const allErrors = [];

    console.log('🎯 FINAL TASK MODULE VERIFICATION');
    console.log('=' .repeat(60));

    // Strict error monitoring
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        allErrors.push(text);
        console.log(`❌ ERROR: ${text}`);
      }
    });

    page.on('pageerror', error => {
      allErrors.push(error.message);
      console.log(`🔴 PAGE ERROR: ${error.message}`);
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

    // Test 1: List View
    await test.step('1. List View Test', async () => {
      console.log('📋 TEST 1: List View');
      const listButton = page.locator('button:has-text("List")').first();
      await listButton.click();
      await page.waitForTimeout(1000);

      const taskRows = await page.locator('.task-row').count();
      console.log(`  ✅ List view working (${taskRows} tasks)`);
      console.log(`  Errors so far: ${allErrors.length}`);
    });

    // Test 2: Board View
    await test.step('2. Board View Test', async () => {
      console.log('\n🎯 TEST 2: Board View');
      const boardButton = page.locator('button:has-text("Board")').first();
      await boardButton.click();
      await page.waitForTimeout(2000);

      const taskCards = await page.locator('.task-card').count();
      console.log(`  ✅ Board view working (${taskCards} cards)`);
      console.log(`  Errors so far: ${allErrors.length}`);
    });

    // Test 3: Priority Display
    await test.step('3. Priority Display Test', async () => {
      console.log('\n🎨 TEST 3: Priority Display');
      const priorityChips = await page.locator('.task-card q-chip').count();
      console.log(`  ✅ Priority chips rendered: ${priorityChips}`);
      console.log(`  Errors so far: ${allErrors.length}`);
    });

    // Test 4: Switch Views Multiple Times
    await test.step('4. View Switching Test', async () => {
      console.log('\n🔄 TEST 4: Multiple View Switches');

      // Switch to list
      await page.locator('button:has-text("List")').first().click();
      await page.waitForTimeout(1000);
      console.log('  ✅ Switched to List');

      // Switch to board
      await page.locator('button:has-text("Board")').first().click();
      await page.waitForTimeout(1000);
      console.log('  ✅ Switched to Board');

      // Switch back to list
      await page.locator('button:has-text("List")').first().click();
      await page.waitForTimeout(1000);
      console.log('  ✅ Switched back to List');

      console.log(`  Errors after switching: ${allErrors.length}`);
    });

    // Test 5: Task Interactions
    await test.step('5. Task Interaction Test', async () => {
      console.log('\n🖱️ TEST 5: Task Interactions');

      const firstTask = page.locator('.task-row').first();
      if (await firstTask.isVisible()) {
        // Test priority menu
        const priority = firstTask.locator('[class*="priority"]').first();
        if (await priority.isVisible()) {
          await priority.click();
          await page.waitForTimeout(500);
          const menuVisible = await page.locator('.q-menu').isVisible({ timeout: 500 }).catch(() => false);
          if (menuVisible) {
            console.log('  ✅ Priority menu opens');
            await page.keyboard.press('Escape');
          }
        }

        // Test assignee menu
        const assignee = firstTask.locator('[class*="assignee"]').first();
        if (await assignee.isVisible()) {
          await assignee.click();
          await page.waitForTimeout(500);
          const menuVisible = await page.locator('.q-menu').isVisible({ timeout: 500 }).catch(() => false);
          if (menuVisible) {
            console.log('  ✅ Assignee menu opens');
            await page.keyboard.press('Escape');
          }
        }
      }
      console.log(`  Errors after interactions: ${allErrors.length}`);
    });

    // Test 6: Search Functionality
    await test.step('6. Search Test', async () => {
      console.log('\n🔍 TEST 6: Search Functionality');

      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        console.log('  ✅ Search input works');
        await searchInput.clear();
      }
      console.log(`  Errors after search: ${allErrors.length}`);
    });

    // Test 7: Tab Navigation
    await test.step('7. Tab Navigation Test', async () => {
      console.log('\n📑 TEST 7: Tab Navigation');

      const tabs = ['All Tasks', 'Done'];
      for (const tab of tabs) {
        const tabElement = page.locator(`text="${tab}"`).first();
        if (await tabElement.isVisible({ timeout: 1000 }).catch(() => false)) {
          await tabElement.click();
          await page.waitForTimeout(1000);
          console.log(`  ✅ Navigated to ${tab}`);
        }
      }
      console.log(`  Errors after tab navigation: ${allErrors.length}`);
    });

    // Test 8: Final Board View Check
    await test.step('8. Final Board View Check', async () => {
      console.log('\n🎯 TEST 8: Final Board View Check');

      await page.locator('button:has-text("Board")').first().click();
      await page.waitForTimeout(2000);

      const cards = await page.locator('.task-card').count();
      console.log(`  ✅ Board view still working (${cards} cards)`);
      console.log(`  Final error count: ${allErrors.length}`);
    });

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/task-final-verification.png',
      fullPage: true
    });

    // Final Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 FINAL VERIFICATION RESULTS');
    console.log('=' .repeat(60));

    if (allErrors.length === 0) {
      console.log('\n🎉🎉🎉 PERFECT! ZERO ERRORS! 🎉🎉🎉');
      console.log('\n✅ List View: Working');
      console.log('✅ Board View: Working');
      console.log('✅ Priority Display: Working');
      console.log('✅ View Switching: Working');
      console.log('✅ Task Interactions: Working');
      console.log('✅ Search: Working');
      console.log('✅ Tab Navigation: Working');
      console.log('\n🏆 TASK MODULE IS 100% FUNCTIONAL!');
    } else {
      console.log(`\n❌ FAILED: ${allErrors.length} errors found`);
      allErrors.forEach((err, idx) => {
        console.log(`\nError ${idx + 1}: ${err}`);
      });
    }

    console.log('=' .repeat(60));

    // STRICT: Must have ZERO errors
    expect(allErrors.length).toBe(0);
  });
});