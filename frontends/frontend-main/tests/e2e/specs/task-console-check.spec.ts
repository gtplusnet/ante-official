import { test, expect, ConsoleMessage } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getTestUser } from '../fixtures/test-data';

interface ConsoleAnalysis {
  errors: string[];
  warnings: string[];
  criticalErrors: string[];
  ignorableMessages: string[];
  apiErrors: string[];
}

test.describe('Task Module Console Check', () => {
  let loginPage: LoginPage;
  let consoleMessages: ConsoleMessage[] = [];
  let analysis: ConsoleAnalysis;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    consoleMessages = [];
    analysis = {
      errors: [],
      warnings: [],
      criticalErrors: [],
      ignorableMessages: [],
      apiErrors: []
    };

    // Capture ALL console messages
    page.on('console', (msg) => {
      consoleMessages.push(msg);

      const text = msg.text();
      const type = msg.type();

      // Categorize messages
      if (type === 'error') {
        // Check if it's an API error
        if (text.includes('Failed to load resource') || text.includes('400') || text.includes('500')) {
          analysis.apiErrors.push(text);
        }
        // Check if it's ignorable
        else if (text.includes('GoTrueClient instances detected') ||
                 text.includes('Multiple instances') ||
                 text.includes('THIS SHOULD BE VISIBLE') || // Debug logs
                 text.includes('Session state:')) {
          analysis.ignorableMessages.push(text);
        }
        // Check if it's critical
        else if (text.includes('require is not defined') ||
                 text.includes('avatarUrl does not exist') ||
                 text.includes('Cannot read properties') ||
                 text.includes('TypeError') ||
                 text.includes('ReferenceError')) {
          analysis.criticalErrors.push(text);
        }
        // Regular error
        else {
          analysis.errors.push(text);
        }
      } else if (type === 'warning') {
        if (!text.includes('DevTools') && !text.includes('Download the React DevTools')) {
          analysis.warnings.push(text);
        }
      }
    });

    // Also capture network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        const url = response.url();
        const status = response.status();
        if (!url.includes('favicon') && !url.includes('.map')) {
          analysis.apiErrors.push(`HTTP ${status}: ${url}`);
        }
      }
    });
  });

  test('Check all task pages for console errors and warnings', async ({ page }) => {
    const testUser = getTestUser('DEFAULT');

    console.log('🔍 Starting comprehensive console check for Task Module');
    console.log('📋 Will check all task pages and analyze console output\n');

    // Step 1: Login
    await test.step('Login to application', async () => {
      await loginPage.login(testUser);
      await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
      console.log('✅ Login successful\n');
    });

    // Clear console messages from login
    consoleMessages = [];
    analysis = {
      errors: [],
      warnings: [],
      criticalErrors: [],
      ignorableMessages: [],
      apiErrors: []
    };

    // Define all task pages to check
    const taskPages = [
      { name: 'All Tasks', url: '/#/member/task/all' },
      { name: 'My Tasks', url: '/#/member/task/my' },
      { name: 'Approval Tasks', url: '/#/member/task/approval' },
      { name: 'Due Tasks', url: '/#/member/task/due' },
      { name: 'Done Tasks', url: '/#/member/task/done' },
      { name: 'Assigned Tasks', url: '/#/member/task/assigned' },
      { name: 'Complete Tasks', url: '/#/member/task/complete' }
    ];

    // Step 2: Visit each task page
    for (const taskPage of taskPages) {
      await test.step(`Check ${taskPage.name} page`, async () => {
        console.log(`\n📄 Checking ${taskPage.name}...`);

        // Navigate to the page
        await page.goto(taskPage.url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Wait for any lazy-loaded content

        // Check if page loaded correctly
        const hasTaskView = await page.locator('.task-list-view').count() > 0 ||
                            await page.locator('.task-board-view').count() > 0 ||
                            await page.locator('.task-card-view').count() > 0;

        if (hasTaskView) {
          console.log(`  ✅ ${taskPage.name} loaded successfully`);
        } else {
          console.log(`  ⚠️ ${taskPage.name} may not have loaded correctly`);
        }

        // Test grouping tabs if present
        const groupingTabs = await page.locator('.grouping-tabs .tab-button').count();
        if (groupingTabs > 0) {
          console.log(`  📊 Testing ${groupingTabs} grouping tabs...`);

          // Click each tab to trigger any potential errors
          for (let i = 0; i < Math.min(groupingTabs, 3); i++) {
            await page.locator('.grouping-tabs .tab-button').nth(i).click();
            await page.waitForTimeout(500);
          }
        }

        // Try to interact with task elements if present
        const taskRows = await page.locator('.task-row').count();
        if (taskRows > 0) {
          console.log(`  📝 Found ${taskRows} task(s) on this page`);

          // Try clicking on first task's assignee dropdown
          const firstTask = page.locator('.task-row').first();
          const assigneeButton = firstTask.locator('.assignee-button');

          if (await assigneeButton.isVisible()) {
            await assigneeButton.click();
            await page.waitForTimeout(300);

            // Close dropdown
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
          }
        } else {
          console.log(`  📭 No tasks found on this page`);
        }

        // Take screenshot if errors detected for this page
        const pageErrors = consoleMessages.filter(msg =>
          msg.type() === 'error' &&
          !msg.text().includes('THIS SHOULD BE VISIBLE')
        );

        if (pageErrors.length > 0) {
          await page.screenshot({
            path: `screenshots/console-check-${taskPage.name.toLowerCase().replace(/\s+/g, '-')}.png`,
            fullPage: true
          });
          console.log(`  📸 Screenshot saved due to ${pageErrors.length} error(s)`);
        }
      });
    }

    // Step 3: Analyze all collected console messages
    await test.step('Analyze console output', async () => {
      console.log('\n' + '='.repeat(60));
      console.log('📊 CONSOLE ANALYSIS REPORT');
      console.log('='.repeat(60));

      // Critical Errors
      if (analysis.criticalErrors.length > 0) {
        console.log('\n❌ CRITICAL ERRORS FOUND:');
        analysis.criticalErrors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.substring(0, 150)}${error.length > 150 ? '...' : ''}`);
        });
      } else {
        console.log('\n✅ No critical errors found');
      }

      // API Errors
      if (analysis.apiErrors.length > 0) {
        console.log('\n🌐 API ERRORS:');
        const uniqueApiErrors = [...new Set(analysis.apiErrors)];
        uniqueApiErrors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.substring(0, 150)}${error.length > 150 ? '...' : ''}`);
        });
      } else {
        console.log('✅ No API errors found');
      }

      // Regular Errors
      if (analysis.errors.length > 0) {
        console.log('\n⚠️ OTHER ERRORS:');
        const uniqueErrors = [...new Set(analysis.errors)];
        uniqueErrors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.substring(0, 150)}${error.length > 150 ? '...' : ''}`);
        });
      } else {
        console.log('✅ No other errors found');
      }

      // Warnings
      if (analysis.warnings.length > 0) {
        console.log('\n⚡ WARNINGS:');
        const uniqueWarnings = [...new Set(analysis.warnings)];
        uniqueWarnings.forEach((warning, index) => {
          console.log(`  ${index + 1}. ${warning.substring(0, 150)}${warning.length > 150 ? '...' : ''}`);
        });
      } else {
        console.log('✅ No warnings found');
      }

      // Ignorable Messages
      if (analysis.ignorableMessages.length > 0) {
        console.log('\n📝 IGNORABLE MESSAGES (Debug/Info):');
        console.log(`  Found ${analysis.ignorableMessages.length} debug/info messages (ignored)`);
      }

      // Summary
      console.log('\n' + '='.repeat(60));
      console.log('📈 SUMMARY:');
      console.log(`  Critical Errors: ${analysis.criticalErrors.length}`);
      console.log(`  API Errors: ${[...new Set(analysis.apiErrors)].length}`);
      console.log(`  Other Errors: ${[...new Set(analysis.errors)].length}`);
      console.log(`  Warnings: ${[...new Set(analysis.warnings)].length}`);
      console.log(`  Total Pages Checked: ${taskPages.length}`);
      console.log('='.repeat(60));
    });

    // Step 4: Assert no critical issues
    await test.step('Verify no critical issues', async () => {
      // Fail test if critical errors found
      if (analysis.criticalErrors.length > 0) {
        throw new Error(`Found ${analysis.criticalErrors.length} critical error(s):\n${analysis.criticalErrors.join('\n')}`);
      }

      // Check for specific fixed issues
      const fixedIssues = {
        'require is not defined': false,
        'avatarUrl does not exist': false,
        'color does not exist': false
      };

      for (const error of [...analysis.criticalErrors, ...analysis.apiErrors, ...analysis.errors]) {
        for (const issue in fixedIssues) {
          if (error.includes(issue)) {
            fixedIssues[issue as keyof typeof fixedIssues] = true;
          }
        }
      }

      console.log('\n🔧 VERIFICATION OF PREVIOUS FIXES:');
      console.log(`  ✅ 'require is not defined' - ${fixedIssues['require is not defined'] ? '❌ STILL PRESENT' : '✅ FIXED'}`);
      console.log(`  ✅ 'avatarUrl does not exist' - ${fixedIssues['avatarUrl does not exist'] ? '❌ STILL PRESENT' : '✅ FIXED'}`);
      console.log(`  ✅ 'color does not exist' - ${fixedIssues['color does not exist'] ? '❌ STILL PRESENT' : '✅ FIXED'}`);

      // Final verdict
      const hasIssues = analysis.criticalErrors.length > 0 ||
                        Object.values(fixedIssues).some(v => v);

      if (hasIssues) {
        console.log('\n❌ CONSOLE CHECK FAILED - Issues need to be fixed');
      } else {
        console.log('\n✅ CONSOLE CHECK PASSED - No critical issues found!');
      }

      expect(analysis.criticalErrors.length).toBe(0);
      expect(Object.values(fixedIssues).every(v => !v)).toBe(true);
    });
  });
});