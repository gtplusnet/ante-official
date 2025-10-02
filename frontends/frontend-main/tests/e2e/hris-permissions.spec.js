const { test } = require('@playwright/test');

test.describe('HRIS Page Database Permissions Test', () => {
  test('should identify all permission errors on HRIS page', async ({ page }) => {
    console.log('🧪 Testing HRIS Page for Database Permission Issues');
    console.log('===================================================\n');

    // Collect all console errors
    const consoleErrors = [];
    const networkErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()} ${response.url()}`);
        console.log('❌ Network Error:', response.status(), response.url());
      }
    });

    try {
      // Navigate to login page first
      console.log('1️⃣ Navigating to login page...');
      await page.goto('http://localhost:9000/auth/login');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Login with test credentials
      console.log('2️⃣ Logging in...');
      await page.fill('input[type="text"]', 'guillermotabligan');
      await page.fill('input[type="password"]', 'water123');
      await page.click('button[type="submit"]');

      // Wait for login to complete
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Navigate to HRIS page
      console.log('3️⃣ Navigating to HRIS page...');
      await page.goto('http://localhost:9000/member/manpower/hris');
      
      // Wait for page to load and data to fetch
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000); // Give time for all API calls

      console.log('4️⃣ Checking for table content...');
      
      // Check if table is visible
      const tableExists = await page.locator('table').count() > 0;
      console.log(`   Table exists: ${tableExists}`);

      // Check for loading states
      const isLoading = await page.locator('text=Loading').count() > 0;
      console.log(`   Still loading: ${isLoading}`);

      // Check for error messages
      const errorMessages = await page.locator('.q-notification--negative').count();
      console.log(`   Error notifications: ${errorMessages}`);

      // Try to find table rows
      const tableRows = await page.locator('tbody tr').count();
      console.log(`   Table rows found: ${tableRows}`);

      // Check for specific error text
      const permissionError = await page.locator('text=permission denied').count();
      console.log(`   Permission denied errors: ${permissionError}`);

      console.log('\n5️⃣ Summary of Issues Found:');
      console.log('============================');
      
      if (consoleErrors.length > 0) {
        console.log('\n📋 Console Errors:');
        consoleErrors.forEach((error, i) => {
          console.log(`   ${i+1}. ${error}`);
        });
      }

      if (networkErrors.length > 0) {
        console.log('\n🌐 Network Errors:');
        networkErrors.forEach((error, i) => {
          console.log(`   ${i+1}. ${error}`);
        });
      }

      // Extract table names from permission errors
      const tablePermissionErrors = [];
      consoleErrors.forEach(error => {
        const match = error.match(/permission denied for table (\w+)/);
        if (match) {
          tablePermissionErrors.push(match[1]);
        }
      });

      if (tablePermissionErrors.length > 0) {
        console.log('\n🔒 Tables Needing Permissions:');
        [...new Set(tablePermissionErrors)].forEach((table, i) => {
          console.log(`   ${i+1}. ${table}`);
        });
      }

      // Final assessment
      if (tableRows > 0) {
        console.log('\n✅ SUCCESS: HRIS table is displaying data!');
      } else if (consoleErrors.length === 0 && networkErrors.length === 0) {
        console.log('\n⚠️  No errors found, but no data displayed - may be empty dataset');
      } else {
        console.log('\n❌ FAILED: HRIS table has issues that need fixing');
      }

      // Take screenshot for debugging
      await page.screenshot({ path: '/home/jdev/projects/ante/debug/hris-page-test.png', fullPage: true });
      console.log('\n📸 Screenshot saved to debug/hris-page-test.png');

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      throw error;
    }
  });
});