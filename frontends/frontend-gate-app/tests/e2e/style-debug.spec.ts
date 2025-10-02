import { test, expect } from '@playwright/test';

test.describe('Debug Styling Issues', () => {
  test('check what is actually rendered', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/login-debug.png', fullPage: true });
    
    // Get all CSS files loaded
    const cssFiles = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(el => ({
        type: el.tagName,
        href: (el as HTMLLinkElement).href || 'inline',
        content: el.tagName === 'STYLE' ? (el as HTMLStyleElement).textContent?.substring(0, 100) : null
      }));
    });
    console.log('CSS Files:', cssFiles);
    
    // Check if main container exists
    const mainExists = await page.locator('main').count();
    console.log('Main element exists:', mainExists > 0);
    
    // Get the actual HTML structure
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('Body HTML (first 500 chars):', bodyHTML.substring(0, 500));
    
    // Check for any divs with rounded borders (Card-like elements)
    const cardElements = await page.locator('div').evaluateAll((divs) => {
      return divs.filter(div => {
        const styles = window.getComputedStyle(div);
        return styles.borderRadius !== '0px' && styles.borderWidth !== '0px';
      }).map(div => ({
        className: div.className,
        borderRadius: window.getComputedStyle(div).borderRadius,
        backgroundColor: window.getComputedStyle(div).backgroundColor,
        innerHTML: div.innerHTML.substring(0, 100)
      }));
    });
    console.log('Card-like elements:', cardElements);
    
    // Check computed styles on body
    const bodyStyles = await page.locator('body').evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        minHeight: styles.minHeight,
        backgroundColor: styles.backgroundColor,
        className: el.className
      };
    });
    console.log('Body computed styles:', bodyStyles);
  });
});