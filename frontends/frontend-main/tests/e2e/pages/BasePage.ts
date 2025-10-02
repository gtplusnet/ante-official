import { Page, Locator, expect } from '@playwright/test';
import { WaitHelper } from '../helpers/wait.helper';
import { TEST_CONFIG } from '../config/test.config';

export abstract class BasePage {
  protected waitHelper: WaitHelper;
  
  constructor(protected page: Page) {
    this.waitHelper = new WaitHelper(page);
  }

  /**
   * Navigate to a specific URL
   */
  async navigateTo(url: string): Promise<void> {
    console.log(`🧭 Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded' }); // Don't wait for everything
    console.log(`✅ Navigation to ${url} completed`);
  }

  /**
   * Click element with proper waiting
   */
  async clickElement(selector: string | Locator, options?: { timeout?: number; force?: boolean }): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    
    console.log(`👆 Clicking element: ${typeof selector === 'string' ? selector : 'locator'}`);
    
    // Wait for element to be ready
    await this.waitHelper.waitForElementToBeReady(locator, options?.timeout);
    
    // Click with optional force
    await locator.click({ force: options?.force });
    
    // No artificial wait - proceed immediately
    
    console.log(`✅ Click completed`);
  }

  /**
   * Fill input field with proper waiting and clearing
   */
  async fillInput(selector: string | Locator, value: string, options?: { timeout?: number; clear?: boolean }): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    
    console.log(`📝 Filling input: ${typeof selector === 'string' ? selector : 'locator'} with value: ${value}`);
    
    // Wait for element to be ready
    await this.waitHelper.waitForElementToBeReady(locator, options?.timeout);
    
    // Clear if needed (default true)
    if (options?.clear !== false) {
      await locator.clear();
    }
    
    // Fill the value
    await locator.fill(value);
    
    // Quick verification without retry delays
    const inputValue = await locator.inputValue();
    if (inputValue !== value) {
      console.log(`⚠️ Value mismatch: expected "${value}", got "${inputValue}". Retrying once...`);
      await locator.clear();
      await locator.fill(value);
    }
    
    console.log(`✅ Input filled successfully`);
  }

  /**
   * Select from dropdown with waiting
   */
  async selectFromDropdown(selector: string | Locator, value: string, options?: { timeout?: number }): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    
    console.log(`🎯 Selecting from dropdown: ${typeof selector === 'string' ? selector : 'locator'} with value: ${value}`);
    
    await this.waitHelper.waitForElementToBeReady(locator, options?.timeout);
    await locator.selectOption(value);
    
    console.log(`✅ Dropdown selection completed`);
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string | Locator, timeout = TEST_CONFIG.TIMEOUT.MEDIUM): Promise<Locator> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: 'visible', timeout });
    return locator;
  }

  /**
   * Check if element exists and is visible
   */
  async isElementVisible(selector: string | Locator, timeout = 1000): Promise<boolean> {
    try {
      const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for text to appear on page
   */
  async waitForText(text: string, timeout = TEST_CONFIG.TIMEOUT.MEDIUM): Promise<void> {
    console.log(`⏳ Waiting for text: "${text}"`);
    await this.waitHelper.waitForTextContent(text, timeout);
    console.log(`✅ Text found: "${text}"`);
  }

  /**
   * Take screenshot with custom name and step tracking
   */
  async takeScreenshot(name: string, stepNumber?: number): Promise<void> {
    const stepPrefix = stepNumber ? `step-${stepNumber.toString().padStart(2, '0')}-` : '';
    const filename = `${stepPrefix}${name}.png`;
    
    // Ensure screenshots directory exists
    await this.page.screenshot({ 
      path: `screenshots/${filename}`, 
      fullPage: true 
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
  }

  /**
   * Take screenshot with step context and descriptive naming
   */
  async takeStepScreenshot(stepName: string, action: string, stepNumber?: number): Promise<void> {
    const cleanStepName = stepName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const cleanAction = action.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const name = `${cleanStepName}-${cleanAction}`;
    await this.takeScreenshot(name, stepNumber);
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingToComplete(): Promise<void> {
    console.log('⏳ Waiting for loading to complete...');
    // Skip heavy loading checks - just a quick network idle check
    try {
      await this.waitHelper.waitForNetworkIdle();
    } catch {
      // If network idle fails, just continue
    }
    console.log('✅ Loading completed');
  }

  /**
   * Assert page title
   */
  async assertPageTitle(expectedTitle: string): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle);
    console.log(`✅ Page title verified: ${expectedTitle}`);
  }

  /**
   * Assert URL contains
   */
  async assertUrlContains(urlFragment: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(urlFragment));
    console.log(`✅ URL contains: ${urlFragment}`);
  }

  /**
   * Assert element contains text
   */
  async assertElementContainsText(selector: string | Locator, text: string): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await expect(locator).toContainText(text);
    console.log(`✅ Element contains text: ${text}`);
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Reload page
   */
  async reloadPage(): Promise<void> {
    console.log('🔄 Reloading page...');
    await this.page.reload();
    await this.waitHelper.waitForPageNavigation();
    console.log('✅ Page reloaded');
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    console.log('⬅️ Going back...');
    await this.page.goBack();
    await this.waitHelper.waitForPageNavigation();
    console.log('✅ Navigated back');
  }

  /**
   * Scroll element into view
   */
  async scrollToElement(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.scrollIntoViewIfNeeded();
    console.log('📜 Scrolled to element');
  }

  /**
   * Hover over element
   */
  async hoverElement(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await this.waitHelper.waitForElementToBeReady(locator);
    await locator.hover();
    console.log('🔄 Hovered over element');
  }
}