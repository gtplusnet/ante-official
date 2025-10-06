const { test } = require('@playwright/test');

test('quick design check', async ({ page }) => {
  await page.goto('https://multibook.geertest.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  // Take screenshots of each section
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/1-hero-section.png',
    fullPage: false
  });
  
  // Scroll to features
  await page.evaluate(() => {
    const features = document.querySelector('#features');
    if (features) features.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/2-features-section.png',
    fullPage: false
  });
  
  // Scroll to market
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1'));
    const market = headings.find(h => h.textContent?.includes('Try it out'));
    if (market) market.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/3-market-section.png',
    fullPage: false
  });
  
  // Scroll to partners
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h2'));
    const partners = headings.find(h => h.textContent?.includes('Industry Leaders'));
    if (partners) partners.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/4-partners-section.png',
    fullPage: false
  });
  
  // Scroll to newsletter
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h2'));
    const newsletter = headings.find(h => h.textContent === 'Newsletter');
    if (newsletter) newsletter.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/5-newsletter-section.png',
    fullPage: false
  });
  
  // Scroll to footer
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/6-footer-section.png',
    fullPage: false
  });
  
  // Full page screenshot
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/full-homepage.png',
    fullPage: true
  });
  
  console.log('Screenshots captured successfully');
});