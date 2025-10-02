import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';
import { TestGuardian } from '../../fixtures/student-management-test-data';

export class GuardianLoginPage extends BasePage {
  // Locators
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly forgotPasswordLink: Locator;
  private readonly errorMessage: Locator;
  private readonly loadingIndicator: Locator;
  private readonly rememberMeCheckbox: Locator;
  private readonly signUpLink: Locator;

  // Form validation locators
  private readonly emailError: Locator;
  private readonly passwordError: Locator;
  private readonly formError: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators based on actual Guardian app HTML structure
    this.emailInput = page.locator('input[type="email"][placeholder="Email Address"]');
    this.passwordInput = page.locator('input[type="password"][placeholder="Password"]');
    this.loginButton = page.locator('button[type="submit"]:has-text("Sign In")');
    this.forgotPasswordLink = page.locator('a:has-text("Forgot Password"), a:has-text("Reset Password")');
    this.errorMessage = page.locator('.error-message, .alert-error, [role="alert"], .text-red-500, .text-danger');
    this.loadingIndicator = page.locator('.animate-spin, .loading, .spinner, [data-testid="loading"]');
    this.rememberMeCheckbox = page.locator('input[type="checkbox"][name*="remember"], input[type="checkbox"]:has-text("Remember")');
    this.signUpLink = page.locator('a[href="/register/"]:has-text("Register Now")');

