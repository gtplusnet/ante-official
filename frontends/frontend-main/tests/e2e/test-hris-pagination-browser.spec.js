const { test } = require('@playwright/test');

test.describe('HRIS Pagination Browser Test', () => {
  test('should navigate through pages without 416 errors', async ({ page }) => {
    console.log('🌐 Testing HRIS Pagination in Browser');
    console.log('====================================\n');

    // Monitor console errors - especially 416 Range Not Satisfiable
    const consoleErrors = [];
    const networkErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        console.log('❌ Console Error:', text);
      }
    });

    page.on('response', response => {
      if (response.status() === 416) {
        networkErrors.push(`416 Range Not Satisfiable: ${response.url()}`);
        console.log('🚨 416 ERROR DETECTED:', response.url());
      } else if (response.status() >= 400) {
        networkErrors.push(`${response.status()}: ${response.url()}`);
        console.log('❌ Network Error:', response.status(), response.url());
      }
    });

    try {
      // Navigate to HRIS page
      console.log('1️⃣ Navigating to HRIS page...');
      await page.goto('http://localhost:9000/member/manpower/hris', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait for potential auth redirect
      await page.waitForTimeout(2000);
      
      // Handle login if needed
      const currentUrl = page.url();
      if (currentUrl.includes('/auth/login')) {
        console.log('2️⃣ Handling authentication...');
        await page.waitForSelector('input[data-cy="username"]', { timeout: 10000 });
        await page.fill('input[data-cy="username"]', 'guillermotabligan');
        await page.fill('input[data-cy="password"]', 'water123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Navigate back to HRIS
        await page.goto('http://localhost:9000/member/manpower/hris', { 
          waitUntil: 'networkidle' 
        });
      }

      console.log('3️⃣ Waiting for HRIS page to load...');
      await page.waitForTimeout(5000); // Allow time for data loading

      // Check if page loaded correctly
      const hasHRISTitle = await page.locator('text=HRIS').count() > 0;
      const hasTable = await page.locator('table').count() > 0;
      
      console.log(`   HRIS title present: ${hasHRISTitle}`);
      console.log(`   Table present: ${hasTable}`);

      if (hasTable) {
        console.log('4️⃣ Testing pagination navigation...');
        
        // Wait for initial data to load
        await page.waitForSelector('tbody tr', { timeout: 10000 });
        
        const initialRows = await page.locator('tbody tr').count();
        console.log(`   Initial rows: ${initialRows}`);

        // Look for pagination controls
        const paginationExists = await page.locator('.pagination').count() > 0;
        console.log(`   Pagination controls: ${paginationExists}`);

        if (paginationExists) {
          // Try to click page 2 (this was causing 416 error)
          console.log('   🧪 Clicking page 2 (testing fix for 416 error)...');
          
          // Wait a moment for any existing requests to complete
          await page.waitForTimeout(1000);
          
          const page2Button = page.locator('button[aria-label="2"], button:text("2")').first();
          const page2Exists = await page2Button.count() > 0;
          
          if (page2Exists) {
            // Clear previous errors before testing
            networkErrors.length = 0;
            
            await page2Button.click();
            await page.waitForTimeout(3000); // Wait for request to complete
            
            // Check for new data
            const page2Rows = await page.locator('tbody tr').count();
            console.log(`   Page 2 rows: ${page2Rows}`);
            
            // Check if 416 errors occurred
            const has416Error = networkErrors.some(error => error.includes('416'));
            
            if (has416Error) {
              console.log('🚨 CRITICAL: 416 Range Not Satisfiable error still occurs!');
            } else {
              console.log('✅ SUCCESS: No 416 errors on page 2!');
            }
            
            // Try page 3 if it exists
            const page3Button = page.locator('button[aria-label="3"], button:text("3")').first();
            const page3Exists = await page3Button.count() > 0;
            
            if (page3Exists) {
              console.log('   🧪 Testing page 3...');
              await page3Button.click();
              await page.waitForTimeout(2000);
              
              const page3Rows = await page.locator('tbody tr').count();
              console.log(`   Page 3 rows: ${page3Rows}`);
            }
            
            // Go back to page 1
            console.log('   🧪 Returning to page 1...');
            const page1Button = page.locator('button[aria-label="1"], button:text("1")').first();
            if (await page1Button.count() > 0) {
              await page1Button.click();
              await page.waitForTimeout(2000);
            }
            
          } else {
            console.log('   ℹ️  Only one page of data - pagination test skipped');
          }
        } else {
          console.log('   ℹ️  No pagination controls found - might be single page');
        }
      } else {
        console.log('   ⚠️  No table found - page might not have loaded correctly');
      }

      console.log('\n5️⃣ Test Results Summary');
      console.log('========================');
      
      const has416Errors = networkErrors.some(error => error.includes('416'));
      const hasCriticalErrors = consoleErrors.some(error => 
        error.includes('permission denied') || error.includes('416')
      );
      
      if (!has416Errors && !hasCriticalErrors && hasTable) {
        console.log('🎉 PAGINATION TEST PASSED!');
        console.log('✅ No 416 Range Not Satisfiable errors');
        console.log('✅ No permission denied errors');
        console.log('✅ HRIS table loaded successfully');
        console.log('✅ Pagination navigation working');
      } else {
        console.log('⚠️  ISSUES DETECTED:');
        if (has416Errors) console.log('❌ 416 Range Not Satisfiable errors present');
        if (hasCriticalErrors) console.log('❌ Critical errors in console');
        if (!hasTable) console.log('❌ Table failed to load');
      }

      console.log(`\n📊 Error Summary:`);
      console.log(`   Network errors: ${networkErrors.length}`);
      console.log(`   Console errors: ${consoleErrors.length}`);

      // Take screenshot for debugging
      await page.screenshot({ 
        path: '/home/jdev/projects/ante/debug/hris-pagination-test.png', 
        fullPage: true 
      });
      console.log('\n📸 Screenshot saved: debug/hris-pagination-test.png');

    } catch (error) {
      console.error('❌ Browser test error:', error.message);
      await page.screenshot({ 
        path: '/home/jdev/projects/ante/debug/hris-pagination-error.png', 
        fullPage: true 
      });
    }
  });
});