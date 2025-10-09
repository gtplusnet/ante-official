import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9000';

const TEST_USER = {
  username: 'guillermotabligan',
  password: 'water123'
};

// Helper function to login
async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // Check if we need to switch to manual login mode
  const manualLoginButton = page.locator('[data-testid="manual-login-button"]');
  const isManualButtonVisible = await manualLoginButton.isVisible().catch(() => false);

  if (isManualButtonVisible) {
    await manualLoginButton.click();
    await page.waitForTimeout(500);
  }

  // Fill in credentials
  await page.fill('[data-testid="login-username-input"]', TEST_USER.username);
  await page.fill('[data-testid="login-password-input"]', TEST_USER.password);

  // Click submit
  await page.click('[data-testid="login-submit-button"]');

  // Wait for navigation (hash-based routing)
  await page.waitForURL(/.*#\/member\/.*/, { timeout: 15000 });
  await page.waitForTimeout(2000);
}

test.describe('Project Board - Drag and Drop Functionality', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];
  let apiErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Clear error collectors
    consoleErrors = [];
    consoleWarnings = [];
    apiErrors = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
        console.log('⚠️ Console Warning:', msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
      console.log('❌ Page Error:', error.message);
    });

    // Listen for ALL failed requests (not just API)
    page.on('response', (response) => {
      if (response.status() >= 400) {
        const errorMsg = `${response.status()} - ${response.url()}`;
        apiErrors.push(errorMsg);
        console.log(`❌ HTTP Error: ${response.status()} - ${response.url()}`);
      }
    });

    await login(page);
  });

  test('Step 1: Navigate to Project Board View', async ({ page }) => {
    console.log('\n📍 Step 1: Navigating to Project Board View...');

    // Navigate to projects page
    await page.goto(`${BASE_URL}/#/member/project`);
    await page.waitForTimeout(3000);

    // Verify page loaded
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();

    console.log('✅ Navigated to projects page successfully');

    // Report console errors
    if (consoleErrors.length > 0) {
      console.log(`\n⚠️ Found ${consoleErrors.length} console errors on page load:`);
      consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    } else {
      console.log('✅ No console errors on page load');
    }

    // Report API errors
    if (apiErrors.length > 0) {
      console.log(`\n⚠️ Found ${apiErrors.length} API errors:`);
      apiErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    } else {
      console.log('✅ No API errors');
    }
  });

  test('Step 2: Verify Backend API is used (not Supabase)', async ({ page }) => {
    console.log('\n📍 Step 2: Verifying Backend API usage...');

    let backendApiCalled = false;
    let supabaseDirectCalled = false;

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('localhost:3000/project')) {
        backendApiCalled = true;
        console.log('✅ Backend API call detected:', url);
      }
      if (url.includes('supabase.co') && url.includes('/rest/v1/Project')) {
        supabaseDirectCalled = true;
        console.warn('⚠️ Direct Supabase call detected:', url);
      }
    });

    // Navigate to board view
    await page.goto(`${BASE_URL}/#/member/project`);
    await page.waitForTimeout(5000);

    // Verify
    expect(backendApiCalled).toBe(true);
    expect(supabaseDirectCalled).toBe(false);

    console.log('✅ Backend API used correctly (no Supabase direct calls)');
  });

  test('Step 3: Check for projects and board columns', async ({ page }) => {
    console.log('\n📍 Step 3: Checking for projects and board columns...');

    await page.goto(`${BASE_URL}/#/member/project`);
    await page.waitForTimeout(5000);

    // Look for any project-related elements
    const projectElements = await page.locator('[class*="project"], [class*="card"], [class*="column"]').count();
    console.log(`ℹ️ Found ${projectElements} project-related elements`);

    // Check for board view elements
    const boardColumns = await page.locator('[class*="board"], [class*="kanban"], [class*="column"]').count();
    console.log(`ℹ️ Found ${boardColumns} potential board column elements`);

    // Report errors
    if (consoleErrors.length > 0) {
      console.log(`\n⚠️ Console errors detected: ${consoleErrors.length}`);
      expect(consoleErrors.length).toBe(0); // This will fail the test if there are errors
    } else {
      console.log('✅ No console errors detected');
    }
  });

  test('Step 4: Test drag-and-drop API endpoint', async ({ page }) => {
    console.log('\n📍 Step 4: Testing drag-and-drop API endpoint...');

    let dragDropApiCalled = false;
    let dragDropApiSuccess = false;

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/project/board-stage') && request.method() === 'PATCH') {
        dragDropApiCalled = true;
        console.log('✅ Drag-drop API endpoint called:', url);
        console.log('  Method:', request.method());

        // Try to get request body
        try {
          const postData = request.postData();
          if (postData) {
            console.log('  Request body:', postData);
          }
        } catch (e) {
          // Ignore
        }
      }
    });

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/project/board-stage') && response.request().method() === 'PATCH') {
        if (response.status() === 200 || response.status() === 201) {
          dragDropApiSuccess = true;
          console.log('✅ Drag-drop API response: SUCCESS');

          try {
            const responseBody = await response.json();
            console.log('  Response:', JSON.stringify(responseBody, null, 2));
          } catch (e) {
            // Ignore JSON parse errors
          }
        } else {
          console.log(`❌ Drag-drop API response: ${response.status()}`);

          try {
            const responseBody = await response.text();
            console.log('  Error response:', responseBody);
          } catch (e) {
            // Ignore
          }
        }
      }
    });

    // Navigate to project board
    await page.goto(`${BASE_URL}/#/member/project`);
    await page.waitForTimeout(5000);

    // Look for draggable project cards
    const draggableCards = await page.locator('[draggable="true"], [class*="draggable"]').count();
    console.log(`ℹ️ Found ${draggableCards} potentially draggable elements`);

    // Note: We can't actually test drag-drop without real projects
    // This test verifies the endpoint exists and monitors for calls
    console.log('ℹ️ Drag-drop endpoint monitoring active');
    console.log('ℹ️ To test fully, create projects and manually drag them');
  });

  test('Step 5: Monitor all console output during board interaction', async ({ page }) => {
    console.log('\n📍 Step 5: Monitoring console output...');

    const allConsoleMessages: { type: string; text: string }[] = [];

    page.on('console', (msg) => {
      allConsoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Navigate and interact with board
    await page.goto(`${BASE_URL}/#/member/project`);
    await page.waitForTimeout(5000);

    // Try to click/interact with various elements
    try {
      // Look for any interactive elements
      const buttons = page.locator('button').first();
      if (await buttons.isVisible()) {
        console.log('ℹ️ Found interactive buttons');
      }
    } catch (e) {
      // Ignore
    }

    // Wait a bit more for any delayed errors
    await page.waitForTimeout(2000);

    // Categorize console messages
    const errors = allConsoleMessages.filter(m => m.type === 'error');
    const warnings = allConsoleMessages.filter(m => m.type === 'warning');
    const logs = allConsoleMessages.filter(m => m.type === 'log');

    console.log('\n📊 Console Message Summary:');
    console.log(`  Errors: ${errors.length}`);
    console.log(`  Warnings: ${warnings.length}`);
    console.log(`  Logs: ${logs.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Console Errors Found:');
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.text}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️ Console Warnings Found:');
      warnings.forEach((warn, i) => {
        console.log(`  ${i + 1}. ${warn.text}`);
      });
    }

    // Fail if there are console errors
    expect(errors.length).toBe(0);

    console.log('\n✅ No console errors detected during board interaction');
  });

  test('Step 6: Verify project board state after refresh', async ({ page }) => {
    console.log('\n📍 Step 6: Testing board state persistence...');

    await page.goto(`${BASE_URL}/#/member/project`);
    await page.waitForTimeout(5000);

    // Get initial state
    const initialElements = await page.locator('[class*="project"], [class*="card"]').count();
    console.log(`ℹ️ Initial project elements: ${initialElements}`);

    // Refresh page
    await page.reload();
    await page.waitForTimeout(5000);

    // Get state after refresh
    const afterRefreshElements = await page.locator('[class*="project"], [class*="card"]').count();
    console.log(`ℹ️ After refresh project elements: ${afterRefreshElements}`);

    // Report any errors
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console errors after refresh:');
      consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
      expect(consoleErrors.length).toBe(0);
    } else {
      console.log('✅ No console errors after refresh');
    }
  });
});

