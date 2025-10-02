import { test } from '@playwright/test';

test('Verify content types load correctly in ContentManager', async ({ page }) => {
  console.log('🧪 Testing content types loading fix...');
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`BROWSER: ${msg.text()}`);
  });

  // Navigate to login
  await page.goto('http://localhost:9000');
  
  // Login
  await page.fill('input[data-cy="username"]', 'guillermotabligan');
  await page.fill('input[data-cy="password"]', 'water123');
  await page.click('button[type="submit"]');
  
  // Wait for login success and navigate to CMS
  await page.waitForURL('**/dashboard');
  console.log('✅ Login successful');
  
  // Navigate to Content Manager
  await page.goto('http://localhost:9000/member/cms/content-manager');
  await page.waitForTimeout(2000);
  console.log('📄 Navigated to Content Manager');
  
  // Check for content types loading debug messages
  await page.waitForTimeout(3000);
  
  // Check if sidebar has content types
  const sidebarItems = await page.locator('.content-types-list .content-type-item');
  const sidebarCount = await sidebarItems.count();
  console.log(`📋 Found ${sidebarCount} content type(s) in sidebar`);
  
  if (sidebarCount > 0) {
    console.log('✅ Content types are loading in sidebar');
    
    // Try clicking the first content type
    const firstContentType = sidebarItems.first();
    const contentTypeName = await firstContentType.textContent();
    console.log(`🖱️ Clicking on content type: ${contentTypeName}`);
    
    await firstContentType.click();
    await page.waitForTimeout(2000);
    
    // Check if content area shows data or at least doesn't crash
    const hasError = await page.locator('.text-negative, .error').count();
    
    if (hasError === 0) {
      console.log('✅ No errors in content area after selection');
    } else {
      console.log('❌ Found errors in content area');
    }
    
  } else {
    console.log('❌ No content types found in sidebar - loading may have failed');
  }
  
  // Take a screenshot for debugging
  await page.screenshot({ 
    path: '/home/jdev/projects/ante/debug/content-types-loading-test.png', 
    fullPage: true 
  });
  console.log('📸 Screenshot saved to debug/content-types-loading-test.png');
});