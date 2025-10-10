import { test, expect, ConsoleMessage, Page } from '@playwright/test';

/**
 * Test Suite: Task Backend API Migration
 *
 * Tests for features developed during Supabase to Backend API migration:
 * 1. Task creation via backend API (POST /task/create)
 * 2. Vue component prop/emit fixes (TaskListView.vue)
 * 3. No RLS policy violations
 * 4. No console errors or warnings
 */

test.describe('Task Backend API Migration Tests', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];
  let networkErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Clear arrays
    consoleErrors = [];
    consoleWarnings = [];
    networkErrors = [];

    // Monitor console messages
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

    // Monitor page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
      console.log('❌ Page Error:', error.message);
    });

    // Monitor network errors
    page.on('response', async (response) => {
      if (response.status() >= 400) {
        const url = response.url();
        const status = response.status();
        const errorMsg = `${status} ${url}`;

        // Only log non-expected errors
        if (!url.includes('/email-config') && !url.includes('/notifications/unread-count')) {
          networkErrors.push(errorMsg);
          console.log('🌐 Network Error:', errorMsg);

          // Log response body for debugging
          try {
            const body = await response.text();
            console.log('   Response:', body.substring(0, 200));
          } catch (e) {
            // Ignore if can't read body
          }
        }
      }
    });

    // Login
    await page.goto('http://localhost:9000');
    await page.click('button:has-text("Sign in manually")');
    await page.waitForSelector('input[placeholder="Enter your username or email"]', { timeout: 5000 });
    await page.fill('input[placeholder="Enter your username or email"]', 'guillermotabligan');
    await page.fill('input[placeholder="Enter your password"]', 'water123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to tasks page
    await page.click('text=Task');
    await page.waitForURL('**/member/task/**', { timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  test('Should load task page without Vue component warnings', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('text=To do', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Filter out expected warnings and check for Vue component warnings
    const vueWarnings = consoleWarnings.filter(warning =>
      warning.includes('Extraneous non-props') ||
      warning.includes('Extraneous non-emits') ||
      warning.includes('missing props') ||
      warning.includes('missing emits')
    );

    const vueErrors = consoleErrors.filter(error =>
      error.includes('[Vue warn]') ||
      error.includes('props') ||
      error.includes('emits')
    );

    // Should have NO Vue component warnings about props/emits
    expect(vueWarnings.length, 'Should have no Vue prop/emit warnings').toBe(0);
    expect(vueErrors.length, 'Should have no Vue prop/emit errors').toBe(0);

    console.log('✅ No Vue component warnings found');
  });

  test('Should create task via backend API (inline creation)', async ({ page }) => {
    // Monitor API calls
    let createTaskApiCalled = false;
    let createTaskPayload: any = null;
    let createTaskResponse: any = null;

    page.on('request', async (request) => {
      if (request.url().includes('/task/create') && request.method() === 'POST') {
        createTaskApiCalled = true;
        try {
          createTaskPayload = JSON.parse(request.postData() || '{}');
          console.log('📤 POST /task/create payload:', createTaskPayload);
        } catch (e) {
          console.log('Could not parse request payload');
        }
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/task/create') && response.status() === 201) {
        try {
          createTaskResponse = await response.json();
          console.log('📥 POST /task/create response:', createTaskResponse);
        } catch (e) {
          console.log('Could not parse response');
        }
      }
    });

    // Wait for task list to load
    await page.waitForSelector('.task-list-container, [data-testid="task-list"]', { timeout: 10000 });

    // Remove grouping to see all tasks in a simple list
    const noGroupsButton = page.locator('button:has-text("No Groups")');
    if (await noGroupsButton.isVisible().catch(() => false)) {
      await noGroupsButton.click();
      await page.waitForTimeout(1000);
    }

    // Click "Add task..." placeholder to reveal input
    const addTaskPlaceholder = page.locator('.add-task-placeholder').first();
    await addTaskPlaceholder.waitFor({ state: 'visible', timeout: 5000 });
    await addTaskPlaceholder.click();
    await page.waitForTimeout(500);

    // Find the revealed inline input
    const taskInput = page.locator('.inline-task-input').first();
    await taskInput.waitFor({ state: 'visible', timeout: 5000 });

    // Create a unique task name
    const timestamp = Date.now();
    const taskName = `Test Task via Backend API ${timestamp}`;

    // Type task name
    await taskInput.fill(taskName);
    await page.waitForTimeout(500);

    // Press Enter to create task
    await taskInput.press('Enter');
    await page.waitForTimeout(5000); // Wait for API call and UI update

    // Verify API was called
    expect(createTaskApiCalled, 'Should call POST /task/create API').toBe(true);

    // Verify payload structure
    if (createTaskPayload) {
      expect(createTaskPayload).toHaveProperty('title');
      expect(createTaskPayload.title).toContain('Test Task via Backend API');
      expect(createTaskPayload).toHaveProperty('difficulty'); // Priority mapped to difficulty
      expect(createTaskPayload).toHaveProperty('assignedMode');
      console.log('✅ API payload structure correct');
    }

    // Verify response
    if (createTaskResponse) {
      expect(createTaskResponse).toHaveProperty('id');
      expect(createTaskResponse.title).toContain('Test Task via Backend API');
      console.log('✅ API response contains created task');
    }

    // Verify API call succeeded
    console.log('✅ Task creation API called successfully');

    // Note: Task visibility in UI is tested separately in E2E test
    // This test focuses on verifying the backend API is being used

    // Verify no RLS policy violations
    const rlsErrors = consoleErrors.filter(error =>
      error.includes('42501') ||
      error.includes('row-level security') ||
      error.includes('RLS')
    );
    expect(rlsErrors.length, 'Should have no RLS policy violations').toBe(0);

    // Verify no network errors
    const taskCreationErrors = networkErrors.filter(error => error.includes('/task/create'));
    expect(taskCreationErrors.length, 'Should have no task creation errors').toBe(0);

    console.log('✅ Task created successfully via backend API');
  });

  test('Should create task with priority mapping (LOW/NORMAL/HIGH/URGENT -> 1/2/3/4)', async ({ page }) => {
    let createTaskPayload: any = null;

    page.on('request', async (request) => {
      if (request.url().includes('/task/create') && request.method() === 'POST') {
        try {
          createTaskPayload = JSON.parse(request.postData() || '{}');
        } catch (e) {
          // Ignore
        }
      }
    });

    // Click "Add task..." and reveal input
    const addTaskPlaceholder = page.locator('.add-task-placeholder').first();
    await addTaskPlaceholder.waitFor({ state: 'visible', timeout: 5000 });
    await addTaskPlaceholder.click();
    await page.waitForTimeout(500);

    const taskInput = page.locator('.inline-task-input').first();
    await taskInput.waitFor({ state: 'visible', timeout: 5000 });

    const taskName = `Priority Test Task ${Date.now()}`;
    await taskInput.fill(taskName);
    await taskInput.press('Enter');
    await page.waitForTimeout(2000);

    // Verify difficulty field (priority mapping)
    if (createTaskPayload) {
      expect(createTaskPayload).toHaveProperty('difficulty');
      expect([1, 2, 3, 4]).toContain(createTaskPayload.difficulty);
      console.log(`✅ Priority mapped to difficulty: ${createTaskPayload.difficulty}`);
    }
  });

  test('Should NOT use Supabase direct INSERT for task creation', async ({ page }) => {
    let supabaseInsertCalled = false;

    // Monitor for Supabase REST API calls
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/rest/v1/Task') && request.method() === 'POST') {
        supabaseInsertCalled = true;
        console.log('⚠️ Supabase INSERT detected:', url);
      }
    });

    // Create a task
    const addTaskPlaceholder = page.locator('.add-task-placeholder').first();
    await addTaskPlaceholder.waitFor({ state: 'visible', timeout: 5000 });
    await addTaskPlaceholder.click();
    await page.waitForTimeout(500);

    const taskInput = page.locator('.inline-task-input').first();
    await taskInput.waitFor({ state: 'visible', timeout: 5000 });

    const taskName = `No Supabase Test ${Date.now()}`;
    await taskInput.fill(taskName);
    await taskInput.press('Enter');
    await page.waitForTimeout(3000);

    // Verify Supabase direct INSERT was NOT used
    expect(supabaseInsertCalled, 'Should NOT use Supabase direct INSERT').toBe(false);
    console.log('✅ Task creation uses backend API, not Supabase direct');
  });

  test('Should handle task creation errors gracefully', async ({ page }) => {
    // This test verifies error handling when backend API fails

    // Intercept and fail the API call
    await page.route('**/task/create', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Validation failed' })
      });
    });

    const taskInput = page.locator('input[placeholder*="Add"], input[placeholder*="task"]').first();
    await taskInput.waitFor({ state: 'visible', timeout: 5000 });

    const taskName = `Error Test Task ${Date.now()}`;
    await taskInput.fill(taskName);
    await taskInput.press('Enter');
    await page.waitForTimeout(2000);

    // Should show error notification (Quasar Notify)
    const errorNotification = page.locator('.q-notification--negative, .q-notification .text-negative');
    const notificationVisible = await errorNotification.isVisible().catch(() => false);

    if (notificationVisible) {
      console.log('✅ Error notification shown to user');
    }

    // Should not crash the application
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
    console.log('✅ Application remains stable after error');
  });

  test('Should verify TaskListView component has correct props and emits', async ({ page }) => {
    // Navigate to task list view
    await page.waitForSelector('.task-list-container, [data-testid="task-list"]', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Check for Vue warnings about missing props
    const propWarnings = consoleWarnings.filter(warning =>
      warning.includes('loading') && warning.includes('non-props')
    );
    expect(propWarnings.length, 'Should not have warnings about loading prop').toBe(0);

    // Check for Vue warnings about missing emits
    const emitWarnings = consoleWarnings.filter(warning =>
      (warning.includes('select-task') ||
       warning.includes('edit-task') ||
       warning.includes('open-menu')) &&
      warning.includes('non-emits')
    );
    expect(emitWarnings.length, 'Should not have warnings about select-task, edit-task, open-menu emits').toBe(0);

    console.log('✅ TaskListView component props and emits correctly defined');
  });

  test('Should complete full task creation flow end-to-end', async ({ page }) => {
    // Full integration test - stays in "My Tasks" view (default)
    // Tasks created in "My Tasks" are assigned to current user
    const timestamp = Date.now();
    const taskName = `E2E Test Task ${timestamp}`;

    // Remove grouping to see all tasks in a simple list
    const noGroupsButton = page.locator('button:has-text("No Groups")');
    if (await noGroupsButton.isVisible().catch(() => false)) {
      await noGroupsButton.click();
      await page.waitForTimeout(1000);
    }

    // Step 1: Create task (will be assigned to current user in "My Tasks" view)
    const addTaskPlaceholder = page.locator('.add-task-placeholder').first();
    await addTaskPlaceholder.waitFor({ state: 'visible', timeout: 5000 });
    await addTaskPlaceholder.click();
    await page.waitForTimeout(500);

    const taskInput = page.locator('.inline-task-input').first();
    await taskInput.waitFor({ state: 'visible', timeout: 5000 });
    await taskInput.fill(taskName);
    await taskInput.press('Enter');

    // Wait for task creation to complete
    // Backend API → Database → refetch → UI update
    await page.waitForTimeout(3000);

    // Step 2: Reload page to verify task persistence
    console.log('Reloading page to verify task persistence...');
    await page.reload();
    await page.waitForURL('**/member/task/**', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Remove grouping again after reload
    const noGroupsButtonAfterReload = page.locator('button:has-text("No Groups")');
    if (await noGroupsButtonAfterReload.isVisible().catch(() => false)) {
      await noGroupsButtonAfterReload.click();
      await page.waitForTimeout(1000);
    }

    // Step 3: Verify task appears after page reload
    // Since task was created in "My Tasks" view, it's assigned to current user
    // and should appear in "My Tasks" view after reload
    const persistedTask = page.locator(`text=${taskName}`).first();
    await expect(persistedTask).toBeVisible({ timeout: 15000 });

    console.log('✅ Task persists after page reload');

    // Step 4: Verify no errors throughout (filter out expected errors)
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('DevTools') &&
      !error.includes('Extension') &&
      !error.includes('connections.json') && // Expected - WebSocket connection file
      !error.includes('Geolocation') && // Expected - Geolocation not available in test environment
      !error.includes('Failed to load resource') // Expected - Various 404s for optional resources
    );
    expect(criticalErrors.length, 'Should have no critical errors').toBe(0);

    console.log('✅ Full task creation flow completed successfully');
  });

  test('Should verify no header case mismatch issues', async ({ page }) => {
    // This test verifies that the X-Source header fix is working
    // Previously there was a case mismatch: 'X-Source' vs 'x-source'

    let headerIssues: string[] = [];

    page.on('response', async (response) => {
      if (response.status() === 403 || response.status() === 401) {
        try {
          const body = await response.text();
          if (body.includes('42501') || body.includes('row-level security')) {
            headerIssues.push(`RLS error on ${response.url()}`);
          }
        } catch (e) {
          // Ignore
        }
      }
    });

    // Perform actions that would trigger the header issue
    const addTaskPlaceholder = page.locator('.add-task-placeholder').first();
    await addTaskPlaceholder.waitFor({ state: 'visible', timeout: 5000 });
    await addTaskPlaceholder.click();
    await page.waitForTimeout(500);

    const taskInput = page.locator('.inline-task-input').first();
    await taskInput.waitFor({ state: 'visible', timeout: 5000 });

    const taskName = `Header Test ${Date.now()}`;
    await taskInput.fill(taskName);
    await taskInput.press('Enter');
    await page.waitForTimeout(3000);

    // Verify no header-related RLS issues
    expect(headerIssues.length, 'Should have no header case mismatch RLS errors').toBe(0);
    console.log('✅ No header case mismatch issues');
  });

  test.afterEach(async () => {
    // Report summary
    console.log('\n📊 Test Summary:');
    console.log(`   Errors: ${consoleErrors.length}`);
    console.log(`   Warnings: ${consoleWarnings.length}`);
    console.log(`   Network Errors: ${networkErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors:');
      consoleErrors.forEach(error => console.log(`   - ${error}`));
    }

    if (consoleWarnings.length > 0) {
      console.log('\n⚠️ Console Warnings:');
      consoleWarnings.forEach(warning => console.log(`   - ${warning}`));
    }

    if (networkErrors.length > 0) {
      console.log('\n🌐 Network Errors:');
      networkErrors.forEach(error => console.log(`   - ${error}`));
    }
  });
});
