import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TaskWidgetPage } from '../pages/TaskWidgetPage';
import { getTestUser, getUniqueTaskTitle } from '../fixtures/test-data';
import { createScreenshotHelper } from '../helpers/screenshot.helper';

test.describe('Task Assignment Modes Test', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let taskWidgetPage: TaskWidgetPage;
  let isLoggedIn = false;
  let screenshot: ReturnType<typeof createScreenshotHelper>;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    taskWidgetPage = new TaskWidgetPage(page);
    
    // Login if not already logged in
    if (!isLoggedIn) {
      const testUser = getTestUser('DEFAULT');
      await loginPage.login(testUser);
      await dashboardPage.waitForDashboardToLoad();
      isLoggedIn = true;
    } else {
      // Navigate to dashboard if already logged in
      await page.goto('/#/member/dashboard');
      await dashboardPage.waitForDashboardToLoad();
    }
  });

  test('Create task with Assign to Self mode', async ({ page }) => {
    console.log('\n🎯 Test: Create task with SELF assignment');
    screenshot = createScreenshotHelper('task-assign-self');
    
    const task = {
      title: getUniqueTaskTitle('Self Assigned Task'),
      description: 'This task is assigned to myself for personal completion.',
      difficulty: 'EASY',
      assignMode: 'SELF' as const,
    };
    
    await test.step('Open task creation dialog', async () => {
      await screenshot.takeStepScreenshot(page, 'dashboard-initial');
      await dashboardPage.findTaskWidget();
      await screenshot.takeStepScreenshot(page, 'task-widget-found');
      await dashboardPage.openTaskWidgetMenu();
      await screenshot.takeStepScreenshot(page, 'task-menu-opened');
      await dashboardPage.clickCreateTaskButton();
      await taskWidgetPage.waitForTaskDialogToOpen();
      await screenshot.takeStepScreenshot(page, 'task-dialog-opened');
    });
    
    await test.step('Create self-assigned task', async () => {
      await screenshot.takeStepScreenshot(page, 'before-filling-self-task');
      await taskWidgetPage.createTask(task);
      await screenshot.takeStepScreenshot(page, 'self-task-filled');
      console.log(`✅ Created self-assigned task: "${task.title}"`);
    });
    
    await test.step('Verify task creation', async () => {
      await taskWidgetPage.waitForTaskCreationSuccess();
      await screenshot.takeStepScreenshot(page, 'self-task-created-success');
      await taskWidgetPage.assertTaskDialogIsClosed();
      await screenshot.takeStepScreenshot(page, 'self-task-dialog-closed');
      
      console.log('✅ Self-assigned task verified');
    });
  });

  test('Create task with Assign to Others mode', async ({ page }) => {
    console.log('\n🎯 Test: Create task with OTHER assignment');
    screenshot = createScreenshotHelper('task-assign-others');
    
    const task = {
      title: getUniqueTaskTitle('Task for Others'),
      description: 'This task is assigned to another team member for collaboration.',
      difficulty: 'MEDIUM',
      assignMode: 'OTHER' as const,
      assigneeName: 'admin', // Adjust based on available users in your system
    };
    
    await test.step('Open task creation dialog', async () => {
      await screenshot.takeStepScreenshot(page, 'dashboard-initial');
      await dashboardPage.findTaskWidget();
      await screenshot.takeStepScreenshot(page, 'task-widget-found');
      await dashboardPage.openTaskWidgetMenu();
      await screenshot.takeStepScreenshot(page, 'task-menu-opened');
      await dashboardPage.clickCreateTaskButton();
      await taskWidgetPage.waitForTaskDialogToOpen();
      await screenshot.takeStepScreenshot(page, 'task-dialog-opened');
    });
    
    await test.step('Create task assigned to others', async () => {
      await screenshot.takeStepScreenshot(page, 'before-filling-others-task');
      await taskWidgetPage.createTask(task);
      await screenshot.takeStepScreenshot(page, 'others-task-filled');
      console.log(`✅ Created task for others: "${task.title}"`);
      console.log(`   Assigned to: ${task.assigneeName}`);
    });
    
    await test.step('Verify task creation', async () => {
      await taskWidgetPage.waitForTaskCreationSuccess();
      await screenshot.takeStepScreenshot(page, 'others-task-created-success');
      await taskWidgetPage.assertTaskDialogIsClosed();
      await screenshot.takeStepScreenshot(page, 'others-task-dialog-closed');
      
      console.log('✅ Task assigned to others verified');
    });
  });

  test('Create task with Assign to Role Group mode', async ({ page }) => {
    console.log('\n🎯 Test: Create task with ROLE_GROUP assignment');
    screenshot = createScreenshotHelper('task-assign-role-group');
    
    const task = {
      title: getUniqueTaskTitle('Role Group Task'),
      description: 'This task is assigned to a role group for team-wide collaboration.',
      difficulty: 'HARD',
      assignMode: 'ROLE_GROUP' as const,
      roleGroupName: 'Developer', // Adjust based on available role groups in your system
    };
    
    await test.step('Open task creation dialog', async () => {
      await screenshot.takeStepScreenshot(page, 'dashboard-initial');
      await dashboardPage.findTaskWidget();
      await screenshot.takeStepScreenshot(page, 'task-widget-found');
      await dashboardPage.openTaskWidgetMenu();
      await screenshot.takeStepScreenshot(page, 'task-menu-opened');
      await dashboardPage.clickCreateTaskButton();
      await taskWidgetPage.waitForTaskDialogToOpen();
      await screenshot.takeStepScreenshot(page, 'task-dialog-opened');
    });
    
    await test.step('Create role group assigned task', async () => {
      await screenshot.takeStepScreenshot(page, 'before-filling-role-task');
      await taskWidgetPage.createTask(task);
      await screenshot.takeStepScreenshot(page, 'role-task-filled');
      console.log(`✅ Created role group task: "${task.title}"`);
      console.log(`   Assigned to role: ${task.roleGroupName}`);
    });
    
    await test.step('Verify task creation', async () => {
      await taskWidgetPage.waitForTaskCreationSuccess();
      await screenshot.takeStepScreenshot(page, 'role-task-created-success');
      await taskWidgetPage.assertTaskDialogIsClosed();
      await screenshot.takeStepScreenshot(page, 'role-task-dialog-closed');
      
      console.log('✅ Role group task verified');
    });
  });

  test('Create tasks with all three assignment modes sequentially', async ({ page }) => {
    console.log('\n🎯 Test: Create tasks with all assignment modes');
    screenshot = createScreenshotHelper('task-assign-all-modes');
    
    const tasks = [
      {
        title: getUniqueTaskTitle('Sequential Self Task'),
        description: 'Sequential test - Self assigned',
        difficulty: 'EASY',
        assignMode: 'SELF' as const,
      },
      {
        title: getUniqueTaskTitle('Sequential Other Task'),
        description: 'Sequential test - Assigned to others',
        difficulty: 'MEDIUM',
        assignMode: 'OTHER' as const,
        assigneeName: 'admin',
      },
      {
        title: getUniqueTaskTitle('Sequential Role Task'),
        description: 'Sequential test - Role group assigned',
        difficulty: 'HARD',
        assignMode: 'ROLE_GROUP' as const,
        roleGroupName: 'Developer',
      },
    ];
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      await test.step(`Create ${task.assignMode} task`, async () => {
        await screenshot.takeStepScreenshot(page, `before-${task.assignMode.toLowerCase()}-task`);
        
        // Open dialog
        await dashboardPage.findTaskWidget();
        await dashboardPage.openTaskWidgetMenu();
        await dashboardPage.clickCreateTaskButton();
        await taskWidgetPage.waitForTaskDialogToOpen();
        await screenshot.takeStepScreenshot(page, `${task.assignMode.toLowerCase()}-dialog-opened`);
        
        // Create task
        await taskWidgetPage.createTask(task);
        await screenshot.takeStepScreenshot(page, `${task.assignMode.toLowerCase()}-task-created`);
        
        // Verify
        await taskWidgetPage.waitForTaskCreationSuccess();
        await taskWidgetPage.assertTaskDialogIsClosed();
        await screenshot.takeStepScreenshot(page, `${task.assignMode.toLowerCase()}-verified`);
        
        console.log(`✅ Created ${task.assignMode} task: "${task.title}"`);
        
        // Wait before next task
        await page.waitForTimeout(2000);
      });
    }
    
    // Take final screenshot showing all tasks
    await screenshot.takeStepScreenshot(page, 'all-tasks-created-final');
    
    console.log('\n🎉 ALL ASSIGNMENT MODE TESTS COMPLETED SUCCESSFULLY!');
  });
});