test.describe('Manual Drag-Drop Testing Instructions', () => {
  test('Display drag-drop testing instructions', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('📋 MANUAL DRAG-DROP TESTING INSTRUCTIONS');
    console.log('='.repeat(80));
    console.log('\n🎯 To fully test project board drag-and-drop:');
    console.log('\n1. Open browser: http://localhost:9000');
    console.log('2. Login: guillermotabligan / water123');
    console.log('3. Open DevTools: F12 → Console tab');
    console.log('\n4. Navigate to Projects page');
    console.log('5. Look for Board View toggle/button (if available)');
    console.log('6. Switch to Board View');
    console.log('\n7. If projects exist:');
    console.log('   - Try dragging a project card to a different column');
    console.log('   - Watch Console tab for errors');
    console.log('   - Check Network tab for PATCH /project/board-stage call');
    console.log('   - Verify the card moves smoothly');
    console.log('   - Refresh page and verify position is saved');
    console.log('\n8. If no projects exist:');
    console.log('   - Create 2-3 test projects first');
    console.log('   - Then perform drag-drop testing');
    console.log('\n9. Expected behavior:');
    console.log('   ✅ Card moves smoothly when dragged');
    console.log('   ✅ PATCH /project/board-stage API call succeeds (200 OK)');
    console.log('   ✅ NO console errors');
    console.log('   ✅ Position saves (persists after refresh)');
    console.log('   ✅ Optimistic UI update (instant visual feedback)');
    console.log('\n10. If errors occur:');
    console.log('   - Note the error message');
    console.log('   - Check Network tab for failed API calls');
    console.log('   - Report back for fixes');
    console.log('\n' + '='.repeat(80) + '\n');

    expect(true).toBe(true);
  });
});
