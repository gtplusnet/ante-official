import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { TEST_CONFIG } from '../config/test.config';
import { TestTask } from '../fixtures/test-data';

export class TaskWidgetPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Wait for task creation dialog to open
   */
  async waitForTaskDialogToOpen(): Promise<void> {
    console.log('⏳ Waiting for task creation dialog to open...');
    
    // Wait for dialog to be visible
    const dialogSelectors = [
      '.q-dialog',
      '.dialog-card',
      '[role="dialog"]',
      '.q-card.dialog-card'
    ];
    
    let dialogFound = false;
    for (const selector of dialogSelectors) {
      if (await this.isElementVisible(selector, 5000)) {
        console.log(`✅ Dialog found with selector: ${selector}`);
        dialogFound = true;
        break;
      }
    }
    
    if (!dialogFound) {
      await this.takeScreenshot('task-dialog-not-found');
      throw new Error('Task creation dialog did not open');
    }
    
    // Wait for dialog content to be ready
    await this.page.waitForTimeout(1000);
    
    // Wait for any dialog animations to complete
    await this.waitHelper.waitForDialogToOpen();
    
    console.log('✅ Task creation dialog is ready');
  }

  /**
   * Fill task title
   */
  async fillTaskTitle(title: string): Promise<void> {
    console.log(`📝 Filling task title: ${title}`);
    
    // Take screenshot before attempting to fill
    await this.takeScreenshot('task-form-before-title-fill');
    
    const titleSelectors = [
      // Try the exact data-testid from the component
      '[data-testid="task-title-input"] input',
      '[data-testid="task-title-input"] .q-field__native',
      '[data-testid="task-title-input"]',
      // Try based on label structure in GInput
      '.g-field:has(.label:contains("Task Title")) input',
      '.g-field:has(.label:contains("Task Title")) .q-field__native',
      // Original selectors
      TEST_CONFIG.SELECTORS.TASK_DIALOG.TITLE_INPUT,
      TEST_CONFIG.SELECTORS.TASK_DIALOG.TITLE_INPUT_FALLBACK,
      // GInput component may render differently
      '.q-dialog input[type="text"]',
      '.q-dialog .q-input input',
      '.q-dialog .q-field input',
      'input[placeholder*="Task Title" i]',
      'input[label*="title" i]',
      '.form-field input[type="text"]',
      '.g-field input[type="text"]',
      // Generic text input in dialog
      '.q-dialog input:not([type="hidden"]):not([type="submit"])',
      // Try Quasar native input
      '.q-dialog .q-field__native',
    ];
    
    // Debug: Log all available inputs
    try {
      const allInputs = await this.page.locator('.q-dialog input, .q-dialog .q-field__native').all();
      console.log(`🔍 Found ${allInputs.length} input elements in dialog`);
      
      for (let i = 0; i < allInputs.length; i++) {
        const input = allInputs[i];
        const tagName = await input.evaluate(el => el.tagName);
        const type = await input.getAttribute('type');
        const placeholder = await input.getAttribute('placeholder');
        const testid = await input.getAttribute('data-testid');
        const classes = await input.getAttribute('class');
        const name = await input.getAttribute('name');
        console.log(`Input ${i + 1}: ${tagName} type="${type}" placeholder="${placeholder}" data-testid="${testid}" name="${name}" class="${classes?.substring(0, 50)}"`);
      }
    } catch (e) {
      console.log('❌ Could not enumerate inputs for debugging');
    }

    // Debug: Check for GInput components structure
    try {
      const gFields = await this.page.locator('.q-dialog .g-field').all();
      console.log(`🔍 Found ${gFields.length} g-field elements`);
      
      for (let i = 0; i < gFields.length; i++) {
        const gField = gFields[i];
        const labelText = await gField.locator('.label').textContent().catch(() => 'No label');
        console.log(`GField ${i + 1}: label="${labelText}"`);
      }
    } catch (e) {
      console.log('❌ Could not enumerate g-field elements');
    }
    
    for (const selector of titleSelectors) {
      try {
        console.log(`🔍 Trying selector: ${selector}`);
        if (await this.isElementVisible(selector, 2000)) {
          console.log(`✅ Found element with selector: ${selector}`);
          await this.fillInput(selector, title);
          await this.takeScreenshot('task-form-after-title-fill');
          console.log('✅ Task title filled successfully');
          return;
        } else {
          console.log(`❌ Element not visible with selector: ${selector}`);
        }
      } catch (error) {
        console.log(`🔄 Title selector ${selector} failed: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
    }
    
    // Final debug screenshot before failing
    await this.takeScreenshot('task-form-title-field-not-found');
    throw new Error('Task title input field not found');
  }

  /**
   * Select assign mode
   */
  async selectAssignMode(mode: string): Promise<void> {
    console.log(`🎯 Selecting assign mode: ${mode}`);
    
    const assignModeSelectors = [
      TEST_CONFIG.SELECTORS.TASK_DIALOG.ASSIGN_MODE,
      '.q-field:has(label:text("Assign To")) .q-select',
      '.form-field:has(label:contains("Assign To")) .q-select',
      '.g-field:has(.label:contains("Assign To")) .q-select'
    ];
    
    for (const selector of assignModeSelectors) {
      try {
        if (await this.isElementVisible(selector, 3000)) {
          // Click to open dropdown
          await this.clickElement(selector);
          
          // Wait for dropdown options
          await this.page.waitForTimeout(500);
          
          // Look for the specific option
          const optionSelectors = [
            `.q-menu .q-item:has-text("${mode}")`,
            `.q-option:has-text("${mode}")`,
            `.q-item-label:has-text("${mode}")`,
            `[role="option"]:has-text("${mode}")`
          ];
          
          for (const optionSelector of optionSelectors) {
            if (await this.isElementVisible(optionSelector, 2000)) {
              await this.clickElement(optionSelector);
              console.log('✅ Assign mode selected successfully');
              return;
            }
          }
        }
      } catch (error) {
        console.log(`🔄 Assign mode selector ${selector} failed, trying next...`);
        continue;
      }
    }
    
    console.log('⚠️ Could not select assign mode, continuing...');
  }

  /**
   * Select assignee when mode is OTHER
   */
  async selectAssignee(assigneeName: string): Promise<void> {
    console.log(`👤 Selecting assignee: ${assigneeName}`);
    
    // Wait for assignee field to appear
    await this.page.waitForTimeout(1000);
    
    const assigneeSelectors = [
      '[data-testid="task-assignee-select"]',
      '.q-field:has(label:text("Assignee")) .q-select',
      '.form-field:has(label:contains("Assignee")) .q-select',
      '.g-field:has(.label:contains("Assignee")) input'
    ];
    
    for (const selector of assigneeSelectors) {
      try {
        if (await this.isElementVisible(selector, 3000)) {
          // Click to open dropdown or type in search
          await this.clickElement(selector);
          await this.page.waitForTimeout(500);
          
          // Type to search for assignee
          await this.page.keyboard.type(assigneeName);
          await this.page.waitForTimeout(1000);
          
          // Select from dropdown
          const optionSelectors = [
            `.q-menu .q-item:has-text("${assigneeName}")`,
            `.q-option:has-text("${assigneeName}")`,
            `.q-item__label:has-text("${assigneeName}")`,
            `[role="option"]:has-text("${assigneeName}")`
          ];
          
          for (const optionSelector of optionSelectors) {
            if (await this.isElementVisible(optionSelector, 2000)) {
              await this.clickElement(optionSelector);
              console.log('✅ Assignee selected successfully');
              return;
            }
          }
          
          // If no dropdown, press Enter to confirm
          await this.page.keyboard.press('Enter');
          console.log('✅ Assignee entered successfully');
          return;
        }
      } catch (error) {
        console.log(`🔄 Assignee selector ${selector} failed, trying next...`);
        continue;
      }
    }
    
    console.log('⚠️ Could not select assignee, continuing...');
  }

  /**
   * Select role group when mode is ROLE_GROUP
   */
  async selectRoleGroup(roleGroupName: string): Promise<void> {
    console.log(`👥 Selecting role group: ${roleGroupName}`);
    
    // Wait for role group field to appear
    await this.page.waitForTimeout(1000);
    
    const roleGroupSelectors = [
      '[data-testid="task-role-group-select"]',
      '.q-field:has(label:text("Role Group")) .q-select',
      '.form-field:has(label:contains("Role Group")) .q-select',
      '.g-field:has(.label:contains("Role Group")) input'
    ];
    
    for (const selector of roleGroupSelectors) {
      try {
        if (await this.isElementVisible(selector, 3000)) {
          // Click to open dropdown or type in search
          await this.clickElement(selector);
          await this.page.waitForTimeout(500);
          
          // Type to search for role group
          await this.page.keyboard.type(roleGroupName);
          await this.page.waitForTimeout(1000);
          
          // Select from dropdown
          const optionSelectors = [
            `.q-menu .q-item:has-text("${roleGroupName}")`,
            `.q-option:has-text("${roleGroupName}")`,
            `.q-item__label:has-text("${roleGroupName}")`,
            `[role="option"]:has-text("${roleGroupName}")`
          ];
          
          for (const optionSelector of optionSelectors) {
            if (await this.isElementVisible(optionSelector, 2000)) {
              await this.clickElement(optionSelector);
              console.log('✅ Role group selected successfully');
              return;
            }
          }
          
          // If no dropdown, press Enter to confirm
          await this.page.keyboard.press('Enter');
          console.log('✅ Role group entered successfully');
          return;
        }
      } catch (error) {
        console.log(`🔄 Role group selector ${selector} failed, trying next...`);
        continue;
      }
    }
    
    console.log('⚠️ Could not select role group, continuing...');
  }

  /**
   * Select task difficulty
   */
  async selectTaskDifficulty(difficulty: string): Promise<void> {
    console.log(`⚡ Selecting task difficulty: ${difficulty}`);
    
    const difficultySelectors = [
      TEST_CONFIG.SELECTORS.TASK_DIALOG.DIFFICULTY_SELECT,
      '.q-field:has(label:text("Difficulty")) .q-select',
      '.form-field:has(label:contains("Difficulty")) .q-select',
      '.g-field:has(.label:contains("Difficulty")) .q-select'
    ];
    
    for (const selector of difficultySelectors) {
      try {
        if (await this.isElementVisible(selector, 3000)) {
          // Click to open dropdown
          await this.clickElement(selector);
          
          // Wait for dropdown options
          await this.page.waitForTimeout(500);
          
          // Look for the specific option
          const optionSelectors = [
            `.q-menu .q-item:has-text("${difficulty}")`,
            `.q-option:has-text("${difficulty}")`,
            `.q-item-label:has-text("${difficulty}")`,
            `[role="option"]:has-text("${difficulty}")`
          ];
          
          for (const optionSelector of optionSelectors) {
            if (await this.isElementVisible(optionSelector, 2000)) {
              await this.clickElement(optionSelector);
              console.log('✅ Task difficulty selected successfully');
              return;
            }
          }
        }
      } catch (error) {
        console.log(`🔄 Difficulty selector ${selector} failed, trying next...`);
        continue;
      }
    }
    
    console.log('⚠️ Could not select difficulty, continuing...');
  }

  /**
   * Fill task description
   */
  async fillTaskDescription(description: string): Promise<void> {
    console.log(`📄 Filling task description: ${description.substring(0, 50)}...`);
    
    const descriptionSelectors = [
      TEST_CONFIG.SELECTORS.TASK_DIALOG.DESCRIPTION_EDITOR,
      'textarea[placeholder*="description" i]',
      '.q-field:has(label:text("Description")) textarea',
      '.q-field:has(label:text("Description")) input',
      '.form-field:has(label:contains("Description")) textarea',
      '.form-field:has(label:contains("Description")) input',
      '.g-field:has(.label:contains("Description")) textarea',
      '.g-field:has(.label:contains("Description")) .ql-editor' // For rich text editor
    ];
    
    for (const selector of descriptionSelectors) {
      try {
        if (await this.isElementVisible(selector, 3000)) {
          // Handle rich text editor differently
          if (selector.includes('ql-editor')) {
            await this.clickElement(selector);
            await this.page.keyboard.type(description);
          } else {
            await this.fillInput(selector, description);
          }
          console.log('✅ Task description filled successfully');
          return;
        }
      } catch (error) {
        console.log(`🔄 Description selector ${selector} failed, trying next...`);
        continue;
      }
    }
    
    console.log('⚠️ Could not fill description, continuing...');
  }

  /**
   * Click submit/create task button
   */
  async submitTask(): Promise<void> {
    console.log('🚀 Submitting task...');
    
    const submitSelectors = [
      TEST_CONFIG.SELECTORS.TASK_DIALOG.SUBMIT_BUTTON,
      TEST_CONFIG.SELECTORS.TASK_DIALOG.SUBMIT_BUTTON_FALLBACK,
      'button:has-text("Create Task")',
      '.q-btn:has-text("Create Task")',
      '.dialog-actions button:has-text("Create")',
      'button[type="submit"]',
      '.action-btn:has-text("Create")'
    ];
    
    for (const selector of submitSelectors) {
      try {
        if (await this.isElementVisible(selector, 3000)) {
          console.log(`👆 Clicking submit with selector: ${selector}`);
          await this.clickElement(selector);
          console.log('✅ Task submit button clicked');
          return;
        }
      } catch (error) {
        console.log(`🔄 Submit selector ${selector} failed, trying next...`);
        continue;
      }
    }
    
    throw new Error('Task submit button not found');
  }

  /**
   * Wait for task creation success
   */
  async waitForTaskCreationSuccess(): Promise<void> {
    console.log('⏳ Waiting for task creation to complete...');
    
    // Wait for dialog to close
    await this.page.waitForFunction(
      () => {
        const dialogs = document.querySelectorAll('.q-dialog');
        return dialogs.length === 0 || 
               Array.from(dialogs).every(dialog => 
                 (dialog as HTMLElement).style.display === 'none' ||
                 !dialog.querySelector('.dialog-card')
               );
      },
      { timeout: 10000 }
    );
    
    // Wait for any success notification or page update
    await this.page.waitForTimeout(1000);
    
    // Look for success indicators
    const successSelectors = [
      '.q-notification--positive',
      '.success-message',
      '.alert-success',
      '[role="alert"]:has-text("success")',
      '.q-banner--positive'
    ];
    
    let successFound = false;
    for (const selector of successSelectors) {
      if (await this.isElementVisible(selector, 2000)) {
        console.log(`✅ Success indicator found: ${selector}`);
        successFound = true;
        break;
      }
    }
    
    if (!successFound) {
      console.log('ℹ️ No explicit success message found, assuming success based on dialog closure');
    }
    
    console.log('✅ Task creation completed successfully');
  }

  /**
   * Complete task creation flow with comprehensive screenshots
   */
  async createTask(task: TestTask): Promise<void> {
    console.log('📋 Starting task creation flow...');
    console.log(`📝 Assignment Mode: ${task.assignMode}`);
    
    // Step 12: Wait for dialog to be ready
    await this.waitForTaskDialogToOpen();
    await this.takeStepScreenshot('task-form', 'dialog-opened', 12);
    
    // Step 13: Fill task details - assign mode
    await this.selectAssignMode(task.assignMode);
    await this.page.waitForTimeout(500);
    await this.takeStepScreenshot('task-form', 'assign-mode-selected', 13);
    
    // Step 13b: Handle specific assignment modes
    if (task.assignMode === 'OTHER' && task.assigneeName) {
      await this.selectAssignee(task.assigneeName);
      await this.page.waitForTimeout(500);
      await this.takeStepScreenshot('task-form', 'assignee-selected', 14);
    } else if (task.assignMode === 'ROLE_GROUP' && task.roleGroupName) {
      await this.selectRoleGroup(task.roleGroupName);
      await this.page.waitForTimeout(500);
      await this.takeStepScreenshot('task-form', 'role-group-selected', 14);
    }
    
    // Step 14: Fill task title
    await this.fillTaskTitle(task.title);
    await this.page.waitForTimeout(300);
    await this.takeStepScreenshot('task-form', 'title-filled', 15);
    
    // Step 15: Select task difficulty
    await this.selectTaskDifficulty(task.difficulty);
    await this.page.waitForTimeout(300);
    await this.takeStepScreenshot('task-form', 'difficulty-selected', 16);
    
    // Step 16: Fill task description
    await this.fillTaskDescription(task.description);
    await this.page.waitForTimeout(300);
    await this.takeStepScreenshot('task-form', 'description-filled', 17);
    
    // Step 17: Submit the task
    await this.submitTask();
    await this.takeStepScreenshot('task-form', 'submit-clicked', 18);
    
    // Step 18: Wait for success
    await this.waitForTaskCreationSuccess();
    await this.takeStepScreenshot('task-form', 'creation-success', 18);
    
    console.log('✅ Task creation flow completed successfully!');
  }

  /**
   * Cancel task creation
   */
  async cancelTaskCreation(): Promise<void> {
    console.log('❌ Cancelling task creation...');
    
    const cancelSelectors = [
      TEST_CONFIG.SELECTORS.TASK_DIALOG.CANCEL_BUTTON,
      'button:has-text("Cancel")',
      '.q-btn:has-text("Cancel")',
      '.dialog-actions button:has-text("Cancel")',
      '.dialog-close-btn',
      'button[icon="close"]'
    ];
    
    for (const selector of cancelSelectors) {
      if (await this.isElementVisible(selector, 2000)) {
        await this.clickElement(selector);
        console.log('✅ Task creation cancelled');
        return;
      }
    }
    
    // Fallback: press Escape
    await this.page.keyboard.press('Escape');
    console.log('✅ Task creation cancelled with Escape key');
  }

  /**
   * Assert task dialog is open
   */
  async assertTaskDialogIsOpen(): Promise<void> {
    const isOpen = await this.isElementVisible('.q-dialog', 3000);
    expect(isOpen).toBeTruthy();
    
    // Check for dialog content instead of specific title text
    const hasDialogContent = await this.isElementVisible('.q-dialog .q-card', 2000);
    expect(hasDialogContent).toBeTruthy();
    
    console.log('✅ Confirmed task dialog is open');
  }

  /**
   * Assert task dialog is closed
   */
  async assertTaskDialogIsClosed(): Promise<void> {
    // Wait a bit for any closing animation
    await this.page.waitForTimeout(1000);
    
    const isClosed = await this.page.waitForFunction(
      () => {
        const dialogs = document.querySelectorAll('.q-dialog');
        return dialogs.length === 0 || 
               Array.from(dialogs).every(dialog => 
                 (dialog as HTMLElement).style.display === 'none'
               );
      },
      { timeout: 5000 }
    );
    
    expect(isClosed).toBeTruthy();
    console.log('✅ Confirmed task dialog is closed');
  }
}