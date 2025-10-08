const { test } = require('@playwright/test');

test('capture About Us page locally', async ({ page }) => {
  // Load Next.js version locally
  await page.goto('http://localhost:3004/about-us', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  // Take full page screenshot
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/nextjs-about-local-full.png', 
    fullPage: true 
  });
  
  // Capture individual sections
  const sections = [
    { name: 'hero', selector: 'section:has(h1:has-text("About Us"))' },
    { name: 'video', selector: 'section:has(iframe)' },
    { name: 'company', selector: 'section:has-text("innovative company")' },
    { name: 'mission', selector: 'section:has(h2:has-text("Mission"))' },
    { name: 'values', selector: 'section:has(h2:has-text("Core Values"))' },
    { name: 'ceo', selector: 'section:has-text("CEO")' }
  ];
  
  for (const section of sections) {
    try {
      const element = page.locator(section.selector).first();
      if (await element.count() > 0) {
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        const box = await element.boundingBox();
        if (box) {
          await page.screenshot({
            path: `tests/e2e/screenshots/nextjs-about-local-${section.name}.png`,
            clip: box
          });
          console.log(`Captured ${section.name} section`);
        }
      } else {
        console.log(`Section ${section.name} not found`);
      }
    } catch (error) {
      console.log(`Error capturing ${section.name}: ${error.message}`);
    }
  }
});