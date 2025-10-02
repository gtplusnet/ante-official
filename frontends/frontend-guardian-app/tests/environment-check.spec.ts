import { test, expect } from '@playwright/test';

test('Guardian App Environment Configuration Check', async ({ page }) => {
  console.log('🌍 Testing Guardian App Environment Configuration...\n');

  // Navigate to the staging Guardian app
  await page.goto('https://guardian-app.geertest.com/login', { 
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Check if page loaded successfully
  await expect(page).toHaveTitle(/Guardian|Geer|Login/, { timeout: 10000 });

  // Extract environment variables from the client-side
  const envInfo = await page.evaluate(() => {
    // Try to access window object for any exposed environment variables
    const windowEnv = (window as any).__NEXT_DATA__?.props?.pageProps || {};
    
    return {
      windowEnv,
      userAgent: navigator.userAgent,
      url: window.location.href,
      origin: window.location.origin,
    };
  });

  console.log('🔧 Environment Information:');
  console.log('   Current URL:', envInfo.url);
  console.log('   Origin:', envInfo.origin);
  console.log('   Window Environment:', JSON.stringify(envInfo.windowEnv, null, 2));

  // Check network requests to see actual API calls
  const networkRequests: string[] = [];
  const consoleMessages: string[] = [];

  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('api') || url.includes('backend') || url.includes('socket') || url.includes('3000') || url.includes('4000')) {
      networkRequests.push(`${request.method()} ${url}`);
      console.log(`📡 Network Request: ${request.method()} ${url}`);
    }
  });

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('Socket') || text.includes('API') || text.includes('backend') || text.includes('localhost')) {
      consoleMessages.push(text);
      console.log(`🖥️  Console: ${text}`);
    }
  });

  // Try to trigger some network activity
  // Fill the login form if available
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[id*="email"]');
  const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password"], input[id*="password"]');
  
  if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
    console.log('📝 Testing login form interaction...');
    await emailInput.first().fill('test@example.com');
    await passwordInput.first().fill('testpassword');
    
    // Don't actually submit, just trigger potential API validation
    await page.waitForTimeout(2000);
  }

  // Check if there are any client-side configuration files accessible
  try {
    // Try to access the version API endpoint that we saw in the previous test
    const versionResponse = await page.request.get('https://guardian-app.geertest.com/api/version');
    if (versionResponse.ok()) {
      const versionData = await versionResponse.json();
      console.log('📋 Version API Response:', JSON.stringify(versionData, null, 2));
    }
  } catch (error) {
    console.log('❌ Could not access version API:', error.message);
  }

  // Check the page source for any hardcoded URLs or environment variables
  const pageSource = await page.content();
  const localhostReferences = pageSource.match(/localhost:\d+/g) || [];
  const backendReferences = pageSource.match(/backend[^"'\s]*\.geertest\.com/g) || [];
  const socketReferences = pageSource.match(/socket[^"'\s]*\.geertest\.com/g) || [];
  const wsReferences = pageSource.match(/w*s?s?:\/\/[^"'\s]*\.(geertest\.com|localhost):\d*/g) || [];

  console.log('\n🔍 Source Code Analysis:');
  console.log(`   Localhost references: ${localhostReferences.length > 0 ? localhostReferences : 'None found'}`);
  console.log(`   Backend references: ${backendReferences.length > 0 ? backendReferences : 'None found'}`);  
  console.log(`   Socket references: ${socketReferences.length > 0 ? socketReferences : 'None found'}`);
  console.log(`   WebSocket references: ${wsReferences.length > 0 ? wsReferences : 'None found'}`);

  console.log('\n📊 Network Activity Summary:');
  if (networkRequests.length > 0) {
    networkRequests.forEach((req, index) => {
      console.log(`   ${index + 1}. ${req}`);
    });
  } else {
    console.log('   No relevant network requests detected');
  }

  console.log('\n💬 Console Messages Summary:');
  if (consoleMessages.length > 0) {
    consoleMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. ${msg}`);
    });
  } else {
    console.log('   No relevant console messages detected');
  }

  // Analysis and Recommendations
  console.log('\n📋 ANALYSIS & RECOMMENDATIONS:');
  
  const hasCorrectBackend = networkRequests.some(req => req.includes('backend-ante.geertest.com'));
  const hasIncorrectLocalhost = 
    networkRequests.some(req => req.includes('localhost:3000')) ||
    consoleMessages.some(msg => msg.includes('localhost:3000')) ||
    localhostReferences.length > 0;

  const hasCorrectSocket = 
    consoleMessages.some(msg => msg.includes('socket-ante.geertest.com')) ||
    socketReferences.length > 0;
  
  const hasIncorrectSocketLocalhost = 
    consoleMessages.some(msg => msg.includes('localhost:4000')) ||
    pageSource.includes('localhost:4000');

  console.log(`✅ Backend API Configuration:`);
  console.log(`   - Using correct backend URL (backend-ante.geertest.com): ${hasCorrectBackend ? '✅ YES' : '❌ NO'}`);
  console.log(`   - Contains localhost references: ${hasIncorrectLocalhost ? '⚠️  YES - NEEDS FIXING' : '✅ NO'}`);

  console.log(`✅ WebSocket Configuration:`);
  console.log(`   - Using correct socket URL (socket-ante.geertest.com): ${hasCorrectSocket ? '✅ YES' : '❌ NO'}`);  
  console.log(`   - Contains localhost socket references: ${hasIncorrectSocketLocalhost ? '⚠️  YES - NEEDS FIXING' : '✅ NO'}`);

  // Final recommendation
  if (hasIncorrectLocalhost || hasIncorrectSocketLocalhost) {
    console.log('\n🔧 REQUIRED FIXES:');
    if (hasIncorrectLocalhost) {
      console.log('   - API is still pointing to localhost:3000 instead of backend-ante.geertest.com');
    }
    if (hasIncorrectSocketLocalhost) {
      console.log('   - WebSocket is still pointing to localhost:4000 instead of wss://socket-ante.geertest.com');
    }
    console.log('   - The staging deployment needs to use production environment variables');
    console.log('   - Verify that .env.production is being used during build process');
  } else if (hasCorrectBackend && hasCorrectSocket) {
    console.log('\n✅ CONFIGURATION IS CORRECT - No issues found');
  } else {
    console.log('\n⚠️  PARTIAL CONFIGURATION - Some URLs are correct, others need verification');
  }

  // Make sure the test passes even if configurations are wrong (we're just reporting)
  expect(pageSource.length).toBeGreaterThan(100);
});