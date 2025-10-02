import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getTestUser } from '../fixtures/test-data';

test.describe('Task Module Detailed Check', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);

    // Capture API responses
    page.on('response', response => {
      if (response.url().includes('/rest/v1/Task')) {
        console.log(`📡 Task API: ${response.status()} - ${response.url().substring(0, 100)}...`);
      }
    });
  });

  test('Detailed task module inspection', async ({ page }) => {
    const testUser = getTestUser('DEFAULT');

    console.log('🔍 Detailed Task Module Inspection');

    // Login
    await loginPage.login(testUser);
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
    console.log('✅ Logged in');

    // Navigate to tasks
    await page.waitForTimeout(2000);
    await page.locator('text=Task').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Step 1: Find all available tabs
    await test.step('Inspect available tabs', async () => {
      console.log('\n📑 Available Task Tabs:');

      // Look for tab elements
      const tabSelectors = [
        '.q-tab',
        '.task-tab',
        '.tab-item',
        '[role="tab"]',
        '.q-tabs__content .q-tab__label'
      ];

      for (const selector of tabSelectors) {
        const tabs = page.locator(selector);
        const count = await tabs.count();
        if (count > 0) {
          console.log(`  Found ${count} elements with selector: ${selector}`);
          for (let i = 0; i < count; i++) {
            const text = await tabs.nth(i).textContent();
            const isVisible = await tabs.nth(i).isVisible();
            console.log(`    - "${text?.trim()}" (visible: ${isVisible})`);
          }
          break;
        }
      }

      // Also check for filter buttons
      const filterButtons = page.locator('.filter-button, .status-filter, button[class*="filter"]');
      const filterCount = await filterButtons.count();
      if (filterCount > 0) {
        console.log(`\n  Found ${filterCount} filter buttons:`);
        for (let i = 0; i < filterCount; i++) {
          const text = await filterButtons.nth(i).textContent();
          console.log(`    - "${text?.trim()}"`);
        }
      }
    });

    // Step 2: Check view switcher
    await test.step('Inspect view switcher', async () => {
      console.log('\n👁️ View Switcher Elements:');

      const viewSelectors = [
        '.view-switcher',
        '.view-toggle',
        '[aria-label*="view"]',
        '.q-btn-group',
        '.toggle-group'
      ];

      for (const selector of viewSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(`  Found ${count} elements with selector: ${selector}`);
          for (let i = 0; i < count; i++) {
            const text = await elements.nth(i).textContent();
            const ariaLabel = await elements.nth(i).getAttribute('aria-label');
            if (text || ariaLabel) {
              console.log(`    - Text: "${text?.trim()}", Aria: "${ariaLabel}"`);
            }
          }
        }
      }

      // Check for specific view buttons
      const listButton = page.locator('button:has-text("List"), [aria-label*="list"]').first();
      const boardButton = page.locator('button:has-text("Board"), [aria-label*="board"], button:has-text("Kanban")').first();

      console.log(`  List button visible: ${await listButton.isVisible({ timeout: 1000 }).catch(() => false)}`);
      console.log(`  Board button visible: ${await boardButton.isVisible({ timeout: 1000 }).catch(() => false)}`);
    });

    // Step 3: Test task row interactions
    await test.step('Test task row interactions', async () => {
      console.log('\n🖱️ Task Row Interaction Test:');

      const taskRows = page.locator('.task-row');
      const count = await taskRows.count();
      console.log(`  Found ${count} task rows`);

      if (count > 0) {
        const firstTask = taskRows.first();

        // Check task row structure
        const taskTitle = firstTask.locator('.task-title, .task-name, [class*="title"]').first();
        const assigneeSection = firstTask.locator('.assignee-button, .assignee-section, [class*="assignee"]').first();
        const prioritySection = firstTask.locator('.priority, .task-priority, [class*="priority"]').first();
        const dueDateSection = firstTask.locator('.due-date, [class*="due"]').first();
        const projectSection = firstTask.locator('.project, .task-project, [class*="project"]').first();

        console.log('  Task row elements:');
        console.log(`    - Title: ${await taskTitle.isVisible()}`);
        console.log(`    - Assignee: ${await assigneeSection.isVisible()}`);
        console.log(`    - Priority: ${await prioritySection.isVisible()}`);
        console.log(`    - Due Date: ${await dueDateSection.isVisible()}`);
        console.log(`    - Project: ${await projectSection.isVisible()}`);

        // Try to click on the task title
        if (await taskTitle.isVisible()) {
          console.log('\n  Testing task title click:');
          await taskTitle.click();
          await page.waitForTimeout(2000);

          // Check what opened
          const dialogVisible = await page.locator('[role="dialog"], .q-dialog').isVisible({ timeout: 1000 }).catch(() => false);
          const sidebarVisible = await page.locator('.task-sidebar, .detail-sidebar').isVisible({ timeout: 1000 }).catch(() => false);
          const modalVisible = await page.locator('.modal, .q-modal').isVisible({ timeout: 1000 }).catch(() => false);

          console.log(`    - Dialog opened: ${dialogVisible}`);
          console.log(`    - Sidebar opened: ${sidebarVisible}`);
          console.log(`    - Modal opened: ${modalVisible}`);

          if (dialogVisible || sidebarVisible || modalVisible) {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          }
        }

        // Test priority click
        if (await prioritySection.isVisible()) {
          console.log('\n  Testing priority click:');

          // Get current priority
          const currentPriority = await prioritySection.textContent();
          console.log(`    Current priority: "${currentPriority?.trim()}"`);

          await prioritySection.click();
          await page.waitForTimeout(1000);

          // Check if menu opened
          const menuVisible = await page.locator('.q-menu, [role="menu"]').isVisible({ timeout: 1000 }).catch(() => false);
          console.log(`    Menu opened: ${menuVisible}`);

          if (menuVisible) {
            // Try to select a different priority
            const priorities = ['High', 'Medium', 'Low', 'Critical'];
            for (const priority of priorities) {
              const option = page.locator(`.q-menu >> text="${priority}"`).first();
              if (await option.isVisible({ timeout: 500 }).catch(() => false)) {
                console.log(`    Found priority option: ${priority}`);
                await option.click();
                await page.waitForTimeout(1000);

                // Check if priority changed
                const newPriority = await prioritySection.textContent();
                console.log(`    Priority after click: "${newPriority?.trim()}"`);
                break;
              }
            }
          } else {
            await page.keyboard.press('Escape');
          }
        }
      }
    });

    // Step 4: Check for specific task status tabs
    await test.step('Check task status tabs', async () => {
      console.log('\n📊 Task Status Sections:');

      // Look for sections that group tasks by status
      const sections = page.locator('.task-section, .status-section, .task-group');
      const sectionCount = await sections.count();

      if (sectionCount > 0) {
        console.log(`  Found ${sectionCount} task sections:`);
        for (let i = 0; i < sectionCount; i++) {
          const sectionTitle = await sections.nth(i).locator('.section-title, .section-header, h3, h4').first().textContent();
          const taskCount = await sections.nth(i).locator('.task-row').count();
          console.log(`    - "${sectionTitle?.trim()}" (${taskCount} tasks)`);
        }
      }
    });

    // Step 5: Test board view if button exists
    await test.step('Try board view', async () => {
      console.log('\n🎯 Testing Board View:');

      // Look for board/kanban button
      const boardButtons = [
        'button:has-text("Board")',
        'button:has-text("Kanban")',
        '[aria-label*="board"]',
        '.view-board'
      ];

      let boardFound = false;
      for (const selector of boardButtons) {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`  Found board button: ${selector}`);
          await button.click();
          boardFound = true;
          await page.waitForTimeout(2000);

          // Check if board view loaded
          const boardColumns = page.locator('.board-column, .kanban-column, .lane');
          const columnCount = await boardColumns.count();

          if (columnCount > 0) {
            console.log(`  ✅ Board view loaded with ${columnCount} columns:`);
            for (let i = 0; i < columnCount; i++) {
              const columnTitle = await boardColumns.nth(i).locator('.column-title, .lane-title, h3').first().textContent();
              const cardCount = await boardColumns.nth(i).locator('.task-card, .board-card').count();
              console.log(`    - "${columnTitle?.trim()}" (${cardCount} cards)`);
            }
          } else {
            console.log('  ❌ Board view did not load properly');
          }

          // Switch back to list view
          const listButton = page.locator('button:has-text("List"), [aria-label*="list"]').first();
          if (await listButton.isVisible()) {
            await listButton.click();
            await page.waitForTimeout(1000);
          }
          break;
        }
      }

      if (!boardFound) {
        console.log('  ⚠️ Board view button not found');
      }
    });

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/task-detailed-inspection.png',
      fullPage: true
    });

    console.log('\n✅ Detailed inspection completed');
  });
});