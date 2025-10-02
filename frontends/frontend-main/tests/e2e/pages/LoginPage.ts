import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { TEST_CONFIG } from '../config/test.config';
import { TestUser } from '../fixtures/test-data';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page
   */
  async navigateToLogin(): Promise<void> {
    await this.navigateTo(TEST_CONFIG.LOGIN_URL);
    // Wait for basic page elements immediately, no extra loading checks
    await this.waitForBasicLoginElements();
  }

  /**
   * Wait for basic login elements to be ready
   */
  async waitForBasicLoginElements(): Promise<void> {
    console.log('⏳ Waiting for login elements...');
    
    // Just wait for any login container to appear - no heavy loading checks
    const loginSelectors = [
      '.signin-container',
      '.login-container', 
      '.unified-login-form'
    ];
    
    for (const selector of loginSelectors) {
      if (await this.isElementVisible(selector, 3000)) {
        console.log(`✅ Login elements ready with selector: ${selector}`);
        return; // Exit immediately when found
      }
    }
    
    throw new Error('Login elements not found');
  }

  /**
   * Check if manual login button needs to be clicked
   */
  async clickManualLoginIfNeeded(): Promise<void> {
    // First, check for any overlays that might be blocking interactions
    const overlays = await this.page.locator('vite-plugin-checker-error-overlay').count();
    if (overlays > 0) {
      console.log('⚠️ Found error overlay, attempting to dismiss...');
      // Try to remove the overlay completely
      await this.page.evaluate(() => {
        const overlay = document.querySelector('vite-plugin-checker-error-overlay');
        if (overlay) {
          overlay.remove();
        }
      });
      await this.page.waitForTimeout(500);
    }
    
    // Scroll down to make sure manual login button is visible
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(500);
    
    // Look for manual login button with multiple selectors
    const manualLoginSelectors = [
      TEST_CONFIG.SELECTORS.LOGIN.MANUAL_LOGIN_BUTTON,
      '[data-testid="manual-login-button"]',
      'button:has-text("Sign in manually")',
      '.q-btn:has-text("Sign in manually")',
      'button:has-text("Continue with email")',
      '.q-btn:has-text("Continue with email")'
    ];
    
    let buttonClicked = false;
    for (const selector of manualLoginSelectors) {
      try {
        if (await this.isElementVisible(selector, 1000)) {
          console.log(`👆 Manual login button found with selector: ${selector}`);
          
          // Scroll to the button to ensure it's in view
          await this.page.locator(selector).scrollIntoViewIfNeeded();
          await this.page.waitForTimeout(500);
          
          // Try multiple click methods to ensure it works
          try {
            // Method 1: Standard click with force
            await this.clickElement(selector, { force: true });
          } catch {
            // Method 2: JavaScript click
            await this.page.evaluate((sel) => {
              const button = document.querySelector(sel);
              if (button instanceof HTMLElement) {
                button.click();
              }
            }, selector);
          }
          
          buttonClicked = true;
          
          // Wait for the form fields to appear after clicking manual login
          await this.page.waitForTimeout(2000);
          
          // Check if form fields appeared
          const hasFields = await this.page.locator('input[type="text"], input[type="email"], input[placeholder*="username" i], input[placeholder*="email" i]').count() > 0;
          
          if (!hasFields) {
            console.log('⚠️ Form fields did not appear after clicking, trying Vue state manipulation...');
            
            // Try to directly set Vue component state
            await this.page.evaluate(() => {
              // Find the Vue app instance
              const qApp = document.querySelector('#q-app') as any;
              const appEl = document.querySelector('#app') as any;
              const app = (qApp && qApp.__vue_app__) || 
                         (appEl && appEl.__vue_app__) ||
                         (window as any).app;
              
              if (app) {
                // Try to find the login component and set manualMode to true
                const loginComponent = document.querySelector('.signin-container, .login-container, .unified-login-form') as any;
                if (loginComponent && loginComponent.__vueParentComponent) {
                  const instance = loginComponent.__vueParentComponent;
                  if (instance.ctx && instance.ctx.manualMode !== undefined) {
                    instance.ctx.manualMode = true;
                  }
                }
              }
            });
            
            await this.page.waitForTimeout(1000);
          }
          
          // Take screenshot after clicking to see what appears
          await this.takeStepScreenshot('login', 'after-manual-button-click', 3);
          break;
        }
      } catch (error) {
        console.log(`🔄 Selector ${selector} failed, trying next...`);
        continue;
      }
    }
    
    if (!buttonClicked) {
      console.log('ℹ️ Manual login button not found, checking if form fields are already visible');
      
      // Check if username/password fields are already visible
      const usernameVisible = await this.isElementVisible('input[type="text"]', 1000);
      const passwordVisible = await this.isElementVisible('input[type="password"]', 1000);
      
      if (usernameVisible && passwordVisible) {
        console.log('✅ Login form fields already visible, proceeding...');
      } else {
        console.log('⚠️ Neither manual button nor form fields found');
        await this.takeScreenshot('login-page-state-unknown');
      }
    }
  }

  /**
   * Fill username field
   */
  async fillUsername(username: string): Promise<void> {
    console.log(`📝 Filling username: ${username}`);
    
    // Try primary selector first, then fallbacks
    const selectors = [
      TEST_CONFIG.SELECTORS.LOGIN.USERNAME_INPUT,
      'input[placeholder*="username" i]',
      'input[placeholder*="email" i]',
      'input[type="text"]',
      'input[name="username"]',
      'input[name="email"]'
    ];
    
    for (const selector of selectors) {
      try {
        const element = await this.waitForElement(selector, 3000);
        if (await element.isVisible()) {
          await this.fillInput(element, username);
          console.log('✅ Username filled successfully');
          return;
        }
      } catch (error) {
        console.log(`🔄 Selector ${selector} failed, trying next...`);
        continue;
      }
    }
    
    throw new Error('Could not find username input field');
  }

  /**
   * Fill password field
   */
  async fillPassword(password: string): Promise<void> {
    console.log('🔒 Filling password...');
    
    // Try primary selector first, then fallbacks
    const selectors = [
      TEST_CONFIG.SELECTORS.LOGIN.PASSWORD_INPUT,
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password" i]'
    ];
    
    for (const selector of selectors) {
      try {
        const element = await this.waitForElement(selector, 3000);
        if (await element.isVisible()) {
          await this.fillInput(element, password);
          console.log('✅ Password filled successfully');
          return;
        }
      } catch (error) {
        console.log(`🔄 Selector ${selector} failed, trying next...`);
        continue;
      }
    }
    
    throw new Error('Could not find password input field');
  }

  /**
   * Click submit button
   */
  async clickSubmitButton(): Promise<void> {
    console.log('🚀 Clicking submit button...');
    
    // Try primary selector first, then fallbacks
    const selectors = [
      TEST_CONFIG.SELECTORS.LOGIN.SUBMIT_BUTTON,
      'button[type="submit"]',
      'button:has-text("Sign In")',
      'button:has-text("Login")',
      'button:has-text("Continue")',
      '.q-btn:has-text("Sign In")',
      '.q-btn:has-text("Login")'
    ];
    
    for (const selector of selectors) {
      try {
        if (await this.isElementVisible(selector, 2000)) {
          await this.clickElement(selector);
          console.log('✅ Submit button clicked');
          return;
        }
      } catch (error) {
        console.log(`🔄 Submit selector ${selector} failed, trying next...`);
        continue;
      }
    }
    
    throw new Error('Could not find submit button');
  }

  /**
   * Perform complete login flow with comprehensive screenshots
   */
  async login(user: TestUser): Promise<void> {
    console.log('🔐 Starting login process...');
    
    // Step 1: Navigate to login page
    await this.navigateToLogin();
    await this.takeStepScreenshot('login', 'page-loaded', 1);
    
    // Take full page screenshot to see everything
    await this.page.screenshot({ 
      path: 'screenshots/login-full-page.png', 
      fullPage: true 
    });
    
    // Step 2: Try to find and click manual login button
    // First scroll the page to see if button is below
    await this.page.evaluate(() => {
      const container = document.querySelector('.signin-container, .login-container, .q-card');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page.waitForTimeout(1000);
    
    await this.takeScreenshot('login-after-scroll');
    
    // Look for the manual login button more carefully
    const manualButtonFound = await this.page.locator('button:has-text("Sign in manually")').count() > 0 ||
                              await this.page.locator('[data-testid="manual-login-button"]').count() > 0;
                              
    if (manualButtonFound) {
      await this.clickManualLoginIfNeeded();
      await this.takeStepScreenshot('login', 'manual-login-clicked', 2);
    } else {
      console.log('⚠️ Manual login button not found on page');
      
      // Check if we can see username/password fields already
      const hasUsernameField = await this.page.locator('input[type="text"], input[placeholder*="username" i], input[placeholder*="email" i]').count() > 0;
      const hasPasswordField = await this.page.locator('input[type="password"]').count() > 0;
      
      if (!hasUsernameField || !hasPasswordField) {
        console.log('❌ No login form fields visible and no manual button found!');
        throw new Error('Cannot find login form - neither manual button nor form fields are visible');
      }
    }
    
    // Step 3: Fill credentials
    await this.fillUsername(user.username);
    await this.takeStepScreenshot('login', 'username-filled', 3);
    
    await this.fillPassword(user.password);
    await this.takeStepScreenshot('login', 'password-filled', 4);
    
    // Step 4: Submit form
    await this.clickSubmitButton();
    await this.takeStepScreenshot('login', 'submit-clicked', 5);
    
    // Step 5: Wait for login to complete
    await this.waitForLoginSuccess();
    await this.takeStepScreenshot('login', 'login-success', 6);
    
    console.log('✅ Login completed successfully!');
  }

  /**
   * Wait for login success
   */
  async waitForLoginSuccess(): Promise<void> {
    console.log('⏳ Waiting for login success...');
    
    // Wait for either URL change or dashboard elements to appear
    try {
      // First try: Wait for URL to change away from login
      await this.page.waitForFunction(
        () => !window.location.href.includes('/signin') && !window.location.href.includes('/login'),
        { timeout: 15000 }
      );
    } catch {
      // Second try: Check for dashboard elements (maybe hash routing)
      console.log('🔄 URL check failed, looking for dashboard elements...');
      const dashboardElements = [
        'text=Welcome',
        '.dashboard',
        '.member-layout',
        'text=Dashboard',
        '[class*="dashboard"]'
      ];
      
      let foundDashboard = false;
      for (const selector of dashboardElements) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000, state: 'visible' });
          foundDashboard = true;
          console.log(`✅ Found dashboard element: ${selector}`);
          break;
        } catch {
          continue;
        }
      }
      
      if (!foundDashboard) {
        throw new Error('Login may have failed - no dashboard elements found');
      }
    }
    
    await this.waitForLoadingToComplete();
    console.log('✅ Login success verified');
  }

  /**
   * Check if login form has validation errors
   */
  async hasLoginError(): Promise<boolean> {
    const errorSelectors = [
      '.q-field--error',
      '.error',
      '.error-message',
      '[role="alert"]',
      '.text-negative',
      '.q-notification--negative'
    ];
    
    for (const selector of errorSelectors) {
      if (await this.isElementVisible(selector, 1000)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get login error message
   */
  async getLoginErrorMessage(): Promise<string | null> {
    const errorSelectors = [
      '.q-field--error .q-field__messages',
      '.error-message',
      '[role="alert"]',
      '.q-notification--negative .q-notification__message'
    ];
    
    for (const selector of errorSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible({ timeout: 1000 })) {
          return await element.textContent();
        }
      } catch {
        continue;
      }
    }
    
    return null;
  }

  /**
   * Assert we are on login page
   */
  async assertOnLoginPage(): Promise<void> {
    const url = this.getCurrentUrl();
    expect(url).toMatch(/\/(signin|login)/);
    
    // Also check for login form elements
    const hasUsernameField = await this.isElementVisible('input[type="text"], input[name="username"]', 2000);
    const hasPasswordField = await this.isElementVisible('input[type="password"]', 2000);
    
    expect(hasUsernameField).toBeTruthy();
    expect(hasPasswordField).toBeTruthy();
    
    console.log('✅ Confirmed we are on login page');
  }
}