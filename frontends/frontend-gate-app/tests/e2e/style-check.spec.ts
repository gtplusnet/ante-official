import { test, expect } from '@playwright/test';

test.describe('Style and CSS Check', () => {
  test('should load Tailwind CSS styles on login page', async ({ page }) => {
    await page.goto('/login');
    
    // Take screenshot for visual inspection
    await page.screenshot({ path: 'tests/screenshots/login-page.png', fullPage: true });
    
    // Check if Tailwind classes are applied
    const body = await page.locator('body');
    const bodyStyles = await body.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        display: styles.display,
        minHeight: styles.minHeight,
      };
    });
    
    console.log('Body styles:', bodyStyles);
    
    // Check if the card component has proper styles
    const card = await page.locator('[class*="Card"]').first();
    const cardStyles = await card.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        borderRadius: styles.borderRadius,
        borderColor: styles.borderColor,
        borderWidth: styles.borderWidth,
        boxShadow: styles.boxShadow,
      };
    });
    
    console.log('Card styles:', cardStyles);
    
    // Check button styles
    const button = await page.locator('button').first();
    const buttonStyles = await button.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        padding: styles.padding,
        borderRadius: styles.borderRadius,
      };
    });
    
    console.log('Button styles:', buttonStyles);
    
    // Check if CSS is loaded
    const stylesheets = await page.evaluate(() => {
      return Array.from(document.styleSheets).map(sheet => ({
        href: sheet.href,
        rules: sheet.cssRules ? sheet.cssRules.length : 0
      }));
    });
    
    console.log('Loaded stylesheets:', stylesheets);
    
    // Check for specific Tailwind utilities
    const hasTailwindStyles = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.className = 'bg-blue-500';
      document.body.appendChild(testEl);
      const styles = window.getComputedStyle(testEl);
      const hasBlueBackground = styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
      document.body.removeChild(testEl);
      return hasBlueBackground;
    });
    
    console.log('Has Tailwind styles:', hasTailwindStyles);
    
    // Expect some basic styles to be applied
    expect(bodyStyles.minHeight).toBe('100vh');
    expect(cardStyles.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(cardStyles.borderRadius).toBeTruthy();
  });
  
  test('should check CSS files are loaded', async ({ page }) => {
    const response = await page.goto('/login');
    
    // Intercept CSS requests
    const cssRequests: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('.css') || response.request().resourceType() === 'stylesheet') {
        cssRequests.push(response.url());
      }
    });
    
    await page.reload();
    await page.waitForTimeout(1000);
    
    console.log('CSS requests:', cssRequests);
    
    // Check page source for CSS links
    const htmlContent = await page.content();
    const hasGlobalsCss = htmlContent.includes('globals.css');
    
    console.log('HTML contains globals.css reference:', hasGlobalsCss);
  });
});