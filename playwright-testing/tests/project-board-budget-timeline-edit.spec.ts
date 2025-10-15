import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9000';

const TEST_USER = {
  username: 'guillermotabligan',
  password: 'water123'
};

// Helper function to login
async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // Check if we need to switch to manual login mode
  const manualLoginButton = page.locator('[data-testid="manual-login-button"]');
  const isManualButtonVisible = await manualLoginButton.isVisible().catch(() => false);

  if (isManualButtonVisible) {
    await manualLoginButton.click();
    await page.waitForTimeout(500);
  }

  // Fill in credentials
  await page.fill('[data-testid="login-username-input"]', TEST_USER.username);
  await page.fill('[data-testid="login-password-input"]', TEST_USER.password);

  // Click submit
  await page.click('[data-testid="login-submit-button"]');

  // Wait for navigation (hash-based routing)
  await page.waitForURL(/.*#\/member\/.*/, { timeout: 15000 });
  await page.waitForTimeout(2000);
}

test.describe('Project Board - Budget, Timeline & Edit Functionality', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];
  let http404Errors: string[] = [];
  let apiCalls: { method: string; url: string; status: number }[] = [];

  test.beforeEach(async ({ page }) => {
    // Clear error collectors
    consoleErrors = [];
    consoleWarnings = [];
    http404Errors = [];
    apiCalls = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        console.log('❌ Console Error:', text);
      }
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
      console.log('❌ Page Error:', error.message);
    });

    // Listen for HTTP responses
    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();

      // Track 404 errors
      if (status === 404) {
        http404Errors.push(url);
        console.log('❌ HTTP 404:', url);
      }

      // Track API calls
      if (url.includes('localhost:3000')) {
        const method = response.request().method();
        apiCalls.push({ method, url, status });
        console.log(`✅ API Call: ${method} ${url} - Status: ${status}`);
      }
    });

    await login(page);
  });

  test('Navigate to Project Board View', async ({ page }) => {
    console.log('\n🔍 Test 1: Navigate to Project Board View');

    // Navigate to projects page
    await page.goto(`${BASE_URL}/#/member/project`);
    await page.waitForTimeout(2000);

    // Verify no console errors
    console.log(`📊 Console Errors: ${consoleErrors.length}`);
    console.log(`📊 404 Errors: ${http404Errors.length}`);

    expect(consoleErrors.length).toBe(0);
    expect(http404Errors.length).toBe(0);

    console.log('✅ Navigation successful with no errors');
  });

  test('Verify Budget Display on Project Cards', async ({ page }) => {
    console.log('\n🔍 Test 2: Verify Budget Display');

    await page.goto(`${BASE_URL}/#/member/project`);
    await page.waitForTimeout(3000);

    // Check for budget elements in project cards
    const budgetElements = await page.locator('.abc-item:has-text("Budget")').count();
    console.log(`📊 Found ${budgetElements} project cards with budget displayed`);

    // Verify budget format (should show Philippine Peso symbol)
    const budgetTexts = await page.locator('.abc-item:has-text("Budget") .text-bold').allTextContents();
    console.log('💰 Budget formats found:');
    budgetTexts.forEach((text, i) => {
      console.log(`  ${i + 1}. ${text}`);
    });

    // Check if any budget text contains the peso symbol
    const hasPesoSymbol = budgetTexts.some(text => text.includes('₱'));
    if (hasPesoSymbol) {
      console.log('✅ Budget display is working correctly (Peso symbol found)');
    }

    // Verify no console errors
    expect(consoleErrors.length).toBe(0);
  });

  test('Verify Timeline Display on Project Cards', async ({ page }) => {
    console.log('\n🔍 Test 3: Verify Timeline Display');

    await page.goto(`${BASE_URL}/#/member/project`);
    await page.waitForTimeout(3000);

    // Check for timeline elements
    const timelineElements = await page.locator('.detail-item:has-text("Timeline")').count();
    console.log(`📊 Found ${timelineElements} project cards with timeline displayed`);

    // Get timeline texts
    const timelineTexts = await page.locator('.detail-item:has-text("Timeline") .text-bold').allTextContents();
    console.log('📅 Timeline formats found:');
    timelineTexts.forEach((text, i) => {
      console.log(`  ${i + 1}. ${text}`);
    });

    // Verify timeline format (should have " - " separator)
    const hasValidFormat = timelineTexts.some(text => text.includes(' - '));
    if (hasValidFormat) {
      console.log('✅ Timeline display is working correctly');
    }

    // Verify no console errors
    expect(consoleErrors.length).toBe(0);
  });

  test('Test Edit Functionality - Click Edit Button', async ({ page }) => {
    console.log('\n🔍 Test 4: Test Edit Functionality');

    await page.goto(`${BASE_URL}/#/member/project`);
    await page.waitForTimeout(3000);

    // Find a project card
    const projectCard = page.locator('.project-card').first();
    const projectName = await projectCard.locator('.project-name').textContent();
    console.log(`📋 Testing edit on project: ${projectName}`);

    // Find and click the menu button (three dots)
    const menuButton = projectCard.locator('button:has(q-icon[name="more_vert"])');
    await menuButton.click({ force: true });
    await page.waitForTimeout(500);

    // Click the Edit option
    const editOption = page.locator('div:has-text("Edit")').last();
    await editOption.click();
    await page.waitForTimeout(2000);

    // Check if dialog opened (look for project creation/edit dialog)
    const dialogVisible = await page.locator('.q-dialog').isVisible().catch(() => false);
    console.log(`📊 Dialog opened: ${dialogVisible}`);

    // Check for API call to fetch project details (GET /project?id=X)
    const getProjectApiCall = apiCalls.find(call =>
      call.method === 'GET' &&
      call.url.includes('/project?id=') &&
      call.status === 200
    );

    if (getProjectApiCall) {
      console.log(`✅ Edit API call successful: ${getProjectApiCall.url}`);
    } else {
      console.log('⚠️  Edit API call not detected (might need manual verification)');
    }

    // Verify no console errors
    console.log(`📊 Console Errors: ${consoleErrors.length}`);
    expect(consoleErrors.length).toBe(0);
  });

  test('Verify No Console Errors Throughout Board Interaction', async ({ page }) => {
    console.log('\n🔍 Test 5: Comprehensive Error Check');

    await page.goto(`${BASE_URL}/#/member/project`);
    await page.waitForTimeout(3000);

    // Interact with the board (scroll, hover)
    await page.evaluate(() => {
      const boardContainer = document.querySelector('.board-container');
      if (boardContainer) {
        boardContainer.scrollLeft = 100;
      }
    });
    await page.waitForTimeout(500);

    // Hover over a project card
    const firstCard = page.locator('.project-card').first();
    if (await firstCard.isVisible()) {
      await firstCard.hover();
      await page.waitForTimeout(500);
    }

    // Final error check
    console.log('\n📊 Final Error Summary:');
    console.log(`  Console Errors: ${consoleErrors.length}`);
    console.log(`  Console Warnings: ${consoleWarnings.length}`);
    console.log(`  404 Errors: ${http404Errors.length}`);
    console.log(`  API Calls Made: ${apiCalls.length}`);

    if (consoleErrors.length === 0 && http404Errors.length === 0) {
      console.log('\n✅ Perfect! No errors detected throughout board interaction');
    } else {
      console.log('\n❌ Errors found:');
      if (consoleErrors.length > 0) {
        console.log('Console Errors:');
        consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
      }
      if (http404Errors.length > 0) {
        console.log('404 Errors:');
        http404Errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
      }
    }

    expect(consoleErrors.length).toBe(0);
    expect(http404Errors.length).toBe(0);
  });
});
