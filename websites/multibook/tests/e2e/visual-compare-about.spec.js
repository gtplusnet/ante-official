const { test } = require('@playwright/test');

test('visual comparison of About Us pages', async ({ browser }) => {
  // Create two browser contexts for side-by-side comparison
  const context1 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  try {
    // Load both pages
    console.log('Loading Quasar About Us...');
    await page1.goto('http://localhost:9000/#/About-us', { waitUntil: 'networkidle' });
    await page1.waitForTimeout(2000);
    
    console.log('Loading Next.js About Us...');
    await page2.goto('https://multibook.geertest.com/about-us', { waitUntil: 'domcontentloaded' });
    await page2.waitForTimeout(2000);
    
    // Take full page screenshots
    await page1.screenshot({ path: 'tests/e2e/screenshots/quasar-about-full-page.png', fullPage: true });
    await page2.screenshot({ path: 'tests/e2e/screenshots/nextjs-about-full-page.png', fullPage: true });
    
    // Compare specific sections
    const sections = [
      { name: 'hero', selector: 'h1:has-text("About Us")', scrollTo: true },
      { name: 'company', text: 'innovative company', scrollTo: true },
      { name: 'mission', text: 'Mission', scrollTo: true },
      { name: 'values', text: 'Core Values', scrollTo: true },
      { name: 'ceo', text: 'CEO', scrollTo: true }
    ];
    
    for (const section of sections) {
      console.log(`Capturing ${section.name} section...`);
      
      // Quasar
      if (section.selector) {
        await page1.locator(section.selector).scrollIntoViewIfNeeded();
      } else if (section.text) {
        const element = page1.locator(`text="${section.text}"`).first();
        if (await element.count() > 0) {
          await element.scrollIntoViewIfNeeded();
        }
      }
      await page1.waitForTimeout(1000);
      await page1.screenshot({ 
        path: `tests/e2e/screenshots/quasar-about-${section.name}.png`,
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      });
      
      // Next.js
      if (section.selector) {
        await page2.locator(section.selector).scrollIntoViewIfNeeded();
      } else if (section.text) {
        const element = page2.locator(`text="${section.text}"`).first();
        if (await element.count() > 0) {
          await element.scrollIntoViewIfNeeded();
        }
      }
      await page2.waitForTimeout(1000);
      await page2.screenshot({ 
        path: `tests/e2e/screenshots/nextjs-about-${section.name}.png`,
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      });
    }
    
    console.log('Screenshots saved for comparison');
    
  } finally {
    await context1.close();
    await context2.close();
  }
});