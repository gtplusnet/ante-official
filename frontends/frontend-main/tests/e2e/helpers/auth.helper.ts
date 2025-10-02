import { Page } from '@playwright/test';
import { TEST_CONFIG } from '../config/test.config';
import { TestUser } from '../fixtures/test-data';
import { WaitHelper } from './wait.helper';

export class AuthHelper {
  private waitHelper: WaitHelper;

  constructor(private page: Page) {
    this.waitHelper = new WaitHelper(page);
  }

  /**
   * Perform login with username and password
   */
  async login(user: TestUser): Promise<void> {
    console.log('🔐 Starting login process...');
    
    // Navigate to login page
    await this.page.goto(TEST_CONFIG.LOGIN_URL);
    await this.waitHelper.waitForPageNavigation();
    
    console.log('📍 Navigated to login page');
    
    // Wait for page to be fully loaded
    await this.waitHelper.waitForQuasarLoading();
    await this.page.waitForTimeout(1000); // Extra wait for any animations
    
    // Check if we need to click "Continue with Username" for manual login
    const manualLoginButton = this.page.locator(TEST_CONFIG.SELECTORS.LOGIN.MANUAL_LOGIN_BUTTON);
    const isManualLoginVisible = await manualLoginButton.isVisible().catch(() => false);
    
    if (isManualLoginVisible) {
      console.log('👆 Clicking manual login button...');
      await manualLoginButton.click();
      await this.page.waitForTimeout(500);
    }
    
    // Wait for login form to be ready
    console.log('⏳ Waiting for login form...');
    
    // Try primary selector first, then fallback
    let usernameInput;
    try {
      usernameInput = await this.waitHelper.waitForElementToBeReady(
        TEST_CONFIG.SELECTORS.LOGIN.USERNAME_INPUT,
        5000
      );
    } catch {
      // Fallback to finding input by label or placeholder
      console.log('🔄 Using fallback selector for username input...');
      usernameInput = this.page.locator('input[placeholder*="username"], input[placeholder*="email"]').first();
      await this.waitHelper.waitForElementToBeReady(usernameInput);
    }
    
    // Fill username
    console.log(`📝 Filling username: ${user.username}`);
    await usernameInput.clear();
    await usernameInput.fill(user.username);
    
    // Fill password
    let passwordInput;
    try {
      passwordInput = await this.waitHelper.waitForElementToBeReady(
        TEST_CONFIG.SELECTORS.LOGIN.PASSWORD_INPUT,
        5000
      );
    } catch {
      // Fallback to finding password input
      console.log('🔄 Using fallback selector for password input...');
      passwordInput = this.page.locator('input[type="password"]').first();
      await this.waitHelper.waitForElementToBeReady(passwordInput);
    }
    
    console.log('🔒 Filling password...');
    await passwordInput.clear();
    await passwordInput.fill(user.password);
    
    // Submit the form
    console.log('🚀 Submitting login form...');
    let submitButton;
    try {
      submitButton = await this.waitHelper.waitForElementToBeReady(
        TEST_CONFIG.SELECTORS.LOGIN.SUBMIT_BUTTON,
        5000
      );
    } catch {
      // Fallback to finding submit button
      console.log('🔄 Using fallback selector for submit button...');
      submitButton = this.page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
      await this.waitHelper.waitForElementToBeReady(submitButton);
    }
    
    await submitButton.click();
    
    // Wait for login to complete and redirect
    console.log('⏳ Waiting for login to complete...');
    await this.waitForLoginSuccess();
    
    console.log('✅ Login successful!');
  }

  /**
   * Wait for login success and navigation to dashboard
   */
  private async waitForLoginSuccess(): Promise<void> {
    // Wait for either dashboard URL or any member area
    try {
      await this.page.waitForURL('**/member/**', { 
        timeout: TEST_CONFIG.TIMEOUT.NAVIGATION 
      });
    } catch {
      // Alternative: wait for URL change from login
      await this.page.waitForFunction(
        () => !window.location.href.includes('/signin'),
        { timeout: TEST_CONFIG.TIMEOUT.NAVIGATION }
      );
    }
    
    // Wait for the page to be fully loaded
    await this.waitHelper.waitForPageNavigation();
    await this.waitHelper.waitForQuasarLoading();
    
    // Additional wait for dashboard widgets to load
    await this.page.waitForTimeout(2000);
  }

  /**
   * Check if user is already logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const currentUrl = this.page.url();
      return currentUrl.includes('/member/');
    } catch {
      return false;
    }
  }

  /**
   * Logout if logged in
   */
  async logout(): Promise<void> {
    if (await this.isLoggedIn()) {
      console.log('🚪 Logging out...');
      
      // Look for logout button - this may vary based on your UI
      const logoutSelectors = [
        '[data-testid="logout-button"]',
        'button:has-text("Logout")',
        'button:has-text("Sign Out")',
        '.q-btn:has-text("Logout")'
      ];
      
      for (const selector of logoutSelectors) {
        try {
          const logoutButton = this.page.locator(selector);
          if (await logoutButton.isVisible({ timeout: 1000 })) {
            await logoutButton.click();
            await this.waitHelper.waitForPageNavigation();
            console.log('✅ Logout successful!');
            return;
          }
        } catch {
          // Try next selector
          continue;
        }
      }
      
      // Fallback: clear storage and reload
      console.log('🔄 Using fallback logout method...');
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await this.page.reload();
      await this.waitHelper.waitForPageNavigation();
    }
  }

  /**
   * Get current user info from the page if available
   */
  async getCurrentUserInfo(): Promise<any> {
    return await this.page.evaluate(() => {
      // Try to get user info from various common sources
      const sources = [
        () => (window as any).user,
        () => (window as any).currentUser,
        () => (window as any).authStore?.user,
        () => JSON.parse(localStorage.getItem('user') || '{}'),
        () => JSON.parse(localStorage.getItem('currentUser') || '{}'),
      ];
      
      for (const source of sources) {
        try {
          const user = source();
          if (user && typeof user === 'object' && Object.keys(user).length > 0) {
            return user;
          }
        } catch {
          // Try next source
        }
      }
      
      return null;
    });
  }
}