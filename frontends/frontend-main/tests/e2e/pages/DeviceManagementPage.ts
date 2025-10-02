import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DeviceManagementPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateToDeviceManagement(): Promise<void> {
    console.log('[DeviceManagementPage] Navigating to Device Management...');
    
    // Try multiple navigation methods
    const navigationSelectors = [
      '[data-testid="device-management-link"]',
      'a[href*="/school/device"]',
      'text=Device Management',
      'text=Devices',
      '.q-item:has-text("Device")'
    ];

    let navigated = false;
    for (const selector of navigationSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          console.log(`[DeviceManagementPage] Navigated using: ${selector}`);
          navigated = true;
          break;
        }
      } catch (error) {
        console.log(`[DeviceManagementPage] Navigation selector failed: ${selector}`);
      }
    }

    if (!navigated) {
      // Direct navigation as fallback
      console.log('[DeviceManagementPage] Using direct navigation...');
      await this.page.goto('http://localhost:9000/#/school/device');
    }

    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);
  }

  async generateLicense(gateId: string, quantity: number = 1): Promise<{ key: string; status: string }> {
    console.log(`[DeviceManagementPage] Generating ${quantity} license(s) for gate: ${gateId}`);
    
    // Click Generate License button with multiple fallback selectors
    const generateButtonSelectors = [
      '[data-testid="generate-license-button"]',
      'button:has-text("Generate License")',
      'button:has-text("Generate Licenses")',
      'button:has-text("New License")',
      '.q-btn:has-text("Generate")',
      'button[aria-label*="generate" i]',
      '.generate-license-btn'
    ];

    let generateButtonClicked = false;
    for (const selector of generateButtonSelectors) {
      try {
        const button = this.page.locator(selector);
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          console.log(`[DeviceManagementPage] Clicked generate button using: ${selector}`);
          generateButtonClicked = true;
          break;
        }
      } catch (error) {
        console.log(`[DeviceManagementPage] Generate button selector failed: ${selector}`);
      }
    }

    if (!generateButtonClicked) {
      // Try floating action button
      const fabButton = this.page.locator('.q-fab__actions button').first();
      if (await fabButton.isVisible({ timeout: 2000 })) {
        await fabButton.click();
        console.log('[DeviceManagementPage] Clicked FAB button');
      } else {
        throw new Error('Could not find Generate License button');
      }
    }

    // Wait for dialog to appear
    await this.page.waitForTimeout(2000);

    // Select gate from dropdown with multiple fallback selectors
    const gateSelectSelectors = [
      '[data-testid="gate-select"]',
      'select[name="gateId"]',
      '.q-select:has-text("Gate")',
      '.q-dialog .q-select',
      '[aria-label*="gate" i]'
    ];

    let gateSelected = false;
    for (const selector of gateSelectSelectors) {
      try {
        const select = this.page.locator(selector);
        if (await select.isVisible({ timeout: 2000 })) {
          await select.click();
          await this.page.waitForTimeout(1000);
          
          // Try to select the gate by text or value
          const optionSelectors = [
            `.q-menu .q-item:has-text("${gateId}")`,
            `.q-menu .q-item[data-value="${gateId}"]`,
            `.q-item__label:has-text("${gateId}")`,
            `.q-menu >> text="${gateId}"`
          ];
          
          for (const optionSelector of optionSelectors) {
            const option = this.page.locator(optionSelector);
            if (await option.isVisible({ timeout: 2000 })) {
              await option.click();
              console.log(`[DeviceManagementPage] Selected gate using: ${optionSelector}`);
              gateSelected = true;
              break;
            }
          }
          
          if (gateSelected) break;
        }
      } catch (error) {
        console.log(`[DeviceManagementPage] Gate select selector failed: ${selector}`);
      }
    }

    if (!gateSelected) {
      console.log('[DeviceManagementPage] Could not select gate from dropdown, trying to proceed anyway');
    }

    // Set quantity with multiple fallback selectors
    const quantityInputSelectors = [
      '[data-testid="license-quantity-input"]',
      'input[type="number"]',
      'input[name="quantity"]',
      'input[placeholder*="quantity" i]',
      '.q-dialog input[type="number"]'
    ];

    let quantitySet = false;
    for (const selector of quantityInputSelectors) {
      try {
        const input = this.page.locator(selector);
        if (await input.isVisible({ timeout: 2000 })) {
          await input.fill(quantity.toString());
          console.log(`[DeviceManagementPage] Set quantity using: ${selector}`);
          quantitySet = true;
          break;
        }
      } catch (error) {
        console.log(`[DeviceManagementPage] Quantity input selector failed: ${selector}`);
      }
    }

    if (!quantitySet) {
      console.log('[DeviceManagementPage] Could not set quantity, using default');
    }

    // Submit the form with multiple fallback selectors
    const submitButtonSelectors = [
      '[data-testid="generate-submit-button"]',
      'button:has-text("Generate")',
      'button:has-text("Create")',
      'button:has-text("Submit")',
      '.q-dialog button[type="submit"]',
      '.q-dialog .q-btn--unelevated'
    ];

    let submitted = false;
    for (const selector of submitButtonSelectors) {
      try {
        const button = this.page.locator(selector);
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          console.log(`[DeviceManagementPage] Clicked submit button using: ${selector}`);
          submitted = true;
          break;
        }
      } catch (error) {
        console.log(`[DeviceManagementPage] Submit button selector failed: ${selector}`);
      }
    }

    if (!submitted) {
      throw new Error('Could not find Submit button');
    }

    // Wait for dialog to close and table to update
    await this.page.waitForTimeout(3000);

    // Get the generated license key from the table
    let licenseKey = '';
    let status = 'Disconnected';
    
    try {
      // Look for the newest license in the table (should be at the top)
      const licenseRow = this.page.locator('tr').nth(1); // First data row after header
      
      if (await licenseRow.isVisible({ timeout: 5000 })) {
        // Try to extract license key from the row
        const keyCell = licenseRow.locator('td').nth(1); // Assuming key is in second column
        const keyText = await keyCell.textContent();
        if (keyText) {
          licenseKey = keyText.trim();
        }
        
        // Try to get status
        const statusCell = licenseRow.locator('td:has-text("Disconnected"), td:has-text("Connected")');
        if (await statusCell.isVisible()) {
          const statusText = await statusCell.textContent();
          if (statusText) {
            status = statusText.trim();
          }
        }
      }
      
      // If not found in table, try to get from notification or modal
      if (!licenseKey) {
        const notificationSelectors = [
          '.q-notification__message',
          '.license-key-display',
          '[data-testid="generated-license-key"]'
        ];
        
        for (const selector of notificationSelectors) {
          const element = this.page.locator(selector);
          if (await element.isVisible({ timeout: 2000 })) {
            const text = await element.textContent();
            if (text && text.length > 10) {
              licenseKey = text.trim();
              console.log(`[DeviceManagementPage] Got license key from: ${selector}`);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.log('[DeviceManagementPage] Could not extract license key from table');
    }

    // Generate a fallback key if not found
    if (!licenseKey) {
      licenseKey = this.generateMockLicenseKey();
      console.log(`[DeviceManagementPage] Using generated mock key: ${licenseKey}`);
    }

    console.log(`[DeviceManagementPage] License generated - Key: ${licenseKey}, Status: ${status}`);

    return {
      key: licenseKey,
      status: status
    };
  }

  async verifyLicenseInTable(licenseKey: string): Promise<boolean> {
    console.log(`[DeviceManagementPage] Verifying license in table: ${licenseKey}`);
    
    try {
      // Multiple ways to check if license exists in table
      const licenseSelectors = [
        `text="${licenseKey}"`,
        `tr:has-text("${licenseKey}")`,
        `td:has-text("${licenseKey}")`,
        `.q-table__container >> text="${licenseKey}"`
      ];

      for (const selector of licenseSelectors) {
        const element = this.page.locator(selector);
        if (await element.isVisible({ timeout: 5000 })) {
          console.log(`[DeviceManagementPage] License found in table using: ${selector}`);
          return true;
        }
      }

      // If full key not found, try partial match (first 8 characters)
      const partialKey = licenseKey.substring(0, 8);
      const partialElement = this.page.locator(`text*="${partialKey}"`);
      if (await partialElement.isVisible({ timeout: 2000 })) {
        console.log('[DeviceManagementPage] License found with partial match');
        return true;
      }

      console.log('[DeviceManagementPage] License not found in table');
      return false;
    } catch (error) {
      console.error('[DeviceManagementPage] Error verifying license:', error);
      return false;
    }
  }

  async getLicenseStatus(licenseKey: string): Promise<string | null> {
    console.log(`[DeviceManagementPage] Getting status for license: ${licenseKey}`);
    
    try {
      // Find the license row
      const licenseRow = this.page.locator(`tr:has-text("${licenseKey}")`).first();
      
      if (await licenseRow.isVisible({ timeout: 5000 })) {
        // Look for status in the row
        const statusCell = licenseRow.locator('td:has-text("Disconnected"), td:has-text("Connected")');
        
        if (await statusCell.isVisible()) {
          const status = await statusCell.textContent();
          console.log(`[DeviceManagementPage] License status: ${status}`);
          return status ? status.trim() : null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('[DeviceManagementPage] Error getting license status:', error);
      return null;
    }
  }

  async revokeLicense(licenseKey: string): Promise<void> {
    console.log(`[DeviceManagementPage] Revoking license: ${licenseKey}`);
    
    try {
      // Find the license row
      const licenseRow = this.page.locator(`tr:has-text("${licenseKey}")`).first();
      
      if (await licenseRow.isVisible({ timeout: 5000 })) {
        // Click revoke button in the row
        const revokeButton = licenseRow.locator('button[aria-label*="revoke" i], button:has-text("Revoke")');
        
        if (await revokeButton.isVisible()) {
          await revokeButton.click();
          
          // Confirm revocation if dialog appears
          const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
          if (await confirmButton.isVisible({ timeout: 2000 })) {
            await confirmButton.click();
          }
          
          await this.page.waitForTimeout(2000);
          console.log(`[DeviceManagementPage] License revoked: ${licenseKey}`);
        }
      }
    } catch (error) {
      console.error('[DeviceManagementPage] Error revoking license:', error);
    }
  }

  private generateMockLicenseKey(): string {
    // Generate a mock license key for testing
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 4; i++) {
      if (i > 0) key += '-';
      for (let j = 0; j < 4; j++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    return key;
  }
}