const { test } = require('@playwright/test');

test.describe('HRIS API Calls Elimination Test', () => {
  test('should not make backend API calls for HRIS dropdowns', async ({ page }) => {
    // Track network requests
    const apiCalls = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('localhost:3000')) {
        // Check for the specific endpoints we want to eliminate
        if (url.includes('/hr-configuration/schedule/table') ||
            url.includes('/hr-configuration/payroll-group/table') ||
            url.includes('/hr-configuration/shift/table') ||
            url.includes('/branch/table')) {
          apiCalls.push({
            url: url,
            method: request.method()
          });
        }
      }
    });
    
    // Login
    await page.goto('http://localhost:9000/#/login');
    await page.waitForSelector('input[name="username"]');
    
    await page.fill('input[name="username"]', 'guillermotabligan');
    await page.fill('input[name="password"]', 'water123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/#/member', { timeout: 10000 });
    console.log('✓ Logged in successfully');
    
    // Navigate to HRIS page
    await page.goto('http://localhost:9000/#/manpower/hris');
    await page.waitForSelector('[data-testid="hris-table"], .q-table', { timeout: 10000 });
    console.log('✓ HRIS page loaded');
    
    // Wait a bit to catch any delayed API calls
    await page.waitForTimeout(3000);
    
    // Try to open the edit dialog if there's an employee
    const editButton = await page.locator('[data-testid="edit-employee-button"], button:has-text("Edit")').first();
    if (await editButton.count() > 0) {
      console.log('✓ Found edit button, clicking to open dialog...');
      await editButton.click();
      
      // Wait for dialog to open
      await page.waitForSelector('[data-testid="edit-employee-dialog"], .q-dialog', { timeout: 5000 });
      console.log('✓ Edit dialog opened');
      
      // Wait for any API calls to complete
      await page.waitForTimeout(3000);
    }
    
    // Check results
    console.log('\n=== API Calls Analysis ===\n');
    
    if (apiCalls.length === 0) {
      console.log('✅ SUCCESS: No backend API calls detected for HRIS dropdowns!');
      console.log('All dropdown data is being fetched directly from Supabase.');
    } else {
      console.log('❌ FAILED: Still making backend API calls:');
      apiCalls.forEach(call => {
        console.log(`  - ${call.method} ${call.url}`);
      });
      console.log('\nThese API calls should be replaced with direct Supabase access.');
      
      // Fail the test if API calls are still being made
      expect(apiCalls.length).toBe(0);
    }
  });
});