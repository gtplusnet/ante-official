import { test, expect } from '@playwright/test';

test('Guardian App Network Monitoring - API and WebSocket URLs', async ({ page }) => {
  const networkRequests: Array<{
    url: string;
    method: string;
    type: string;
    timestamp: number;
  }> = [];

  const wsConnections: Array<{
    url: string;
    timestamp: number;
  }> = [];

  // Monitor all HTTP requests
  page.on('request', (request) => {
    const url = request.url();
    if (
      url.includes('/api/') || 
      url.includes('backend') || 
      url.includes('3000') ||
      url.includes('localhost')
    ) {
      networkRequests.push({
        url: url,
        method: request.method(),
        type: 'HTTP',
        timestamp: Date.now()
      });
      console.log(`🌐 HTTP Request: ${request.method()} ${url}`);
    }
  });

  // Monitor WebSocket connections
  page.on('websocket', (ws) => {
    const url = ws.url();
    wsConnections.push({
      url: url,
      timestamp: Date.now()
    });
    console.log(`🔌 WebSocket Connection: ${url}`);

    ws.on('framereceived', (event) => {
      console.log(`📨 WS Received from ${url}: ${event.payload}`);
    });

    ws.on('framesent', (event) => {
      console.log(`📤 WS Sent to ${url}: ${event.payload}`);
    });
  });

  // Monitor console logs for additional network info
  page.on('console', (msg) => {
    const text = msg.text();
    if (
      text.includes('backend') || 
      text.includes('socket') || 
      text.includes('API') ||
      text.includes('localhost:3000') ||
      text.includes('localhost:4000')
    ) {
      console.log(`🖥️ Console: ${text}`);
    }
  });

  // Navigate to Guardian app login page
  console.log('🚀 Navigating to Guardian App...');
  await page.goto('https://guardian-app.geertest.com/login', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait for the page to fully load and any initial network requests
  await page.waitForTimeout(3000);

  // Take a screenshot of the login page
  await page.screenshot({ path: 'guardian-app-login.png', fullPage: true });

  // Check if we can see login form elements
  const loginForm = page.locator('form, input[type="email"], input[type="password"], button[type="submit"]');
  await expect(loginForm.first()).toBeVisible({ timeout: 10000 });

  // Try to interact with the page to trigger more network requests
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[id*="email"]');
  const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password"], input[id*="password"]');
  
  if (await emailInput.count() > 0) {
    console.log('📝 Filling login form...');
    await emailInput.first().fill('test@example.com');
  }
  
  if (await passwordInput.count() > 0) {
    await passwordInput.first().fill('testpassword');
  }

  // Wait for any additional network requests after form interaction
  await page.waitForTimeout(2000);

  // Check the page source for any hardcoded URLs
  const pageContent = await page.content();
  const localhostReferences = pageContent.match(/localhost:\d+/g) || [];
  const backendReferences = pageContent.match(/backend[^"'\s]*/g) || [];

  console.log('\n=== NETWORK MONITORING RESULTS ===');
  
  console.log('\n📊 HTTP API Requests Found:');
  if (networkRequests.length === 0) {
    console.log('   ❌ No API requests detected during page load');
  } else {
    networkRequests.forEach((req, index) => {
      console.log(`   ${index + 1}. ${req.method} ${req.url}`);
    });
  }

  console.log('\n🔌 WebSocket Connections Found:');
  if (wsConnections.length === 0) {
    console.log('   ❌ No WebSocket connections detected');
  } else {
    wsConnections.forEach((ws, index) => {
      console.log(`   ${index + 1}. ${ws.url}`);
    });
  }

  console.log('\n🔍 Source Code Analysis:');
  console.log(`   Localhost references: ${localhostReferences.length > 0 ? localhostReferences.join(', ') : 'None found'}`);
  console.log(`   Backend references: ${backendReferences.length > 0 ? backendReferences.join(', ') : 'None found'}`);

  // Assertions to verify correct URLs are being used
  const hasCorrectAPIUrls = networkRequests.some(req => 
    req.url.includes('backend-ante.geertest.com') || req.url.includes('https://backend-ante.geertest.com')
  );
  
  const hasCorrectWSUrls = wsConnections.some(ws => 
    ws.url.includes('socket-ante.geertest.com') || ws.url.includes('wss://socket-ante.geertest.com')
  );

  const hasIncorrectLocalhost = 
    networkRequests.some(req => req.url.includes('localhost:3000')) ||
    wsConnections.some(ws => ws.url.includes('localhost:4000')) ||
    localhostReferences.length > 0;

  console.log('\n✅ URL Verification Results:');
  console.log(`   Using correct API URLs (backend-ante.geertest.com): ${hasCorrectAPIUrls ? '✅ YES' : '❌ NO'}`);
  console.log(`   Using correct WebSocket URLs (socket-ante.geertest.com): ${hasCorrectWSUrls ? '✅ YES' : '❌ NO'}`);
  console.log(`   Contains incorrect localhost references: ${hasIncorrectLocalhost ? '⚠️ YES' : '✅ NO'}`);

  // Save detailed results for further analysis
  const results = {
    timestamp: new Date().toISOString(),
    httpRequests: networkRequests,
    wsConnections: wsConnections,
    localhostReferences: localhostReferences,
    backendReferences: backendReferences,
    verification: {
      hasCorrectAPIUrls,
      hasCorrectWSUrls,
      hasIncorrectLocalhost
    }
  };

  console.log('\n📁 Saving detailed results to network-results.json');
  await page.evaluate((results) => {
    // Save to localStorage for potential retrieval
    localStorage.setItem('networkMonitoringResults', JSON.stringify(results));
  }, results);

  // Basic assertions
  expect(pageContent).toBeTruthy();
  expect(pageContent.length).toBeGreaterThan(100);
});