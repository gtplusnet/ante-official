const { test } = require('@playwright/test');

test('Debug EmployeeData permission denied - comprehensive investigation', async ({ page }) => {
  
  const networkRequests = [];
  const consoleMessages = [];
  const permissionErrors = [];
  const successfulRequests = [];
  const failedRequests = [];
  
  // Intercept and log ALL network requests
  page.on('request', request => {
    if (request.url().includes('supabase') || request.url().includes('EmployeeData') || request.url().includes('rest/v1')) {
      networkRequests.push({
        method: request.method(),
        url: request.url(),
        headers: request.headers(),
        timestamp: new Date().toISOString()
      });
      console.log(`[REQUEST] ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('supabase') || response.url().includes('EmployeeData') || response.url().includes('rest/v1')) {
      const responseBody = await response.text().catch(() => 'Unable to read response body');
      const requestInfo = {
        method: response.request().method(),
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        body: responseBody,
        timestamp: new Date().toISOString()
      };
      
      if (response.status() >= 400) {
        failedRequests.push(requestInfo);
        console.error(`[RESPONSE ERROR] ${response.status()} ${response.statusText()} - ${response.url()}`);
        console.error(`[RESPONSE BODY] ${responseBody}`);
      } else {
        successfulRequests.push(requestInfo);
        console.log(`[RESPONSE SUCCESS] ${response.status()} - ${response.url()}`);
      }
    }
  });

  // Monitor console for debugging
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({
      type: msg.type(),
      text: text,
      timestamp: new Date().toISOString()
    });
    
    // Track permission errors
    if (text.toLowerCase().includes('permission denied') || 
        text.toLowerCase().includes('42501') ||
        text.toLowerCase().includes('row level security')) {
      permissionErrors.push(text);
      console.error(`🚨 PERMISSION ERROR: ${text}`);
    }
    
    // Log important auth and JWT related messages
    if (text.includes('🔐') || 
        text.includes('JWT') || 
        text.includes('token') ||
        text.includes('supabase') ||
        text.includes('Authorization')) {
      console.log(`[AUTH DEBUG] ${text}`);
    }
  });

  console.log('🎯 Step 1: Navigate to login page');
  await page.goto('http://localhost:9000/#/auth/signin');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('🎯 Step 2: Perform login');
  
  // Try multiple login approaches
  let loginSuccessful = false;
  
  // Method 1: Try standard form
  try {
    const usernameInput = page.locator('input[type="text"], input[name="username"], input[placeholder*="username"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await usernameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✅ Standard login form found');
      await usernameInput.fill('guillermotabligan');
      await passwordInput.fill('water123');
      
      const submitBtn = page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Login")').first();
      await submitBtn.click();
      loginSuccessful = true;
    }
  } catch (e) {
    console.log('❌ Standard login failed:', e.message);
  }
  
  // Method 2: Try to reveal manual login
  if (!loginSuccessful) {
    try {
      const buttons = await page.locator('button, .btn, [role="button"]').all();
      for (const button of buttons.slice(0, 5)) { // Try first 5 buttons
        const text = await button.textContent().catch(() => '');
        if (text && (text.toLowerCase().includes('manual') || 
                     text.toLowerCase().includes('email') || 
                     text.toLowerCase().includes('signin'))) {
          console.log(`Clicking button: "${text}"`);
          await button.click();
          await page.waitForTimeout(1500);
          
          const usernameInput = page.locator('input[type="text"], input[name="username"]').first();
          if (await usernameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('✅ Manual login form revealed');
            await usernameInput.fill('guillermotabligan');
            const passwordInput = page.locator('input[type="password"]').first();
            await passwordInput.fill('water123');
            
            const submitBtn = page.locator('button[type="submit"], button:has-text("Sign")').first();
            await submitBtn.click();
            loginSuccessful = true;
            break;
          }
        }
      }
    } catch (e) {
      console.log('❌ Manual login reveal failed:', e.message);
    }
  }
  
  if (loginSuccessful) {
    console.log('✅ Login form submitted, waiting for authentication');
    
    // Wait for authentication to complete
    try {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      console.log('✅ Redirected to dashboard successfully');
    } catch {
      console.log('⚠️ Dashboard redirect timeout, checking current URL');
      console.log(`Current URL: ${page.url()}`);
    }
    
    // Wait for auth tokens to be processed
    await page.waitForTimeout(3000);
  } else {
    console.log('❌ Login could not be completed automatically');
  }

  console.log('🎯 Step 3: Navigate to HRIS page');
  await page.goto('http://localhost:9000/#/member/manpower/hris');
  await page.waitForLoadState('networkidle');
  
  // Wait longer for API calls to complete
  console.log('⏳ Waiting for API calls to complete...');
  await page.waitForTimeout(10000);
  
  console.log('🎯 Step 4: Trigger explicit EmployeeData requests');
  
  // Try to trigger data loading by interacting with page elements
  try {
    // Look for tabs or buttons that might trigger EmployeeData loading
    const tabs = page.locator('[role="tab"], .q-tab, [data-testid*="tab"]');
    const tabCount = await tabs.count();
    console.log(`Found ${tabCount} tabs to try`);
    
    for (let i = 0; i < Math.min(tabCount, 3); i++) {
      const tab = tabs.nth(i);
      const tabText = await tab.textContent().catch(() => '');
      console.log(`Clicking tab ${i + 1}: "${tabText}"`);
      await tab.click().catch(() => {});
      await page.waitForTimeout(3000);
    }
  } catch (e) {
    console.log('Tab interaction failed:', e.message);
  }
  
  // Try to refresh data by clicking refresh buttons
  try {
    const refreshBtns = page.locator('[data-testid*="refresh"], button:has-text("Refresh"), .refresh');
    const refreshCount = await refreshBtns.count();
    if (refreshCount > 0) {
      console.log(`Found ${refreshCount} refresh buttons, clicking first one`);
      await refreshBtns.first().click();
      await page.waitForTimeout(5000);
    }
  } catch (e) {
    console.log('Refresh button interaction failed:', e.message);
  }

  console.log('🎯 Step 5: Analyze detailed results');
  
  // Analyze network requests for EmployeeData specifically
  const employeeDataRequests = failedRequests.filter(req => 
    req.url.includes('EmployeeData')
  );
  
  const employeeDataSuccessRequests = successfulRequests.filter(req => 
    req.url.includes('EmployeeData')
  );
  
  // Look for Authorization headers in failed requests
  const authHeaderIssues = [];
  employeeDataRequests.forEach(req => {
    if (!req.headers['authorization'] && !req.headers['Authorization']) {
      authHeaderIssues.push(`Missing Authorization header: ${req.url}`);
    }
  });
  
  console.log('\n📊 COMPREHENSIVE ANALYSIS:');
  console.log(`Total network requests: ${networkRequests.length}`);
  console.log(`Successful requests: ${successfulRequests.length}`);
  console.log(`Failed requests: ${failedRequests.length}`);
  console.log(`EmployeeData failed requests: ${employeeDataRequests.length}`);
  console.log(`EmployeeData successful requests: ${employeeDataSuccessRequests.length}`);
  console.log(`Permission denied console errors: ${permissionErrors.length}`);
  console.log(`Authorization header issues: ${authHeaderIssues.length}`);
  
  if (employeeDataRequests.length > 0) {
    console.log('\n❌ FAILED EMPLOYEEDATA REQUESTS:');
    employeeDataRequests.forEach((req, index) => {
      console.log(`\n${index + 1}. ${req.method} ${req.url}`);
      console.log(`   Status: ${req.status} ${req.statusText}`);
      console.log(`   Authorization header: ${req.headers['authorization'] || req.headers['Authorization'] || 'MISSING'}`);
      console.log(`   Response: ${req.body.substring(0, 200)}...`);
    });
  }
  
  if (employeeDataSuccessRequests.length > 0) {
    console.log('\n✅ SUCCESSFUL EMPLOYEEDATA REQUESTS:');
    employeeDataSuccessRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.method} ${req.url} - ${req.status}`);
    });
  }
  
  if (permissionErrors.length > 0) {
    console.log('\n❌ PERMISSION ERRORS IN CONSOLE:');
    permissionErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  if (authHeaderIssues.length > 0) {
    console.log('\n⚠️ AUTHORIZATION HEADER ISSUES:');
    authHeaderIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  // Take screenshots for debugging
  await page.screenshot({ path: 'debug/hris-page-detailed.png', fullPage: true });
  
  // Summary and assertions
  const totalEmployeeDataErrors = employeeDataRequests.length + permissionErrors.filter(err => 
    err.includes('EmployeeData')
  ).length;
  
  console.log(`\n🎯 FINAL RESULT: ${totalEmployeeDataErrors === 0 ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Total EmployeeData-related errors: ${totalEmployeeDataErrors}`);
  
  if (totalEmployeeDataErrors > 0) {
    console.log('\n🔧 DEBUGGING INFO TO INVESTIGATE:');
    console.log('1. Check if JWT token is being sent in Authorization headers');
    console.log('2. Verify RLS policies for EmployeeData table');
    console.log('3. Check if user has correct companyId in JWT metadata');
    console.log('4. Verify X-Source header is being sent for frontend identification');
  }
  
  // This test expects NO EmployeeData errors after login
  expect(totalEmployeeDataErrors, `Still found ${totalEmployeeDataErrors} EmployeeData permission errors after login`).toBe(0);
});