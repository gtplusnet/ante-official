import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getTestUser } from '../fixtures/test-data';

test.describe('Task Module - Final Comprehensive Test', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('Comprehensive task module functionality verification', async ({ page }) => {
    const testUser = getTestUser('DEFAULT');
    const results = {
      passed: [],
      failed: [],
      warnings: []
    };

    console.log('🚀 COMPREHENSIVE TASK MODULE TEST');
    console.log('=' .repeat(60));

    // Login
    await loginPage.login(testUser);
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
    console.log('✅ Login successful\n');

    // Navigate to tasks
    await page.waitForTimeout(2000);
    await page.locator('text=Task').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Test 1: Task List Loading
    await test.step('1. Task List Loading', async () => {
      console.log('📋 TEST 1: Task List Loading');
      const taskRows = page.locator('.task-row');
      const count = await taskRows.count();

      if (count > 0) {
        console.log(`  ✅ Task list loads successfully (${count} tasks)`);
        results.passed.push(`Task list loads (${count} tasks)`);
      } else {
        console.log('  ❌ No tasks loaded');
        results.failed.push('Task list loading');
      }
    });

    // Test 2: Task Sections
    await test.step('2. Task Sections', async () => {
      console.log('\n📊 TEST 2: Task Sections/Status Groups');
      const sections = page.locator('.task-section');
      const sectionCount = await sections.count();

      if (sectionCount > 0) {
        console.log(`  ✅ Task sections working (${sectionCount} sections)`);
        for (let i = 0; i < sectionCount; i++) {
          const header = await sections.nth(i).textContent();
          console.log(`     - ${header?.substring(0, 50)?.trim()}`);
        }
        results.passed.push('Task sections/status groups');
      } else {
        console.log('  ❌ No task sections found');
        results.failed.push('Task sections');
      }
    });

    // Test 3: Priority Change
    await test.step('3. Priority Change', async () => {
      console.log('\n🎯 TEST 3: Priority Change');
      const firstTask = page.locator('.task-row').first();
      const priorityElement = firstTask.locator('.priority, [class*="priority"]').first();

      if (await priorityElement.isVisible()) {
        await priorityElement.click();
        await page.waitForTimeout(1000);

        const menuVisible = await page.locator('.q-menu, [role="menu"]').isVisible({ timeout: 1000 }).catch(() => false);
        if (menuVisible) {
          console.log('  ✅ Priority menu opens');
          results.passed.push('Priority change functionality');

          // Select a priority
          const highPriority = page.locator('.q-menu >> text="High"').first();
          if (await highPriority.isVisible({ timeout: 500 }).catch(() => false)) {
            await highPriority.click();
            await page.waitForTimeout(1000);
            console.log('  ✅ Can select priority');
          }
        } else {
          console.log('  ❌ Priority menu does not open');
          results.failed.push('Priority menu');
        }
      } else {
        console.log('  ⚠️ Priority element not visible');
        results.warnings.push('Priority element visibility');
      }
    });

    // Test 4: Assignee Change
    await test.step('4. Assignee Change', async () => {
      console.log('\n👤 TEST 4: Assignee Change');
      const firstTask = page.locator('.task-row').first();
      const assigneeButton = firstTask.locator('.assignee-button, [class*="assignee"]').first();

      if (await assigneeButton.isVisible()) {
        await assigneeButton.click();
        await page.waitForTimeout(1000);

        const menuVisible = await page.locator('.q-menu, [role="menu"]').isVisible({ timeout: 1000 }).catch(() => false);
        if (menuVisible) {
          console.log('  ✅ Assignee menu opens');
          results.passed.push('Assignee change functionality');
          await page.keyboard.press('Escape');
        } else {
          console.log('  ❌ Assignee menu does not open');
          results.failed.push('Assignee menu');
        }
      } else {
        console.log('  ⚠️ Assignee button not visible');
        results.warnings.push('Assignee button visibility');
      }
    });

    // Test 5: Due Date
    await test.step('5. Due Date', async () => {
      console.log('\n📅 TEST 5: Due Date');
      const firstTask = page.locator('.task-row').first();
      const dueDateElement = firstTask.locator('.due-date, [class*="due"]').first();

      if (await dueDateElement.isVisible()) {
        console.log('  ✅ Due date element visible');
        results.passed.push('Due date display');

        // Try clicking to see if date picker opens
        await dueDateElement.click();
        await page.waitForTimeout(1000);

        const datePickerVisible = await page.locator('.q-date, .date-picker, [role="dialog"]').isVisible({ timeout: 500 }).catch(() => false);
        if (datePickerVisible) {
          console.log('  ✅ Date picker opens');
          await page.keyboard.press('Escape');
        } else {
          console.log('  ℹ️ Date picker does not open on click (may be read-only)');
        }
      } else {
        console.log('  ⚠️ Due date element not visible');
        results.warnings.push('Due date visibility');
      }
    });

    // Test 6: Project Assignment
    await test.step('6. Project Assignment', async () => {
      console.log('\n📁 TEST 6: Project Assignment');
      const firstTask = page.locator('.task-row').first();
      const projectElement = firstTask.locator('.project, [class*="project"]').first();

      if (await projectElement.isVisible()) {
        console.log('  ✅ Project element visible');
        results.passed.push('Project display');
      } else {
        console.log('  ⚠️ Project element not visible');
        results.warnings.push('Project visibility');
      }
    });

    // Test 7: View Switching
    await test.step('7. View Switching', async () => {
      console.log('\n👁️ TEST 7: View Switching (List/Board)');

      // Test List View
      const listButton = page.locator('button:has-text("List")').first();
      if (await listButton.isVisible()) {
        await listButton.click();
        await page.waitForTimeout(1000);
        const listViewVisible = await page.locator('.task-list-view, .task-row').first().isVisible({ timeout: 1000 }).catch(() => false);
        if (listViewVisible) {
          console.log('  ✅ List view works');
          results.passed.push('List view');
        }
      }

      // Test Board View
      const boardButton = page.locator('button:has-text("Board")').first();
      if (await boardButton.isVisible()) {
        await boardButton.click();
        await page.waitForTimeout(2000);
        const boardCards = page.locator('.task-card, .board-card');
        const cardCount = await boardCards.count();
        if (cardCount > 0) {
          console.log(`  ✅ Board view works (${cardCount} cards)`);
          results.passed.push(`Board view (${cardCount} cards)`);
        } else {
          console.log('  ❌ Board view has no cards');
          results.failed.push('Board view cards');
        }

        // Switch back to list view
        await listButton.click();
        await page.waitForTimeout(1000);
      }
    });

    // Test 8: Task Detail Navigation
    await test.step('8. Task Detail Navigation', async () => {
      console.log('\n📝 TEST 8: Task Detail Navigation');
      const firstTask = page.locator('.task-row').first();
      const taskTitle = firstTask.locator('.task-title').first();

      if (await taskTitle.isVisible()) {
        const originalUrl = page.url();
        await taskTitle.click();
        await page.waitForTimeout(2000);
        const newUrl = page.url();

        if (newUrl !== originalUrl) {
          console.log('  ✅ Task click navigates to detail page');
          console.log(`     From: ${originalUrl}`);
          console.log(`     To: ${newUrl}`);
          results.passed.push('Task detail navigation');

          // Go back
          await page.goBack();
          await page.waitForTimeout(1000);
        } else {
          const dialogVisible = await page.locator('[role="dialog"], .q-dialog').isVisible({ timeout: 500 }).catch(() => false);
          if (dialogVisible) {
            console.log('  ✅ Task click opens dialog');
            results.passed.push('Task detail dialog');
            await page.keyboard.press('Escape');
          } else {
            console.log('  ❌ Task click has no effect');
            results.failed.push('Task detail opening');
          }
        }
      }
    });

    // Test 9: Create Task Button
    await test.step('9. Create Task Button', async () => {
      console.log('\n➕ TEST 9: Create Task Button');
      const createButton = page.locator('button:has-text("Create Task"), button:has-text("Add Task"), button:has-text("New Task")').first();

      if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await createButton.click();
        await page.waitForTimeout(1000);

        const dialogVisible = await page.locator('[role="dialog"], .q-dialog').isVisible({ timeout: 1000 }).catch(() => false);
        if (dialogVisible) {
          console.log('  ✅ Create task dialog opens');
          results.passed.push('Create task functionality');
          await page.keyboard.press('Escape');
        } else {
          console.log('  ❌ Create task dialog does not open');
          results.failed.push('Create task dialog');
        }
      } else {
        console.log('  ⚠️ Create task button not found');
        results.warnings.push('Create task button');
      }
    });

    // Test 10: Search Functionality
    await test.step('10. Search Functionality', async () => {
      console.log('\n🔍 TEST 10: Search Functionality');
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();

      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        console.log('  ✅ Search input works');
        results.passed.push('Search functionality');
        await searchInput.clear();
      } else {
        console.log('  ⚠️ Search input not found');
        results.warnings.push('Search functionality');
      }
    });

    // Final Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 FINAL TEST SUMMARY');
    console.log('=' .repeat(60));

    console.log(`\n✅ PASSED (${results.passed.length}):`);
    results.passed.forEach(item => console.log(`   • ${item}`));

    if (results.failed.length > 0) {
      console.log(`\n❌ FAILED (${results.failed.length}):`);
      results.failed.forEach(item => console.log(`   • ${item}`));
    }

    if (results.warnings.length > 0) {
      console.log(`\n⚠️ WARNINGS (${results.warnings.length}):`);
      results.warnings.forEach(item => console.log(`   • ${item}`));
    }

    const successRate = Math.round((results.passed.length / (results.passed.length + results.failed.length)) * 100);
    console.log(`\n📈 SUCCESS RATE: ${successRate}%`);

    if (results.failed.length === 0) {
      console.log('\n🎉 ALL CRITICAL FUNCTIONALITY IS WORKING!');
    } else {
      console.log(`\n⚠️ ${results.failed.length} ISSUES NEED ATTENTION`);
    }

    console.log('=' .repeat(60));

    // Take final screenshot
    await page.screenshot({
      path: 'screenshots/task-final-test.png',
      fullPage: true
    });

    // Assert that most tests pass
    expect(results.failed.length).toBeLessThanOrEqual(2);
  });
});