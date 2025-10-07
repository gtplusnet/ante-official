const { test, expect } = require('@playwright/test');

test('quick parallax visual check', async ({ page }) => {
  // Navigate to the site
  await page.goto('https://multibook.geertest.com', { waitUntil: 'domcontentloaded' });
  
  // Wait a bit for initial render
  await page.waitForTimeout(2000);
  
  // Take initial screenshot
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/parallax-initial.png',
    fullPage: false
  });
  
  // Scroll down
  await page.evaluate(() => window.scrollTo(0, 1000));
  await page.waitForTimeout(500);
  
  // Take screenshot after scroll
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/parallax-scrolled.png',
    fullPage: false
  });
  
  // Scroll to market section
  await page.evaluate(() => {
    const market = document.querySelector('section h4');
    if (market && market.textContent?.includes('EXPAND YOUR MARKET')) {
      market.scrollIntoView();
    }
  });
  await page.waitForTimeout(500);
  
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/parallax-market-view.png',
    fullPage: false
  });
  
  // Check console for any errors
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(msg.text()));
  
  console.log('Page loaded and screenshots taken');
});