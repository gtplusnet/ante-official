import { test } from '@playwright/test';

test('capture current deployed state', async ({ page }) => {
  await page.goto('https://multibook.geertest.com', { waitUntil: 'domcontentloaded' });
  
  // Wait a bit for images to load
  await page.waitForTimeout(3000);
  
  // Take full page screenshot
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/current-deployed-state.png',
    fullPage: true 
  });
  
  // Take individual section screenshots
  const sections = [
    { selector: 'section:first-of-type', name: 'hero' },
    { selector: 'section#features', name: 'features' },
    { selector: 'section:has-text("EXPAND YOUR MARKET")', name: 'market' },
    { selector: 'section:has-text("Endorsed by Industry Leaders")', name: 'partners' },
    { selector: 'section#newsletter', name: 'newsletter' },
    { selector: 'section:last-of-type', name: 'cta' }
  ];
  
  for (const section of sections) {
    try {
      const element = page.locator(section.selector).first();
      await element.screenshot({ 
        path: `tests/e2e/screenshots/section-${section.name}.png`
      });
      console.log(`Captured ${section.name} section`);
    } catch (error) {
      console.log(`Failed to capture ${section.name} section:`, error.message);
    }
  }
});