import { test, expect } from '@playwright/test';

test.use({ 
  timeout: 60000 // 60 second timeout
});

test('verify deployed site sections', async ({ page }) => {
  console.log('Navigating to https://multibook.geertest.com...');
  await page.goto('https://multibook.geertest.com', { 
    waitUntil: 'domcontentloaded',
    timeout: 30000 
  });
  
  console.log('Taking screenshot...');
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/deployed-homepage.png',
    fullPage: true 
  });
  
  // Check page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Count all sections
  const sections = await page.locator('section').count();
  console.log(`Found ${sections} sections`);
  
  // List all section content
  for (let i = 0; i < sections; i++) {
    const section = page.locator('section').nth(i);
    const text = await section.textContent();
    console.log(`\nSection ${i + 1}:`);
    console.log(text?.substring(0, 100) + '...');
  }
  
  // Check for features
  const featureCards = await page.locator('.bg-white.rounded-2xl').count();
  console.log(`\nFound ${featureCards} feature cards`);
  
  // Check for newsletter items
  const newsletterItems = await page.locator('#newsletter .bg-white').count();
  console.log(`Found ${newsletterItems} newsletter items`);
  
  // Check footer
  const footerText = await page.locator('footer').textContent();
  console.log('\nFooter found:', footerText?.includes('Multibook') ? 'Yes' : 'No');
});