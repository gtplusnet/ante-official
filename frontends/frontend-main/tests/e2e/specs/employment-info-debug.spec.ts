import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getTestUser } from '../fixtures/test-data';

test.describe('Employment Information Debug', () => {
  test('Debug - Check what is on dashboard', async ({ page }) => {
    // Login
    const loginPage = new LoginPage(page);
    const testUser = getTestUser('DEFAULT');
    await loginPage.login(testUser);
    await expect(page.locator('text=Welcome')).toBeVisible();
    
    // Navigate to dashboard
    await page.goto('/#/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Take screenshot of the full page
    await page.screenshot({ path: 'debug-dashboard.png', fullPage: true });
    
    // Check what widgets are visible
    console.log('Checking for widgets...');
    
    // Look for any Employment related text
    const employmentTexts = await page.locator('text=/.*[Ee]mployment.*/').all();
    console.log(`Found ${employmentTexts.length} employment-related texts`);
    
    // Check for My Employment Information specifically
    const myEmploymentWidget = await page.locator('text="My Employment Information"').count();
    console.log(`Found "My Employment Information": ${myEmploymentWidget}`);
    
    // Check for the widget class
    const widgetClass = await page.locator('.my-employment-information-widget').count();
    console.log(`Found .my-employment-information-widget: ${widgetClass}`);
    
    // List all visible cards
    const cards = await page.locator('.q-card').all();
    console.log(`Found ${cards.length} cards on the page`);
    
    // Get titles of all cards
    for (let i = 0; i < Math.min(cards.length, 10); i++) {
      const title = await cards[i].textContent();
      console.log(`Card ${i}: ${title?.substring(0, 50)}...`);
    }
    
    // Scroll to bottom and check again
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    const widgetAfterScroll = await page.locator('.my-employment-information-widget').count();
    console.log(`After scroll - Found .my-employment-information-widget: ${widgetAfterScroll}`);
    
    // Take another screenshot after scrolling
    await page.screenshot({ path: 'debug-dashboard-scrolled.png', fullPage: true });
  });
});