import { Page, Locator } from '@playwright/test';

export class WaitHelper {
  constructor(private page: Page) {}

  /**
   * Wait for element to be visible and stable
   */
  async waitForElementToBeReady(selector: string | Locator, timeout = 10000): Promise<Locator> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    
    // Wait for element to be visible and enabled
    await locator.waitFor({ state: 'visible', timeout });
    
    // Quick stability check - just ensure element exists and is interactable
    await this.page.waitForTimeout(50); // Minimal wait for element to settle
    
    return locator;
  }

  /**
   * Wait for element to stop moving/animating
   */
  async waitForElementToBeStable(locator: Locator, timeout = 5000): Promise<void> {
    let previousBox = await locator.boundingBox();
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      await this.page.waitForTimeout(100);
      const currentBox = await locator.boundingBox();
      
      if (previousBox && currentBox) {
        const moved = Math.abs(previousBox.x - currentBox.x) > 1 || 
                     Math.abs(previousBox.y - currentBox.y) > 1;
        if (!moved) {
          return; // Element is stable
        }
      }
      
      previousBox = currentBox;
    }
  }

  /**
   * Wait for Quasar loading to complete
   */
  async waitForQuasarLoading(timeout = 30000): Promise<void> {
    try {
      // Wait for any Quasar loading spinners to disappear
      await this.page.waitForFunction(
        () => {
          const loadingElements = document.querySelectorAll('.q-loading, .q-spinner, .q-loading-bar');
          return loadingElements.length === 0 || 
                 Array.from(loadingElements).every(el => (el as HTMLElement).style.display === 'none');
        },
        { timeout: Math.min(timeout, 10000) } // Limit to 10 seconds max
      );
    } catch (error) {
      // If no loading elements are found or timeout, just continue
      console.log('⚠️ Quasar loading check timed out, continuing...');
    }
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetworkIdle(timeout = 3000): Promise<void> {
    try {
      await this.page.waitForLoadState('networkidle', { timeout });
    } catch {
      // If network idle times out, just continue
      console.log('⚠️ Network idle timeout, continuing...');
    }
  }

  /**
   * Wait for Vue component to be ready
   */
  async waitForVueComponent(selector: string, timeout = 10000): Promise<void> {
    await this.page.waitForFunction(
      (sel) => {
        const element = document.querySelector(sel);
        return element && (element as any).__vue_app__;
      },
      selector,
      { timeout }
    );
  }

  /**
   * Wait for dialog to be fully opened
   */
  async waitForDialogToOpen(dialogSelector = '.q-dialog', timeout = 10000): Promise<void> {
    // Wait for dialog to be present and visible
    await this.page.waitForSelector(dialogSelector, { state: 'visible', timeout });
    
    // Wait for any opening animations
    await this.page.waitForTimeout(500);
    
    // Ensure dialog is stable
    const dialog = this.page.locator(dialogSelector).first();
    await this.waitForElementToBeStable(dialog);
  }

  /**
   * Wait for page navigation to complete
   */
  async waitForPageNavigation(expectedUrl?: string, timeout = 30000): Promise<void> {
    if (expectedUrl) {
      await this.page.waitForURL(expectedUrl, { timeout });
    } else {
      await this.page.waitForLoadState('domcontentloaded', { timeout });
    }
    
    await this.waitForNetworkIdle();
    await this.waitForQuasarLoading();
  }

  /**
   * Soft wait - wait without throwing if timeout
   */
  async softWait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Wait for text content to appear
   */
  async waitForTextContent(text: string, timeout = 10000): Promise<void> {
    await this.page.waitForFunction(
      (searchText) => document.body.textContent?.includes(searchText) || false,
      text,
      { timeout }
    );
  }

  /**
   * Wait for element with retry mechanism
   */
  async waitForElementWithRetry(
    selector: string, 
    maxRetries = 3, 
    retryDelay = 1000
  ): Promise<Locator | null> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const element = await this.waitForElementToBeReady(selector);
        return element;
      } catch (error) {
        if (i === maxRetries - 1) {
          console.log(`Element ${selector} not found after ${maxRetries} retries`);
          return null;
        }
        await this.softWait(retryDelay);
      }
    }
    return null;
  }
}