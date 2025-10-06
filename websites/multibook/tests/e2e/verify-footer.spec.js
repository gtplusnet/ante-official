const { test, expect } = require('@playwright/test');

test('verify footer is displayed correctly', async ({ page }) => {
  await page.goto('https://multibook.geertest.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // Scroll to bottom to see footer
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  
  // Check footer is visible
  const footer = page.locator('div.bg-oxford-blue').last();
  await expect(footer).toBeVisible();
  
  // Check footer content
  const footerTitle = page.locator('h2:has-text("Ready to simplify your finances?")');
  const footerEmail = page.locator('span:has-text("info@multibook.com")');
  const footerAddress = page.locator('span:has-text("16F Keppel Towers")');
  
  // Check footer sections
  const companySection = page.locator('p:has-text("Company")');
  const servicesSection = page.locator('p:has-text("Services")');
  const helpSection = page.locator('p:has-text("Help")');
  
  // Check copyright
  const copyright = page.locator('p:has-text("Copyright © 2021 Multibook Limited")');
  
  // Verify all elements are visible
  await expect(footerTitle).toBeVisible();
  await expect(companySection).toBeVisible();
  await expect(servicesSection).toBeVisible();
  await expect(helpSection).toBeVisible();
  await expect(copyright).toBeVisible();
  
  // Take screenshot
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/footer-display.png',
    fullPage: true
  });
  
  console.log('Footer verified successfully');
});