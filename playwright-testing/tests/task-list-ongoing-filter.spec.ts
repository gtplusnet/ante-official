import { test, expect } from '@playwright/test';

test.describe('TaskList - Ongoing Task Default Filter Test', () => {
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
  });

  test('should default to "Ongoing Task" filter and load To Do + In Progress tasks', async ({ page }) => {
    console.log('\n🔍 Testing "Ongoing Task" default filter...\n');

    // Collect console errors
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    const apiCalls: { url: string; params: string }[] = [];

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

    // Listen for API calls
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/task/ordered')) {
        const params = url.split('?')[1] || '';
        apiCalls.push({ url, params });
        console.log('📡 API Call:', url);
        console.log('📋 Params:', params);
      }
    });

    // Listen for network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        const errorMsg = `HTTP ${response.status()} - ${response.url()}`;
        networkErrors.push(errorMsg);
        console.error('❌ Network Error:', errorMsg);
      }
    });

    // Navigate to Task List (All Tasks view)
    await page.goto('http://localhost:9001/#/member/task/all', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Take screenshot of initial page
    await page.screenshot({
      path: '/home/jhay/projects/ante-official/playwright-testing/test-results/task-list-initial.png',
      fullPage: true
    });

    // Check for status filter dropdown
    const statusFilter = page.locator('select, .q-select, [role="combobox"]').filter({ hasText: /Status|Ongoing Task|To Do|In Progress/ }).first();

    if (await statusFilter.isVisible({ timeout: 5000 })) {
      console.log('✓ Status filter is visible');

      // Get the selected value
      const selectedValue = await statusFilter.evaluate((el: any) => {
        if (el.tagName === 'SELECT') {
          return el.value;
        } else if (el.classList.contains('q-select')) {
          // Quasar select - try to find the displayed text
          const display = el.querySelector('.q-field__native span');
          return display ? display.textContent : null;
        }
        return null;
      });

      console.log('📋 Selected Filter Value:', selectedValue);

      // Check if "Ongoing Task" is selected (or if boardLaneId=[1,2] is in API call)
      const hasOngoingFilter = apiCalls.some(call => {
        const decodedParams = decodeURIComponent(call.params);
        console.log('🔍 Decoded API Params:', decodedParams);

        // Check if filter contains boardLaneId with array [1,2]
        if (decodedParams.includes('boardLaneId')) {
          const filterMatch = decodedParams.match(/filter=([^&]+)/);
          if (filterMatch) {
            try {
              const filterObj = JSON.parse(filterMatch[1]);
              console.log('📋 Parsed Filter Object:', JSON.stringify(filterObj, null, 2));

              // Check if boardLaneId is an array containing 1 and 2
              if (Array.isArray(filterObj.boardLaneId)) {
                const hasToDoAndInProgress =
                  filterObj.boardLaneId.includes(1) &&
                  filterObj.boardLaneId.includes(2);
                console.log('✓ boardLaneId is array:', filterObj.boardLaneId);
                console.log('✓ Contains To Do (1) and In Progress (2):', hasToDoAndInProgress);
                return hasToDoAndInProgress;
              } else if (filterObj.boardLaneId === 1 || filterObj.boardLaneId === 2) {
                console.log('⚠️  boardLaneId is single value:', filterObj.boardLaneId);
              }
            } catch (e) {
              console.error('❌ Failed to parse filter:', e);
            }
          }
        }
        return false;
      });

      if (hasOngoingFilter) {
        console.log('✅ "Ongoing Task" filter is active (boardLaneId: [1, 2])');
      } else {
        console.log('⚠️  "Ongoing Task" filter may not be active');
        console.log('📋 All API Calls:', JSON.stringify(apiCalls, null, 2));
      }

      // Verify tasks are loaded
      await page.waitForTimeout(2000);

      // Check for task items or empty state
      const taskCards = page.locator('.task-card, [data-task-id], .q-card').filter({ hasText: /Task|To Do|In Progress/ });
      const taskCount = await taskCards.count();
      console.log(`📋 Found ${taskCount} task cards`);

      // Check for loading spinner
      const loadingSpinner = page.locator('.q-spinner-dots, .q-loading');
      const spinnerVisible = await loadingSpinner.isVisible({ timeout: 1000 }).catch(() => false);

      if (spinnerVisible) {
        console.log('⏳ Loading spinner is visible, waiting for tasks to load...');
        await loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
          console.log('⚠️  Loading spinner did not disappear');
        });
      }

      // Take final screenshot
      await page.screenshot({
        path: '/home/jhay/projects/ante-official/playwright-testing/test-results/task-list-ongoing-filter.png',
        fullPage: true
      });

      // Verify API was called with correct filter
      expect(hasOngoingFilter, '"Ongoing Task" filter should be active by default').toBe(true);

    } else {
      console.log('⚠️  Status filter not found');

      // Take screenshot for debugging
      await page.screenshot({
        path: '/home/jhay/projects/ante-official/playwright-testing/test-results/task-list-no-filter.png',
        fullPage: true
      });
    }

    // Report errors
    console.log(`\n📊 Console Errors: ${consoleErrors.length}`);
    console.log(`📊 Network Errors: ${networkErrors.length}`);
    console.log(`📊 API Calls: ${apiCalls.length}\n`);

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
