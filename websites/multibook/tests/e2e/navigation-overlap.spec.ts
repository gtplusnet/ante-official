import { test, expect } from '@playwright/test';

test.describe('Navigation Z-Index Test', () => {
  test('navigation should stay above newsletter section when scrolling', async ({ page }) => {
    // Navigate to the site
    await page.goto('https://multibook.geertest.com');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Find the newsletter section
    const newsletterSection = page.locator('section#newsletter');
    
    // Scroll to newsletter section
    await newsletterSection.scrollIntoViewIfNeeded();
    
    // Wait for scroll to complete
    await page.waitForTimeout(1000);
    
    // Take a screenshot showing the overlap issue
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/navigation-newsletter-overlap.png',
      fullPage: false // Just the viewport to see the overlap
    });
    
    // Get the navigation element
    const navigation = page.locator('nav').first();
    
    // Check if navigation is visible
    await expect(navigation).toBeVisible();
    
    // Get z-index values
    const navZIndex = await navigation.evaluate(el => {
      return window.getComputedStyle(el).zIndex;
    });
    
    console.log('Navigation z-index:', navZIndex);
    
    // Get newsletter items that might overlap
    const newsletterCards = newsletterSection.locator('.bg-white');
    const cardCount = await newsletterCards.count();
    
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = newsletterCards.nth(i);
      const cardZIndex = await card.evaluate(el => {
        return window.getComputedStyle(el).zIndex;
      });
      console.log(`Newsletter card ${i + 1} z-index:`, cardZIndex);
    }
    
    // Scroll up and down to test overlap
    await page.evaluate(() => window.scrollBy(0, -100));
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/navigation-newsletter-scroll-up.png',
      fullPage: false
    });
    
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/navigation-newsletter-scroll-down.png',
      fullPage: false
    });
    
    // Check if navigation has the correct class with high z-index
    const navClasses = await navigation.getAttribute('class');
    console.log('Navigation classes:', navClasses);
    expect(navClasses).toContain('z-[9999]');
  });
  
  test('check all sections for z-index issues', async ({ page }) => {
    await page.goto('https://multibook.geertest.com');
    await page.waitForLoadState('domcontentloaded');
    
    // Test each section
    const sections = [
      { name: 'features', selector: 'section#features' },
      { name: 'market', selector: 'section:has-text("EXPAND YOUR MARKET")' },
      { name: 'partners', selector: 'section:has-text("Endorsed by Industry Leaders")' },
      { name: 'newsletter', selector: 'section#newsletter' },
      { name: 'cta', selector: 'section:has(button:has-text("Contact Us"))' }
    ];
    
    for (const section of sections) {
      try {
        const element = page.locator(section.selector).first();
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        // Take screenshot
        await page.screenshot({ 
          path: `tests/e2e/screenshots/nav-overlap-${section.name}.png`,
          fullPage: false
        });
        
        console.log(`Checked ${section.name} section`);
      } catch (error) {
        console.log(`Failed to check ${section.name} section:`, error.message);
      }
    }
  });
});