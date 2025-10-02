import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TaskWidgetPage } from '../pages/TaskWidgetPage';
import { getTestUser, getTestTask } from '../fixtures/test-data';

test.describe('Task Creation Test', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let taskWidgetPage: TaskWidgetPage;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    taskWidgetPage = new TaskWidgetPage(page);
  });

  test('Successfully create a task', async ({ page }) => {
    const testUser = getTestUser('DEFAULT');
    const testTask = getTestTask('DEFAULT');
    
    console.log('🎯 Test: Create a new task');
    console.log(`👤 User: ${testUser.username}`);
    console.log(`📋 Task: ${testTask.title}`);
    
    // Step 1: Login
    await test.step('Login to application', async () => {
      await loginPage.login(testUser);
      await expect(page.locator('text=Welcome')).toBeVisible();
      console.log('✅ Login successful');
    });
    
    // Step 2: Navigate to dashboard
    await test.step('Navigate to dashboard', async () => {
      await dashboardPage.waitForDashboardToLoad();
      await dashboardPage.assertOnDashboard();
      console.log('✅ Dashboard loaded');
    });
    
    // Step 3: Open task creation dialog
    await test.step('Open task creation dialog', async () => {
      await dashboardPage.findTaskWidget();
      await dashboardPage.openTaskWidgetMenu();
      await dashboardPage.clickCreateTaskButton();
      await taskWidgetPage.waitForTaskDialogToOpen();
      console.log('✅ Task dialog opened');
    });
    
    // Step 4: Create the task
    await test.step('Fill and submit task form', async () => {
      await taskWidgetPage.createTask(testTask);
      console.log('✅ Task created successfully');
    });
    
    // Step 5: Verify task was created
    await test.step('Verify task creation', async () => {
      await taskWidgetPage.waitForTaskCreationSuccess();
      await taskWidgetPage.assertTaskDialogIsClosed();
      
      // Take final screenshot
      await page.screenshot({ 
        path: 'screenshots/task-created-final.png', 
        fullPage: true 
      });
      
      console.log('✅ Task verified in dashboard');
    });
    
    console.log('\n🎉 TASK CREATION TEST COMPLETED SUCCESSFULLY!');
    console.log(`✅ Created task: "${testTask.title}"`);
  });
});