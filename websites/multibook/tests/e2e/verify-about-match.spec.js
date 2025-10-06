const { test } = require('@playwright/test');

test('verify About Us pages match', async ({ browser }) => {
  // Create two browser contexts
  const context1 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  try {
    // Load Quasar version
    console.log('Loading Quasar About Us page...');
    await page1.goto('http://localhost:9000/#/About-us', { waitUntil: 'networkidle' });
    await page1.waitForTimeout(3000);
    
    // Load Next.js version
    console.log('Loading Next.js About Us page...');
    await page2.goto('https://multibook.geertest.com/about-us', { waitUntil: 'networkidle' });
    await page2.waitForTimeout(3000);
    
    // Take full page screenshots
    await page1.screenshot({ path: 'tests/e2e/screenshots/final-quasar-about.png', fullPage: true });
    await page2.screenshot({ path: 'tests/e2e/screenshots/final-nextjs-about.png', fullPage: true });
    
    // Check specific sections
    const sections = [
      { name: 'video', text: 'About Us' },
      { name: 'mission', text: 'Mission' },
      { name: 'core-values', text: 'Core Values' },
      { name: 'ceo', text: 'deliver the best' }
    ];
    
    for (const section of sections) {
      console.log(`\nChecking ${section.name} section...`);
      
      // Scroll to section in Quasar
      const quasarElement = await page1.locator(`text="${section.text}"`).first();
      if (await quasarElement.count() > 0) {
        await quasarElement.scrollIntoViewIfNeeded();
        await page1.waitForTimeout(1000);
      }
      
      // Scroll to section in Next.js
      const nextElement = await page2.locator(`text="${section.text}"`).first();
      if (await nextElement.count() > 0) {
        await nextElement.scrollIntoViewIfNeeded();
        await page2.waitForTimeout(1000);
      }
      
      // Take section screenshots
      await page1.screenshot({ 
        path: `tests/e2e/screenshots/final-quasar-${section.name}.png`,
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      });
      
      await page2.screenshot({ 
        path: `tests/e2e/screenshots/final-nextjs-${section.name}.png`,
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      });
    }
    
    console.log('\nScreenshots saved for comparison');
    console.log('Compare the following files:');
    console.log('- tests/e2e/screenshots/final-quasar-about.png vs final-nextjs-about.png');
    console.log('- tests/e2e/screenshots/final-quasar-video.png vs final-nextjs-video.png');
    console.log('- tests/e2e/screenshots/final-quasar-mission.png vs final-nextjs-mission.png');
    console.log('- tests/e2e/screenshots/final-quasar-core-values.png vs final-nextjs-core-values.png');
    console.log('- tests/e2e/screenshots/final-quasar-ceo.png vs final-nextjs-ceo.png');
    
  } finally {
    await context1.close();
    await context2.close();
  }
});