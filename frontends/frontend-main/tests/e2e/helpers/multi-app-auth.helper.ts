import { Page, Browser, BrowserContext } from '@playwright/test';
import { APP_CONFIGS, TestGuardian } from '../fixtures/student-management-test-data';

export interface AppContext {
  page: Page;
  context: BrowserContext;
  appType: string;
  isAuthenticated: boolean;
  authToken?: string;
}

export class MultiAppAuthHelper {
  private appContexts: Map<string, AppContext> = new Map();
  private browser: Browser;

  constructor(browser: Browser) {
    this.browser = browser;
  }

  // Frontend Main Authentication (Token-based)
  async authenticateMainApp(): Promise<AppContext> {
    const appConfig = APP_CONFIGS.FRONTEND_MAIN;
    
    const context = await this.browser.newContext();
    const page = await context.newPage();

    console.log('[MultiAppAuth] Authenticating Frontend Main...');

    try {
      // Navigate to login
      await page.goto(appConfig.baseUrl + appConfig.loginPath);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000); // Wait for Vue app to fully initialize

      // Check if already logged in
      if (page.url().includes('/member/dashboard')) {
        console.log('[MultiAppAuth] Frontend Main already authenticated');
        const appContext: AppContext = {
          page,
          context,
          appType: 'FRONTEND_MAIN',
          isAuthenticated: true
        };
        this.appContexts.set('FRONTEND_MAIN', appContext);
        return appContext;
      }

      // Click manual login button if present (with fallback selectors)
      const manualLoginSelectors = [
        '[data-testid="manual-login-button"]',
        'button:has-text("Sign in manually")',
        '.q-btn:has-text("Sign in manually")',
        'button:has-text("Continue with email")',
        '.q-btn:has-text("Continue with email")'
      ];
      
      for (const selector of manualLoginSelectors) {
        console.log(`[MultiAppAuth] Checking selector: ${selector}`);
        try {
          const element = page.locator(selector);
          await element.waitFor({ state: 'visible', timeout: 5000 });
          
          console.log(`[MultiAppAuth] Found manual login button: ${selector}`);
          await element.click();
          await page.waitForTimeout(2000); // Wait for form fields to appear
          break;
        } catch (error) {
          console.log(`[MultiAppAuth] Selector ${selector} not found: ${error.message}`);
          continue;
        }
      }

      // Fill login form using fallback selectors like the working LoginPage
      const usernameSelectors = [
        '[data-testid="login-username-input"]',
        'input[placeholder*="username" i]',
        'input[placeholder*="email" i]',
        'input[type="text"]',
        'input[name="username"]',
        'input[name="email"]'
      ];
      
      let usernameFilled = false;
      for (const selector of usernameSelectors) {
        console.log(`[MultiAppAuth] Checking username selector: ${selector}`);
        try {
          const element = page.locator(selector);
          await element.waitFor({ state: 'visible', timeout: 5000 });
          
          console.log(`[MultiAppAuth] Found username field: ${selector}`);
          await element.fill(appConfig.credentials.username);
          usernameFilled = true;
          break;
        } catch (error) {
          console.log(`[MultiAppAuth] Username selector ${selector} not found: ${error.message}`);
          continue;
        }
      }
      
      const passwordSelectors = [
        '[data-testid="login-password-input"]',
        'input[type="password"]',
        'input[name="password"]',
        'input[placeholder*="password" i]'
      ];
      
      let passwordFilled = false;
      for (const selector of passwordSelectors) {
        console.log(`[MultiAppAuth] Checking password selector: ${selector}`);
        try {
          const element = page.locator(selector);
          await element.waitFor({ state: 'visible', timeout: 5000 });
          
          console.log(`[MultiAppAuth] Found password field: ${selector}`);
          await element.fill(appConfig.credentials.password);
          passwordFilled = true;
          break;
        } catch (error) {
          console.log(`[MultiAppAuth] Password selector ${selector} not found: ${error.message}`);
          continue;
        }
      }
      
      if (!usernameFilled || !passwordFilled) {
        throw new Error('Could not find login form fields');
      }
      
      // Submit login using fallback selectors
      const submitSelectors = [
        '[data-testid="login-submit-button"]',
        'button[type="submit"]',
        'button:has-text("Sign In")',
        'button:has-text("Login")',
        '.q-btn[type="submit"]'
      ];
      
      let submitClicked = false;
      for (const selector of submitSelectors) {
        console.log(`[MultiAppAuth] Checking submit selector: ${selector}`);
        try {
          const element = page.locator(selector);
          await element.waitFor({ state: 'visible', timeout: 5000 });
          
          console.log(`[MultiAppAuth] Found submit button: ${selector}`);
          await element.click();
          submitClicked = true;
          break;
        } catch (error) {
          console.log(`[MultiAppAuth] Submit selector ${selector} not found: ${error.message}`);
          continue;
        }
      }
      
      if (!submitClicked) {
        throw new Error('Could not find login submit button');
      }

      // Wait for dashboard navigation
      await page.waitForURL('**/member/dashboard', { timeout: 30000 });

      // Extract token from localStorage if available
      const token = await page.evaluate(() => localStorage.getItem('token'));

      console.log('[MultiAppAuth] Frontend Main authenticated successfully');

      const appContext: AppContext = {
        page,
        context,
        appType: 'FRONTEND_MAIN',
        isAuthenticated: true,
        authToken: token || undefined
      };

      this.appContexts.set('FRONTEND_MAIN', appContext);
      return appContext;

    } catch (error) {
      console.error('[MultiAppAuth] Frontend Main authentication failed:', error);
      await context.close();
      throw error;
    }
  }

  // Guardian App Authentication (Session-based)
  async authenticateGuardianApp(guardianCredentials: TestGuardian): Promise<AppContext> {
    const appConfig = APP_CONFIGS.GUARDIAN_APP;
    
    const context = await this.browser.newContext();
    const page = await context.newPage();

    console.log('[MultiAppAuth] Authenticating Guardian App...');

    try {
      // Navigate to login
      await page.goto(appConfig.baseUrl + appConfig.loginPath);
      await page.waitForLoadState('domcontentloaded');

      // Check if already logged in by trying to navigate to dashboard
      await page.goto(appConfig.baseUrl + appConfig.dashboardPath);
      if (!page.url().includes('/login')) {
        console.log('[MultiAppAuth] Guardian App already authenticated');
        const appContext: AppContext = {
          page,
          context,
          appType: 'GUARDIAN_APP',
          isAuthenticated: true
        };
        this.appContexts.set('GUARDIAN_APP', appContext);
        return appContext;
      }

      // Go back to login page
      await page.goto(appConfig.baseUrl + appConfig.loginPath);

      // Fill login form
      await page.fill('input[type="email"]', guardianCredentials.email);
      await page.fill('input[type="password"]', guardianCredentials.password || 'TestPassword123!');
      
      // Submit login
      await page.click('button[type="submit"]');

      // Wait for dashboard or handle errors
      try {
        await page.waitForURL('**/dashboard', { timeout: 15000 });
      } catch (error) {
        // Check for error messages
        const errorElement = page.locator('.error-message, .alert-error, [role="alert"]').first();
        if (await errorElement.isVisible({ timeout: 3000 })) {
          const errorText = await errorElement.textContent();
          throw new Error(`Guardian login failed: ${errorText}`);
        }
        throw error;
      }

      console.log('[MultiAppAuth] Guardian App authenticated successfully');

      const appContext: AppContext = {
        page,
        context,
        appType: 'GUARDIAN_APP',
        isAuthenticated: true
      };

      this.appContexts.set('GUARDIAN_APP', appContext);
      return appContext;

    } catch (error) {
      console.error('[MultiAppAuth] Guardian App authentication failed:', error);
      await context.close();
      throw error;
    }
  }

  // Gate App Authentication (License-based)
  async authenticateGateApp(licenseKey?: string): Promise<AppContext> {
    const appConfig = APP_CONFIGS.GATE_APP;
    
    const context = await this.browser.newContext();
    const page = await context.newPage();

    console.log('[MultiAppAuth] Authenticating Gate App...');

    try {
      // Navigate to gate app
      await page.goto(appConfig.baseUrl);
      await page.waitForLoadState('domcontentloaded');

      // Check if already authenticated (should redirect to scan or settings)
      if (page.url().includes('/scan') || page.url().includes('/settings')) {
        console.log('[MultiAppAuth] Gate App already authenticated');
        const appContext: AppContext = {
          page,
          context,
          appType: 'GATE_APP',
          isAuthenticated: true
        };
        this.appContexts.set('GATE_APP', appContext);
        return appContext;
      }

      // Check if license setup is needed
      const licenseInput = page.locator('input[placeholder*="license"], input[name*="license"]');
      if (await licenseInput.isVisible({ timeout: 5000 })) {
        const testLicenseKey = licenseKey || 'test-license-key-for-e2e-testing';
        await licenseInput.fill(testLicenseKey);
        
        const submitButton = page.locator('button[type="submit"], button:has-text("Connect"), button:has-text("Validate")');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(3000);
        }
      }

      // Wait for authentication to complete
      await page.waitForURL('**/scan', { timeout: 15000 });

      console.log('[MultiAppAuth] Gate App authenticated successfully');

      const appContext: AppContext = {
        page,
        context,
        appType: 'GATE_APP',
        isAuthenticated: true
      };

      this.appContexts.set('GATE_APP', appContext);
      return appContext;

    } catch (error) {
      console.error('[MultiAppAuth] Gate App authentication failed:', error);
      await context.close();
      throw error;
    }
  }

  // Get authenticated app context
  getAppContext(appType: string): AppContext | undefined {
    return this.appContexts.get(appType);
  }

  // Navigate within an app
  async navigateInApp(appType: string, path: string): Promise<void> {
    const appContext = this.appContexts.get(appType);
    if (!appContext) {
      throw new Error(`App context for ${appType} not found. Authenticate first.`);
    }

    const baseUrl = APP_CONFIGS[appType]?.baseUrl;
    if (!baseUrl) {
      throw new Error(`Base URL for ${appType} not configured`);
    }

    console.log(`[MultiAppAuth] Navigating ${appType} to: ${path}`);
    await appContext.page.goto(baseUrl + path);
    await appContext.page.waitForLoadState('domcontentloaded');
  }

  // Check if app is authenticated
  async isAppAuthenticated(appType: string): Promise<boolean> {
    const appContext = this.appContexts.get(appType);
    return appContext?.isAuthenticated || false;
  }

  // Refresh authentication for an app
  async refreshAppAuth(appType: string): Promise<void> {
    const appContext = this.appContexts.get(appType);
    if (!appContext) {
      throw new Error(`App context for ${appType} not found`);
    }

    try {
      await appContext.page.reload();
      await appContext.page.waitForLoadState('domcontentloaded');
      
      const config = APP_CONFIGS[appType];
      if (config) {
        // Check if still on dashboard/authenticated page
        if (appContext.page.url().includes(config.dashboardPath)) {
          console.log(`[MultiAppAuth] ${appType} authentication still valid`);
          return;
        }
      }

      // Re-authenticate if needed
      switch (appType) {
        case 'FRONTEND_MAIN':
          await this.authenticateMainApp();
          break;
        case 'GUARDIAN_APP':
          // Would need guardian credentials - this is a limitation
          throw new Error('Guardian app re-authentication requires credentials');
        case 'GATE_APP':
          await this.authenticateGateApp();
          break;
        default:
          throw new Error(`Unknown app type: ${appType}`);
      }
    } catch (error) {
      console.error(`[MultiAppAuth] Failed to refresh auth for ${appType}:`, error);
      throw error;
    }
  }

  // Take screenshot from specific app
  async takeAppScreenshot(appType: string, filename: string): Promise<void> {
    const appContext = this.appContexts.get(appType);
    if (!appContext) {
      throw new Error(`App context for ${appType} not found`);
    }

    await appContext.page.screenshot({
      path: `screenshots/${filename}`,
      fullPage: true
    });
    console.log(`[MultiAppAuth] Screenshot saved: ${filename}`);
  }

  // Wait for specific element in app
  async waitForElementInApp(appType: string, selector: string, timeout: number = 10000): Promise<void> {
    const appContext = this.appContexts.get(appType);
    if (!appContext) {
      throw new Error(`App context for ${appType} not found`);
    }

    await appContext.page.waitForSelector(selector, { timeout });
  }

  // Execute function in app context
  async executeInApp<T>(appType: string, fn: (page: Page) => Promise<T>): Promise<T> {
    const appContext = this.appContexts.get(appType);
    if (!appContext) {
      throw new Error(`App context for ${appType} not found`);
    }

    return await fn(appContext.page);
  }

  // Close all app contexts
  async closeAllApps(): Promise<void> {
    console.log('[MultiAppAuth] Closing all app contexts...');
    
    for (const [appType, appContext] of this.appContexts.entries()) {
      try {
        await appContext.context.close();
        console.log(`[MultiAppAuth] Closed ${appType}`);
      } catch (error) {
        console.error(`[MultiAppAuth] Error closing ${appType}:`, error);
      }
    }
    
    this.appContexts.clear();
    console.log('[MultiAppAuth] All app contexts closed');
  }

  // Close specific app
  async closeApp(appType: string): Promise<void> {
    const appContext = this.appContexts.get(appType);
    if (appContext) {
      await appContext.context.close();
      this.appContexts.delete(appType);
      console.log(`[MultiAppAuth] Closed ${appType}`);
    }
  }

  // Get all active app types
  getActiveApps(): string[] {
    return Array.from(this.appContexts.keys());
  }
}