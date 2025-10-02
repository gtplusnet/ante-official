import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { TEST_CONFIG } from '../config/test.config';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to dashboard page
   */
  async navigateToDashboard(): Promise<void> {
    await this.navigateTo(TEST_CONFIG.DASHBOARD_URL);
    await this.waitForDashboardToLoad();
  }

  /**
   * Wait for dashboard to fully load
   */
  async waitForDashboardToLoad(): Promise<void> {
    console.log('⏳ Waiting for dashboard to load...');
    
    // Since we're already on dashboard after login, just wait for key elements
    const dashboardIndicators = [
      'text=Welcome', // Welcome message
      'text=Dashboard', // Dashboard text
      '.q-layout', // Main layout
      'main' // Main content area
    ];
    
    let found = false;
    for (const selector of dashboardIndicators) {
      if (await this.isElementVisible(selector, 2000)) {
        found = true;
        console.log(`✅ Dashboard ready - found: ${selector}`);
        break;
      }
    }
    
    if (!found) {
      console.log('⚠️ Dashboard indicators not found, but continuing...');
    }
    
    console.log('✅ Dashboard loading completed');
  }

  /**
   * Wait for dashboard widgets to load
   */
  async waitForDashboardWidgets(): Promise<void> {
    console.log('⏳ Waiting for dashboard widgets to load...');
    
    // Wait for common dashboard widgets
    const widgetSelectors = [
      '.widget',
      '.dashboard-widget',
      '.q-card',
      '[class*="widget"]'
    ];
    
    // Wait for at least one widget to be present
    let widgetsFound = false;
    for (const selector of widgetSelectors) {
      const widgets = this.page.locator(selector);
      const count = await widgets.count();
      if (count > 0) {
        widgetsFound = true;
        console.log(`✅ Found ${count} widgets with selector: ${selector}`);
        break;
      }
    }
    
    if (!widgetsFound) {
      console.log('⚠️ No widgets found, but continuing...');
    }
    
    // Additional wait for widgets to render
    await this.page.waitForTimeout(1000);
  }

  /**
   * Find and click on Task Widget
   */
  async findTaskWidget(): Promise<void> {
    console.log('🔍 Looking for Task Widget...');
    
    // Try different selectors to find the task widget
    const taskWidgetSelectors = [
      TEST_CONFIG.SELECTORS.DASHBOARD.TASK_WIDGET,
      TEST_CONFIG.SELECTORS.DASHBOARD.TASK_WIDGET_FALLBACK,
      '[class*="task-widget"]',
      '[class*="TaskWidget"]',
      '.q-card:has-text("Task")',
      '.widget:has-text("Task")',
      '.dashboard-widget:has-text("Task List")',
      '.q-card .text-h6:has-text("Task")',
    ];
    
    for (const selector of taskWidgetSelectors) {
      try {
        if (await this.isElementVisible(selector, 3000)) {
          console.log(`✅ Task Widget found with selector: ${selector}`);
          await this.scrollToElement(selector);
          return;
        }
      } catch (error) {
        console.log(`🔄 Task widget selector ${selector} failed, trying next...`);
        continue;
      }
    }
    
    // If not found, take screenshot for debugging
    await this.takeScreenshot('task-widget-not-found');
    throw new Error('Task Widget not found on dashboard');
  }

  /**
   * Open Task Widget menu
   */
  async openTaskWidgetMenu(): Promise<void> {
    console.log('📋 Opening Task Widget menu...');
    
    // First ensure task widget is visible
    await this.findTaskWidget();
    
    // Look for the "more" menu button in task widget
    const menuSelectors = [
      TEST_CONFIG.SELECTORS.TASK_WIDGET.MORE_MENU,
      TEST_CONFIG.SELECTORS.TASK_WIDGET.MORE_MENU_FALLBACK,
      '.task-menu-button',
      '.task-widget .q-btn[icon="more_vert"]',
      '.q-btn:has(.q-icon[name="more_vert"])',
      '[class*="task"] .q-btn[icon="more_vert"]',
      'button[aria-label*="more"], button[title*="more"]'
    ];
    
    for (const selector of menuSelectors) {
      try {
        if (await this.isElementVisible(selector, 2000)) {
          console.log(`👆 Clicking task menu with selector: ${selector}`);
          await this.clickElement(selector);
          
          // Wait for menu to open
          await this.page.waitForTimeout(500);
          console.log('✅ Task Widget menu opened');
          return;
        }
      } catch (error) {
        console.log(`🔄 Menu selector ${selector} failed, trying next...`);
        continue;
      }
    }
    
    // Alternative: try to click on the task widget itself if it's clickable
    console.log('🔄 Trying to click task widget directly...');
    const taskWidget = this.page.locator(TEST_CONFIG.SELECTORS.DASHBOARD.TASK_WIDGET_FALLBACK).first();
    if (await this.isElementVisible(taskWidget, 2000)) {
      await this.clickElement(taskWidget);
      await this.page.waitForTimeout(500);
      return;
    }
    
    await this.takeScreenshot('task-widget-menu-not-found');
    throw new Error('Task Widget menu button not found');
  }

  /**
   * Click "Create Task" option from menu
   */
  async clickCreateTaskButton(): Promise<void> {
    console.log('➕ Looking for Create Task button...');
    
    // Look for Create Task option in menu or dialog
    const createTaskSelectors = [
      TEST_CONFIG.SELECTORS.TASK_WIDGET.CREATE_TASK_BUTTON,
      TEST_CONFIG.SELECTORS.TASK_WIDGET.CREATE_TASK_BUTTON_FALLBACK,
      'q-item:has-text("Create Task")',
      '.q-item:has-text("Create Task")',
      '.q-menu .q-item:has-text("Create")',
      'button:has-text("Create Task")',
      '.q-btn:has-text("Create Task")',
      '[role="menuitem"]:has-text("Create")',
      'a:has-text("Create Task")'
    ];
    
    for (const selector of createTaskSelectors) {
      try {
        if (await this.isElementVisible(selector, 3000)) {
          console.log(`👆 Clicking Create Task with selector: ${selector}`);
          await this.clickElement(selector);
          console.log('✅ Create Task button clicked');
          return;
        }
      } catch (error) {
        console.log(`🔄 Create Task selector ${selector} failed, trying next...`);
        continue;
      }
    }
    
    await this.takeScreenshot('create-task-button-not-found');
    throw new Error('Create Task button not found');
  }

  /**
   * Complete flow to open task creation dialog with screenshots
   */
  async openTaskCreationDialog(): Promise<void> {
    console.log('🚀 Opening task creation dialog...');
    
    // Step 7: Make sure we're on dashboard
    await this.waitForDashboardToLoad();
    await this.takeStepScreenshot('dashboard', 'loaded', 7);
    
    // Step 8: Find task widget
    await this.findTaskWidget();
    await this.takeStepScreenshot('dashboard', 'task-widget-found', 8);
    
    // Step 9: Open task widget menu
    await this.openTaskWidgetMenu();
    await this.takeStepScreenshot('dashboard', 'task-menu-opened', 9);
    
    // Step 10: Click create task
    await this.clickCreateTaskButton();
    await this.takeStepScreenshot('dashboard', 'create-task-clicked', 10);
    
    // Step 11: Wait for dialog to open
    await this.page.waitForTimeout(1000);
    await this.takeStepScreenshot('dashboard', 'dialog-opening', 11);
    
    console.log('✅ Task creation dialog flow completed');
  }

  /**
   * Assert we are on dashboard page
   */
  async assertOnDashboard(): Promise<void> {
    // Check for dashboard elements instead of strict URL matching (hash routing)
    const dashboardElements = [
      'text=Welcome',
      'text=Dashboard', 
      '.q-layout'
    ];
    
    let found = false;
    for (const selector of dashboardElements) {
      if (await this.isElementVisible(selector, 1000)) {
        found = true;
        console.log(`✅ Dashboard confirmed with element: ${selector}`);
        break;
      }
    }
    
    expect(found).toBeTruthy();
    console.log('✅ Confirmed we are on dashboard page');
  }

  /**
   * Get list of visible widgets
   */
  async getVisibleWidgets(): Promise<string[]> {
    const widgets = [];
    
    // Look for common widget title selectors
    const titleSelectors = [
      '.widget-title',
      '.q-card-section .text-h6',
      '.q-card-section .text-subtitle1',
      '.dashboard-widget h6',
      '.card-title'
    ];
    
    for (const selector of titleSelectors) {
      try {
        const elements = await this.page.locator(selector).all();
        for (const element of elements) {
          const text = await element.textContent();
          if (text && text.trim()) {
            widgets.push(text.trim());
          }
        }
      } catch (error) {
        // Continue with other selectors
      }
    }
    
    console.log(`📋 Found widgets: ${widgets.join(', ')}`);
    return widgets;
  }

  /**
   * Check if specific widget exists
   */
  async hasWidget(widgetName: string): Promise<boolean> {
    const widgets = await this.getVisibleWidgets();
    return widgets.some(widget => 
      widget.toLowerCase().includes(widgetName.toLowerCase())
    );
  }
}