    // Form validation
    this.emailError = page.locator('.email-error, [data-testid="email-error"], input[name="email"] ~ .error');
    this.passwordError = page.locator('.password-error, [data-testid="password-error"], input[name="password"] ~ .error');
    this.formError = page.locator('.form-error, .login-error, [data-testid="login-error"]');
  }

  /**
   * Navigate to Guardian App login page
   */
  async navigateToLogin(): Promise<void> {
    console.log('🧭 Navigating to Guardian App login...');
    await this.navigateTo('/login');
    await this.waitForLoadingToComplete();
    await this.waitForElement(this.emailInput);
    console.log('✅ Guardian login page loaded');
  }

  /**
   * Perform login with guardian credentials
   */
  async login(guardianData: TestGuardian): Promise<void> {
    console.log(`🔐 Logging in as guardian: ${guardianData.email}`);
    
    // Ensure we're on the login page
    if (!this.page.url().includes('/login')) {
      await this.navigateToLogin();
    }

    // Wait for page to load and form to be ready
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000); // Wait for Next.js app to initialize

    // Wait for form elements to be visible and enabled
    await this.waitForElement(this.emailInput);
    await this.waitForElement(this.passwordInput);
    await this.waitForElement(this.loginButton);

    // Clear any existing values and fill credentials
    await this.fillInput(this.emailInput, guardianData.email);
    await this.fillInput(this.passwordInput, guardianData.password || 'TestPassword123!');

    await this.takeStepScreenshot('guardian-login', 'credentials-filled');

    // Wait for loading state to clear before submitting
    const loadingSpinner = this.page.locator('.animate-spin');
    if (await loadingSpinner.isVisible({ timeout: 1000 })) {
      await loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
    }

    // Ensure button is enabled before clicking
    await this.page.waitForFunction(() => {
      const button = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      return button && !button.disabled;
    }, { timeout: 10000 });

    // Submit login form
    await this.clickElement(this.loginButton);

    // Wait for login to complete (either redirect to dashboard or show error)
    try {
      // Wait for successful redirect to dashboard (with trailing slash)
      await this.page.waitForURL('**/dashboard/**', { timeout: 20000 });
      console.log('✅ Guardian login successful');
      await this.takeStepScreenshot('guardian-login', 'login-success');
    } catch (error) {
      // Check if there's an error message
      const hasError = await this.isElementVisible(this.errorMessage, 5000);
      if (hasError) {
        const errorText = await this.errorMessage.textContent();
        await this.takeStepScreenshot('guardian-login', 'login-error');
        throw new Error(`Guardian login failed: ${errorText}`);
      }
      
      // Check if still on login page
      if (this.page.url().includes('/login')) {
        await this.takeStepScreenshot('guardian-login', 'login-failed');
        const pageContent = await this.page.locator('body').textContent();
        console.log('Login page content:', pageContent?.substring(0, 500));
        throw new Error('Guardian login failed - still on login page');
      }
      
      // Log current URL for debugging
      console.log('Current URL after login attempt:', this.page.url());
      await this.takeStepScreenshot('guardian-login', 'unknown-state');
      throw error;
    }
  }

  /**
   * Perform login with invalid credentials (for error testing)
   */
  async loginWithInvalidCredentials(email: string, password: string): Promise<string | null> {
    console.log(`🔐 Attempting login with invalid credentials: ${email}`);
    
    await this.navigateToLogin();
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);
    await this.clickElement(this.loginButton);

    // Wait for error message to appear
    try {
      await this.waitForElement(this.errorMessage, 10000);
      const errorText = await this.errorMessage.textContent();
      console.log(`❌ Login error: ${errorText}`);
      await this.takeStepScreenshot('guardian-login', 'invalid-credentials-error');
      return errorText || 'Unknown error';
    } catch (error) {
      console.log('❌ No error message found');
      await this.takeStepScreenshot('guardian-login', 'no-error-message');
      return null;
    }
  }

  /**
   * Check if already logged in
   */
  async isLoggedIn(): Promise<boolean> {
    console.log('🔍 Checking if guardian is already logged in...');
    
    // Try to navigate to dashboard
    try {
      await this.navigateTo('/dashboard');
      await this.page.waitForLoadState('domcontentloaded');
      
      // If we're on dashboard and not redirected to login, user is logged in
      if (!this.page.url().includes('/login')) {
        console.log('✅ Guardian is already logged in');
        return true;
      }
    } catch (error) {
      console.log('❌ Error checking login status:', error);
    }
    
    console.log('❌ Guardian is not logged in');
    return false;
  }

  /**
   * Logout guardian
   */
  async logout(): Promise<void> {
    console.log('🚪 Logging out guardian...');
    
    // Look for logout button/link (common patterns)
    const logoutSelector = 'button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out"), [data-testid="logout"]';
    const logoutElement = this.page.locator(logoutSelector);
    
    if (await logoutElement.isVisible({ timeout: 3000 })) {
      await this.clickElement(logoutElement);
      
      // Wait for redirect to login page
      await this.page.waitForURL('**/login', { timeout: 10000 });
      console.log('✅ Guardian logged out successfully');
    } else {
      // Alternative: clear local storage/cookies and navigate to login
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await this.navigateToLogin();
      console.log('✅ Guardian session cleared');
    }
    
    await this.takeStepScreenshot('guardian-login', 'logged-out');
  }

  /**
   * Wait for login form to be ready
   */
  async waitForLoginForm(): Promise<void> {
    console.log('⏳ Waiting for login form to be ready...');
    await this.waitForElement(this.emailInput);
    await this.waitForElement(this.passwordInput);
    await this.waitForElement(this.loginButton);
    
    // Ensure form is not disabled
    await this.page.waitForFunction(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"], input[name="password"]') as HTMLInputElement;
      const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      
      return emailInput && !emailInput.disabled && 
             passwordInput && !passwordInput.disabled && 
             submitButton && !submitButton.disabled;
    }, { timeout: 10000 });
    
    console.log('✅ Login form is ready');
  }

  /**
   * Validate form fields (check for validation errors)
   */
  async validateForm(): Promise<{ emailError?: string, passwordError?: string, formError?: string }> {
    console.log('🔍 Validating login form...');
    
    const validation: { emailError?: string, passwordError?: string, formError?: string } = {};
    
    // Check for email validation error
    if (await this.isElementVisible(this.emailError, 1000)) {
      validation.emailError = await this.emailError.textContent() || 'Email validation error';
    }
    
    // Check for password validation error
    if (await this.isElementVisible(this.passwordError, 1000)) {
      validation.passwordError = await this.passwordError.textContent() || 'Password validation error';
    }
    
    // Check for general form error
    if (await this.isElementVisible(this.formError, 1000)) {
      validation.formError = await this.formError.textContent() || 'Form validation error';
    }
    
    console.log('📝 Form validation result:', validation);
    return validation;
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword(): Promise<void> {
    console.log('🔗 Clicking forgot password link...');
    await this.clickElement(this.forgotPasswordLink);
    await this.waitForLoadingToComplete();
    console.log('✅ Forgot password link clicked');
  }

  /**
   * Toggle remember me checkbox
   */
  async toggleRememberMe(checked: boolean = true): Promise<void> {
    console.log(`☑️ Setting remember me to: ${checked}`);
    
    if (await this.rememberMeCheckbox.isVisible({ timeout: 3000 })) {
      const isCurrentlyChecked = await this.rememberMeCheckbox.isChecked();
      
      if (isCurrentlyChecked !== checked) {
        await this.clickElement(this.rememberMeCheckbox);
      }
      
      console.log('✅ Remember me checkbox updated');
    } else {
      console.log('ℹ️ Remember me checkbox not found');
    }
  }

  /**
   * Click sign up link (if available)
   */
  async clickSignUp(): Promise<void> {
    console.log('🔗 Clicking sign up link...');
    
    if (await this.signUpLink.isVisible({ timeout: 3000 })) {
      await this.clickElement(this.signUpLink);
      await this.waitForLoadingToComplete();
      console.log('✅ Sign up link clicked');
    } else {
      console.log('ℹ️ Sign up link not found');
    }
  }

  /**
   * Check if login is in progress (loading state)
   */
  async isLoginInProgress(): Promise<boolean> {
    const isLoading = await this.isElementVisible(this.loadingIndicator, 1000);
    const isButtonDisabled = await this.page.locator('button[type="submit"][disabled]').isVisible({ timeout: 1000 });
    
    return isLoading || isButtonDisabled;
  }

  /**
   * Wait for login to complete
   */
  async waitForLoginToComplete(timeout: number = 15000): Promise<void> {
    console.log('⏳ Waiting for login to complete...');
    
    // Wait for loading to disappear
    if (await this.isElementVisible(this.loadingIndicator, 1000)) {
      await this.loadingIndicator.waitFor({ state: 'hidden', timeout });
    }
    
    // Wait for page navigation or form to become enabled again
    await this.page.waitForFunction(() => {
      const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      return !submitButton?.disabled;
    }, { timeout });
    
    console.log('✅ Login process completed');
  }

  /**
   * Get current page title
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Check if specific error message is displayed
   */
  async hasErrorMessage(expectedError: string): Promise<boolean> {
    if (await this.isElementVisible(this.errorMessage, 3000)) {
      const errorText = await this.errorMessage.textContent() || '';
      return errorText.toLowerCase().includes(expectedError.toLowerCase());
    }
    return false;
  }
}