import { test, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:9000';

// Helper to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/#/login`);

  // Click "Sign in manually" button to show the manual login form
  await page.click('button:has-text("Sign in manually")');

  // Wait for login form
  await page.waitForSelector('input[placeholder*="username"], input[placeholder*="Username"]', { timeout: 10000 });

  // Fill credentials
  await page.fill('input[placeholder*="username"], input[placeholder*="Username"]', 'guillermotabligan');
  await page.fill('input[placeholder*="password"], input[placeholder*="Password"]', 'water123');

  // Submit
  await page.click('button:has-text("Sign In"), button[type="submit"]');

  // Wait for navigation
  await page.waitForURL(url => url.hash.includes('dashboard') || url.hash.includes('member'), { timeout: 15000 });
}

test.describe('Task Drag and Drop with Handle', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);

    // Navigate to tasks
    await page.goto(`${BASE_URL}/#/member/task/my-task`);

    // Wait for task list
    await page.waitForSelector('.task-item, tr:has(.task-name)', { timeout: 10000 });
  });

  test('should drag task using drag handle', async ({ page }) => {
    console.log('🔍 Looking for drag handles...');

    // Find drag handles
    const dragHandles = await page.locator('.drag-handle').count();
    console.log(`📊 Found ${dragHandles} drag handles`);

    if (dragHandles === 0) {
      // Try to find drag indicator icons
      const dragIcons = await page.locator('q-icon[name="drag_indicator"], .q-icon:has-text("drag_indicator")').count();
      console.log(`🎯 Found ${dragIcons} drag indicator icons`);
    }

    // Get all task items
    const tasks = await page.locator('.task-item, tr:has(.task-name)').all();
    console.log(`📋 Found ${tasks.length} tasks`);

    if (tasks.length >= 2) {
      const firstTask = tasks[0];
      const secondTask = tasks[1];

      // Try to find the drag handle within the first task
      const firstTaskHandle = await firstTask.locator('.drag-handle, [class*="drag"], q-icon[name="drag_indicator"]').first();

      // Check if handle exists
      const handleExists = await firstTaskHandle.count() > 0;

      if (handleExists) {
        console.log('✅ Found drag handle in first task');

        // Get task text
        const firstTaskText = await firstTask.textContent();
        console.log(`🎯 Attempting to drag task: ${firstTaskText?.substring(0, 50)}...`);

        // Use the drag handle to drag the task
        await firstTaskHandle.hover();
        await page.mouse.down();

        // Move to second task position
        await secondTask.hover();
        await page.mouse.up();

        await page.waitForTimeout(2000);

        console.log('✅ Drag operation using handle completed');

        // Take screenshot to verify
        await page.screenshot({ path: 'drag-with-handle.png', fullPage: true });
      } else {
        console.log('⚠️  No drag handle found in task');

        // Check task structure
        const taskHTML = await firstTask.innerHTML();
        console.log('Task HTML structure (first 500 chars):', taskHTML.substring(0, 500));
      }
    } else {
      console.log('⚠️  Not enough tasks to test drag and drop');
    }
  });

  test('should verify drag handle visibility and functionality', async ({ page }) => {
    // Take initial screenshot
    await page.screenshot({ path: 'task-list-initial.png', fullPage: true });

    // Look for any draggable elements
    const draggableElements = await page.locator('[draggable="true"]').count();
    console.log(`📊 Elements with draggable="true": ${draggableElements}`);

    // Check the first task's draggable state
    const firstTask = await page.locator('.task-item, tr:has(.task-name)').first();
    if (await firstTask.count() > 0) {
      const isDraggable = await firstTask.getAttribute('draggable');
      console.log(`🎯 First task draggable attribute: ${isDraggable}`);

      // Find drag handle within first task
      const dragHandle = await firstTask.locator('.drag-handle').first();
      if (await dragHandle.count() > 0) {
        console.log('✅ Drag handle found in first task');

        // Trigger mousedown on drag handle to enable dragging
        await dragHandle.dispatchEvent('mousedown');

        // Check if draggable state changed
        const isDraggableAfter = await firstTask.getAttribute('draggable');
        console.log(`🔄 After mousedown on handle, draggable: ${isDraggableAfter}`);

        // Try drag operation
        const secondTask = await page.locator('.task-item, tr:has(.task-name)').nth(1);
        if (await secondTask.count() > 0) {
          await firstTask.dragTo(secondTask);
          await page.waitForTimeout(2000);
          console.log('✅ Drag operation attempted after enabling via handle');
        }

        // Trigger mouseup to disable dragging
        await dragHandle.dispatchEvent('mouseup');
      } else {
        console.log('⚠️  No drag handle found in first task');
      }
    }

    // Final screenshot
    await page.screenshot({ path: 'task-list-after-drag-attempt.png', fullPage: true });
  });
});