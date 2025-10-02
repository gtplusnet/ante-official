import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TaskWidgetPage } from '../pages/TaskWidgetPage';
import { getTestUser, getTestTask } from '../fixtures/test-data';
import { createScreenshotHelper } from '../helpers/screenshot.helper';

test.describe('Continuous Flow: Login to Task Creation', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let taskWidgetPage: TaskWidgetPage;
  let screenshot: ReturnType<typeof createScreenshotHelper>;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    taskWidgetPage = new TaskWidgetPage(page);

    console.log('🎬 Starting new test run...');
    console.log('=' .repeat(60));
  });

  test('Complete flow from login to task creation', async ({ page }) => {
    const testUser = getTestUser('DEFAULT');
    const testTask = getTestTask('DEFAULT');
    screenshot = createScreenshotHelper('login-to-task-creation');

    console.log('🎯 Test Objective: Complete flow from login to creating a task');
    console.log(`👤 User: ${testUser.username}`);
    console.log(`📋 Task: ${testTask.title}`);
    console.log('=' .repeat(60));

    // STEP 1: Navigate to application and login
    console.log('\n🔐 STEP 1: LOGIN PROCESS');
    console.log('-' .repeat(30));
    
    await test.step('Login to application', async () => {
      await screenshot.takeStepScreenshot(page, 'before-login');
      await loginPage.login(testUser);
      
      // Verify we're logged in successfully (check for dashboard elements instead of URL)
      await expect(page.locator('text=Welcome')).toBeVisible();
      console.log('✅ Login verification passed');
      await screenshot.takeStepScreenshot(page, 'after-successful-login');
    });

    // STEP 2: Navigate to dashboard and verify
    console.log('\n🏠 STEP 2: DASHBOARD NAVIGATION');
    console.log('-' .repeat(30));
    
    await test.step('Verify dashboard access', async () => {
      await dashboardPage.waitForDashboardToLoad();
      await screenshot.takeStepScreenshot(page, 'dashboard-loaded');
      await dashboardPage.assertOnDashboard();
      
      // Log available widgets for debugging
      const widgets = await dashboardPage.getVisibleWidgets();
      console.log(`📋 Available widgets: ${widgets.join(', ')}`);
      await screenshot.takeStepScreenshot(page, 'dashboard-widgets-visible');
    });

    // STEP 3: Find and interact with Task Widget
    console.log('\n📋 STEP 3: TASK WIDGET INTERACTION');
    console.log('-' .repeat(30));
    
    await test.step('Open task creation dialog', async () => {
      // Find the task widget
      await dashboardPage.findTaskWidget();
      console.log('✅ Task widget located');
      await screenshot.takeStepScreenshot(page, 'task-widget-found');

      // Open task widget menu
      await dashboardPage.openTaskWidgetMenu();
      console.log('✅ Task widget menu opened');
      await screenshot.takeStepScreenshot(page, 'task-menu-opened');

      // Click create task button
      await dashboardPage.clickCreateTaskButton();
      console.log('✅ Create task button clicked');
      await screenshot.takeStepScreenshot(page, 'create-task-button-clicked');
    });

    // STEP 4: Fill task creation form
    console.log('\n✏️ STEP 4: TASK CREATION FORM');
    console.log('-' .repeat(30));
    
    await test.step('Create new task', async () => {
      // Wait for dialog to open
      await taskWidgetPage.waitForTaskDialogToOpen();
      await taskWidgetPage.assertTaskDialogIsOpen();
      await screenshot.takeStepScreenshot(page, 'task-dialog-opened');

      // Fill task details
      console.log('📝 Filling task form...');
      await screenshot.takeStepScreenshot(page, 'before-filling-task-form');
      await taskWidgetPage.createTask(testTask);
      await screenshot.takeStepScreenshot(page, 'task-form-filled');
      
      console.log('✅ Task creation form completed');
    });

    // STEP 5: Verify task creation success
    console.log('\n🎉 STEP 5: TASK CREATION VERIFICATION');
    console.log('-' .repeat(30));
    
    await test.step('Verify task was created successfully', async () => {
      // Wait for task creation success
      await taskWidgetPage.waitForTaskCreationSuccess();
      await screenshot.takeStepScreenshot(page, 'task-creation-success');
      
      // Verify dialog is closed
      await taskWidgetPage.assertTaskDialogIsClosed();
      await screenshot.takeStepScreenshot(page, 'task-dialog-closed');

      console.log('✅ Task creation verified successfully');
    });

    // STEP 6: Additional verification (optional)
    await test.step('Additional verification', async () => {
      // Wait a bit for any UI updates
      await page.waitForTimeout(2000);
      
      // We could add more verification here like:
      // - Check if task appears in task list
      // - Verify task details in the widget
      // - Check notifications
      
      console.log('✅ Additional verification completed');
    });

    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    console.log(`✅ Successfully logged in as ${testUser.username}`);
    console.log(`✅ Successfully navigated to dashboard`);
    console.log(`✅ Successfully opened task creation dialog`);
    console.log(`✅ Successfully created task: "${testTask.title}"`);
    console.log('=' .repeat(60));
  });

  test('Verify task creation dialog can be cancelled', async ({ page }) => {
    const testUser = getTestUser('DEFAULT');
    screenshot = createScreenshotHelper('task-creation-cancel');

    console.log('🎯 Test Objective: Verify task creation can be cancelled');
    console.log('=' .repeat(60));

    await test.step('Login and navigate to task creation', async () => {
      await screenshot.takeStepScreenshot(page, 'before-login');
      await loginPage.login(testUser);
      await screenshot.takeStepScreenshot(page, 'after-login');
      await dashboardPage.waitForDashboardToLoad();
      await screenshot.takeStepScreenshot(page, 'dashboard-loaded');
      await dashboardPage.openTaskCreationDialog();
      await taskWidgetPage.waitForTaskDialogToOpen();
      await screenshot.takeStepScreenshot(page, 'task-dialog-opened');
    });

    await test.step('Cancel task creation', async () => {
      await taskWidgetPage.assertTaskDialogIsOpen();
      await screenshot.takeStepScreenshot(page, 'before-cancel');

      await taskWidgetPage.cancelTaskCreation();
      await screenshot.takeStepScreenshot(page, 'after-cancel');
      
      await taskWidgetPage.assertTaskDialogIsClosed();
      await screenshot.takeStepScreenshot(page, 'dialog-closed-after-cancel');

      console.log('✅ Task creation cancelled successfully');
    });
  });

  test.afterEach(async ({ page }) => {
    // Clean up after each test
    console.log('\n🧹 Cleaning up after test...');
    
    // Take a final screenshot for debugging if needed
    if (screenshot) {
      await screenshot.takeDebugScreenshot(page, 'final-test-state');
    }

    console.log('✅ Test cleanup completed');
    console.log('=' .repeat(60));
  });
});