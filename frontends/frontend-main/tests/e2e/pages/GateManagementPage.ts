import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class GateManagementPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateToGateManagement(): Promise<void> {
    console.log('[GateManagementPage] Navigating to Gate Management...');
    
    // Try multiple navigation methods
    const navigationSelectors = [
      '[data-testid="gate-management-link"]',
      'a[href*="/school/gate"]',
      'text=Gate Management',
      'text=Gates',
      '.q-item:has-text("Gate")'
    ];

    let navigated = false;
    for (const selector of navigationSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          console.log(`[GateManagementPage] Navigated using: ${selector}`);
          navigated = true;
          break;
        }
      } catch (error) {
        console.log(`[GateManagementPage] Navigation selector failed: ${selector}`);
      }
    }

    if (!navigated) {
      // Direct navigation as fallback
      console.log('[GateManagementPage] Using direct navigation...');
      await this.page.goto('http://localhost:9000/#/school/gate');
    }

    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);
  }

  async createGate(gateName: string): Promise<{ id: string; name: string }> {
    console.log(`[GateManagementPage] Creating gate: ${gateName}`);
    
    // Click Add Gate button with multiple fallback selectors
    const addButtonSelectors = [
      '[data-testid="add-gate-button"]',
      'button:has-text("Add Gate")',
      'button:has-text("New Gate")',
      '.q-btn:has-text("Add")',
      'button[aria-label*="add" i]',
      '.add-gate-btn'
    ];

    let addButtonClicked = false;
    for (const selector of addButtonSelectors) {
      try {
        const button = this.page.locator(selector);
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          console.log(`[GateManagementPage] Clicked add button using: ${selector}`);
          addButtonClicked = true;
          break;
        }
      } catch (error) {
        console.log(`[GateManagementPage] Add button selector failed: ${selector}`);
      }
    }

    if (!addButtonClicked) {
      // Try floating action button
      const fabButton = this.page.locator('.q-fab__actions button').first();
      if (await fabButton.isVisible({ timeout: 2000 })) {
        await fabButton.click();
        console.log('[GateManagementPage] Clicked FAB button');
      } else {
        throw new Error('Could not find Add Gate button');
      }
    }

    // Wait for dialog to appear
    await this.page.waitForTimeout(2000);

    // Fill gate name with multiple fallback selectors
    const nameInputSelectors = [
      '[data-testid="gate-name-input"]',
      'input[placeholder*="gate name" i]',
      'input[placeholder*="name" i]',
      'input[aria-label*="name" i]',
      '.q-dialog input[type="text"]',
      'input[name="gateName"]',
      'input[name="name"]'
    ];

    let nameFilled = false;
    for (const selector of nameInputSelectors) {
      try {
        const input = this.page.locator(selector);
        if (await input.isVisible({ timeout: 2000 })) {
          await input.fill(gateName);
          console.log(`[GateManagementPage] Filled name using: ${selector}`);
          nameFilled = true;
          break;
        }
      } catch (error) {
        console.log(`[GateManagementPage] Name input selector failed: ${selector}`);
      }
    }

    if (!nameFilled) {
      // Try first visible text input in dialog
      const dialogInput = this.page.locator('.q-dialog input[type="text"]').first();
      if (await dialogInput.isVisible({ timeout: 2000 })) {
        await dialogInput.fill(gateName);
        console.log('[GateManagementPage] Used fallback dialog input');
      } else {
        throw new Error('Could not find gate name input field');
      }
    }

    // Submit the form with multiple fallback selectors
    const saveButtonSelectors = [
      '[data-testid="save-gate-button"]',
      'button:has-text("Save")',
      'button:has-text("Create")',
      'button:has-text("Add")',
      '.q-dialog button[type="submit"]',
      '.q-dialog .q-btn--unelevated'
    ];

    let saved = false;
    for (const selector of saveButtonSelectors) {
      try {
        const button = this.page.locator(selector);
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          console.log(`[GateManagementPage] Clicked save button using: ${selector}`);
          saved = true;
          break;
        }
      } catch (error) {
        console.log(`[GateManagementPage] Save button selector failed: ${selector}`);
      }
    }

    if (!saved) {
      throw new Error('Could not find Save button');
    }

    // Wait for dialog to close and table to update
    await this.page.waitForTimeout(3000);

    // Try to get the gate ID from the table
    let gateId = '';
    try {
      // Look for the newly created gate in the table
      const gateRow = this.page.locator(`tr:has-text("${gateName}")`).first();
      if (await gateRow.isVisible({ timeout: 5000 })) {
        // Try to extract ID from the row (might be in a data attribute or cell)
        gateId = await gateRow.getAttribute('data-id') || '';
        
        if (!gateId) {
          // Try to get from first cell
          const firstCell = gateRow.locator('td').first();
          const cellText = await firstCell.textContent();
          if (cellText && cellText.match(/^[0-9a-f-]+$/i)) {
            gateId = cellText;
          }
        }
      }
    } catch (error) {
      console.log('[GateManagementPage] Could not extract gate ID from table');
    }

    // Generate a fallback ID if not found
    if (!gateId) {
      gateId = `gate-${Date.now()}`;
      console.log(`[GateManagementPage] Using generated ID: ${gateId}`);
    }

    console.log(`[GateManagementPage] Gate created - Name: ${gateName}, ID: ${gateId}`);

    return {
      id: gateId,
      name: gateName
    };
  }

  async verifyGateInTable(gateName: string): Promise<boolean> {
    console.log(`[GateManagementPage] Verifying gate in table: ${gateName}`);
    
    try {
      // Multiple ways to check if gate exists in table
      const gateSelectors = [
        `text="${gateName}"`,
        `tr:has-text("${gateName}")`,
        `td:has-text("${gateName}")`,
        `.q-table__container >> text="${gateName}"`
      ];

      for (const selector of gateSelectors) {
        const element = this.page.locator(selector);
        if (await element.isVisible({ timeout: 5000 })) {
          console.log(`[GateManagementPage] Gate found in table using: ${selector}`);
          return true;
        }
      }

      console.log('[GateManagementPage] Gate not found in table');
      return false;
    } catch (error) {
      console.error('[GateManagementPage] Error verifying gate:', error);
      return false;
    }
  }

  async getGateIdFromTable(gateName: string): Promise<string | null> {
    console.log(`[GateManagementPage] Getting gate ID for: ${gateName}`);
    
    try {
      const gateRow = this.page.locator(`tr:has-text("${gateName}")`).first();
      
      if (await gateRow.isVisible({ timeout: 5000 })) {
        // Try to get ID from data attribute
        let gateId = await gateRow.getAttribute('data-id');
        
        if (!gateId) {
          // Try to get from first cell
          const firstCell = gateRow.locator('td').first();
          const cellText = await firstCell.textContent();
          if (cellText && cellText.match(/^[0-9a-f-]+$/i)) {
            gateId = cellText;
          }
        }
        
        console.log(`[GateManagementPage] Found gate ID: ${gateId}`);
        return gateId;
      }
      
      return null;
    } catch (error) {
      console.error('[GateManagementPage] Error getting gate ID:', error);
      return null;
    }
  }

  async deleteGate(gateName: string): Promise<void> {
    console.log(`[GateManagementPage] Deleting gate: ${gateName}`);
    
    try {
      // Find the gate row
      const gateRow = this.page.locator(`tr:has-text("${gateName}")`).first();
      
      if (await gateRow.isVisible({ timeout: 5000 })) {
        // Click delete button in the row
        const deleteButton = gateRow.locator('button[aria-label*="delete" i], button:has-text("Delete")');
        
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          
          // Confirm deletion if dialog appears
          const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
          if (await confirmButton.isVisible({ timeout: 2000 })) {
            await confirmButton.click();
          }
          
          await this.page.waitForTimeout(2000);
          console.log(`[GateManagementPage] Gate deleted: ${gateName}`);
        }
      }
    } catch (error) {
      console.error('[GateManagementPage] Error deleting gate:', error);
    }
  }
}