import { test, expect } from '@playwright/test';

test.describe('Anon Access HRIS Test', () => {
  test('HRIS page loads with anon Supabase access', async ({ page }) => {
    console.log('\n=== TESTING ANON ACCESS FOR HRIS ===\n');
    
    // Monitor network requests
    const supabaseRequests = [];
    page.on('request', request => {
      if (request.url().includes('supabase')) {
        const headers = request.headers();
        supabaseRequests.push({
          url: request.url(),
          method: request.method(),
          authorization: headers['authorization'] || 'No auth header'
        });
      }
    });
    
    // Monitor console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Step 1: Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:9000/#/login');
    await page.click('button:has-text("Sign in manually")');
    await page.fill('input[type="text"]', 'guillermotabligan');
    await page.fill('input[type="password"]', 'water123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL(/.*#\/member\/dashboard/, { timeout: 10000 });
    console.log('✅ Login successful\n');
    
    // Step 2: Navigate to HRIS
    console.log('Step 2: Navigating to HRIS...');
    await page.goto('http://localhost:9000/#/member/manpower/hris');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if page loaded without errors
    const pageTitle = await page.textContent('.text-title-large');
    console.log('Page title:', pageTitle);
    
    // Check for permission errors
    const hasPermissionError = consoleErrors.some(err => 
      err.includes('permission denied') || 
      err.includes('Permission denied')
    );
    
    if (hasPermissionError) {
      console.log('❌ Permission errors found:', consoleErrors);
    } else {
      console.log('✅ No permission errors');
    }
    
    // Check Supabase requests
    console.log('\n=== SUPABASE REQUESTS ===');
    supabaseRequests.forEach(req => {
      console.log(`${req.method} ${req.url}`);
      console.log(`Authorization: ${req.authorization}`);
      
      // Check if using anon key
      if (req.authorization.includes('Bearer')) {
        const token = req.authorization.replace('Bearer ', '');
        // Decode JWT to check role
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            console.log(`Token role: ${payload.role}`);
            console.log(`Token sub: ${payload.sub}`);
          }
        } catch (e) {
          console.log('Could not decode token');
        }
      }
      console.log('---');
    });
    
    // Check if data loads in the table
    console.log('\n=== CHECKING TABLE DATA ===');
    
    // Wait for potential data to load
    await page.waitForTimeout(2000);
    
    // Check if table exists
    const tableExists = await page.locator('.supabase-g-table, .q-table').count() > 0;
    console.log('Table exists:', tableExists);
    
    // Try to check if data loaded
    const tableRows = await page.locator('.q-table tbody tr, .table-row').count();
    console.log('Table rows found:', tableRows);
    
    // Final summary
    console.log('\n=== SUMMARY ===');
    expect(pageTitle).toBe('HRIS');
    expect(hasPermissionError).toBe(false);
    
    if (tableExists && !hasPermissionError) {
      console.log('✅ HRIS page loads successfully with anon access');
    } else {
      console.log('❌ Issues found with HRIS page');
    }
    
    // Log all console errors for debugging
    if (consoleErrors.length > 0) {
      console.log('\n=== ALL CONSOLE ERRORS ===');
      consoleErrors.forEach(err => console.log(err));
    }
  });
});