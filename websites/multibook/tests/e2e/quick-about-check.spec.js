const { test } = require('@playwright/test');

test('quick About Us check', async ({ page }) => {
  // Check deployed Next.js version
  await page.goto('https://multibook.geertest.com/about-us', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // Take full page screenshot
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/about-us-current-state.png', 
    fullPage: true 
  });
  
  console.log('Screenshot saved: tests/e2e/screenshots/about-us-current-state.png');
});