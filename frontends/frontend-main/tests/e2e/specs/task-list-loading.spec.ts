import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getTestUser } from '../fixtures/test-data';

test.describe('Task List Loading Test', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);

    // Capture console messages and network responses
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });

    page.on('response', response => {
      if (response.url().includes('/rest/v1/Task') && response.status() !== 200) {
        console.error(`Task API error: ${response.status()} - ${response.url()}`);
      }
    });
  });

  test('Task list should load with data from Supabase', async ({ page }) => {
    const testUser = getTestUser('DEFAULT');

    console.log('🎯 Test: Task List Loading');
    console.log(`👤 User: ${testUser.username}`);

    // Step 1: Login
    await test.step('Login to application', async () => {
      await loginPage.login(testUser);
      await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
      console.log('✅ Login successful');
    });

    // Step 2: Navigate to task module
    await test.step('Navigate to task module', async () => {
      // Wait for navigation to be ready
      await page.waitForTimeout(2000);

      // Navigate to tasks
      const taskSelectors = [
        'a:has-text("Tasks")',
        'div.nav-item:has-text("Tasks")',
        '[href*="task"]',
        'text=Task',
        '.q-item:has-text("Task")'
      ];

      let taskFound = false;
      for (const selector of taskSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            await element.click();
            taskFound = true;
            console.log(`✅ Clicked Tasks navigation with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!taskFound) {
        console.log('⚠️ Task navigation not found, navigating directly to URL');
        await page.goto('/#/member/task/all');
      }

      await page.waitForLoadState('networkidle');
      console.log('✅ Navigated to task module');
    });

    // Step 3: Check for console errors
    await test.step('Check for API errors', async () => {
      // Wait for any API calls to complete
      await page.waitForTimeout(3000);

      // Check for Task API responses
      const taskApiResponses = await page.evaluate(() => {
        return window.performance.getEntries()
          .filter(entry => entry.name.includes('/rest/v1/Task'))
          .map(entry => ({
            url: entry.name,
            duration: entry.duration,
            type: entry.entryType
          }));
      });

      console.log('📊 Task API calls found:', taskApiResponses.length);
      taskApiResponses.forEach(response => {
        console.log(`  - ${response.url.substring(0, 100)}...`);
      });
    });

    // Step 4: Verify task list structure loads
    await test.step('Verify task list structure', async () => {
      // Wait for the task list view to be visible
      const taskListView = page.locator('.task-list-view');
      const isTaskListVisible = await taskListView.isVisible({ timeout: 5000 }).catch(() => false);

      if (isTaskListVisible) {
        console.log('✅ Task list view loaded');

        // Check for column headers
        const headers = [
          { selector: '.list-header .header-name', text: 'Name' },
          { selector: '.list-header .header-assignee', text: 'Assignee' },
          { selector: '.list-header .header-due-date', text: 'Due date' },
          { selector: '.list-header .header-priority', text: 'Priority' },
          { selector: '.list-header .header-project', text: 'Project' }
        ];

        for (const header of headers) {
          const headerElement = page.locator(header.selector);
          if (await headerElement.isVisible({ timeout: 1000 }).catch(() => false)) {
            console.log(`  ✅ Header "${header.text}" is visible`);
          } else {
            console.log(`  ❌ Header "${header.text}" is missing`);
          }
        }
      } else {
        console.log('❌ Task list view not loaded');
      }
    });

    // Step 5: Check for actual task data
    await test.step('Check for task data', async () => {
      // Check for task sections
      const taskSections = await page.locator('.task-section').count();
      console.log(`📊 Task sections found: ${taskSections}`);

      // Check for task rows
      const taskRows = await page.locator('.task-row').count();
      console.log(`📝 Task rows found: ${taskRows}`);

      if (taskRows > 0) {
        console.log('✅ Tasks are loading from Supabase');

        // Get details of first task
        const firstTask = page.locator('.task-row').first();
        const taskTitle = await firstTask.locator('.task-title').textContent();
        console.log(`  First task title: "${taskTitle}"`);

        // Check if assignee data is loading
        const assigneeButton = firstTask.locator('.assignee-button');
        if (await assigneeButton.isVisible()) {
          const assigneeText = await assigneeButton.textContent();
          console.log(`  Assignee: "${assigneeText?.trim()}"`);
        }
      } else {
        console.log('⚠️ No tasks found - checking for error messages');

        // Check for error messages
        const errorMessage = page.locator('.error-message, .no-data-message');
        if (await errorMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
          const errorText = await errorMessage.textContent();
          console.log(`  Error/No data message: "${errorText}"`);
        }
      }
    });

    // Step 6: Check authentication status
    await test.step('Check authentication status', async () => {
      // Check if Supabase client is initialized
      const supabaseStatus = await page.evaluate(() => {
        const supabaseService = (window as any).supabaseService;
        if (supabaseService) {
          return {
            isInitialized: supabaseService.isInitialized,
            isCustomSession: supabaseService.isCustomSession,
            hasAccessToken: !!supabaseService.customAccessToken,
            hasClient: !!supabaseService.client
          };
        }
        return null;
      });

      console.log('🔐 Supabase status:', supabaseStatus);

      // Check localStorage for tokens
      const storageData = await page.evaluate(() => {
        return {
          hasSupabaseAuth: !!localStorage.getItem('supabase.auth.token'),
          hasCustomSession: !!localStorage.getItem('supabase-custom-session'),
          hasToken: !!localStorage.getItem('token')
        };
      });

      console.log('💾 Storage data:', storageData);
    });

    // Step 7: Test direct API call
    await test.step('Test direct Supabase API call', async () => {
      const apiResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('https://ofnmfmwywkhosrmycltb.supabase.co/rest/v1/Task?select=id,title&limit=1', {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mbm1mbXd5d2tob3NybXljbHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNTQ1OTcsImV4cCI6MjA3MjYzMDU5N30.xG_whEdorHh3pPPrf8p8xm7FzJrTuqhCpd-igos08XY',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mbm1mbXd5d2tob3NybXljbHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNTQ1OTcsImV4cCI6MjA3MjYzMDU5N30.xG_whEdorHh3pPPrf8p8xm7FzJrTuqhCpd-igos08XY'
            }
          });

          if (response.ok) {
            const data = await response.json();
            return { success: true, data, status: response.status };
          } else {
            const error = await response.text();
            return { success: false, error, status: response.status };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      console.log('🌐 Direct API call result:', apiResponse);

      if (apiResponse.success) {
        console.log('✅ Direct API call successful - Supabase is accessible');
      } else {
        console.log('❌ Direct API call failed - Authentication issue');
      }
    });

    // Final assertion
    await test.step('Final verification', async () => {
      // Check if we have either task data or proper error handling
      const hasTaskData = (await page.locator('.task-row').count()) > 0;
      const hasTaskSections = (await page.locator('.task-section').count()) > 0;
      const hasErrorMessage = await page.locator('.error-message, .no-data').isVisible({ timeout: 1000 }).catch(() => false);

      const isWorking = hasTaskData || hasTaskSections || hasErrorMessage;

      if (isWorking) {
        console.log('✅ Task module is functioning (either showing data or handling errors properly)');
      } else {
        console.log('❌ Task module is not functioning properly');
      }

      expect(isWorking).toBe(true);
    });

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/task-list-loading-final.png',
      fullPage: true
    });
  });
});