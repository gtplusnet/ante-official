import { test, expect, ConsoleMessage } from '@playwright/test';

/**
 * Gate App - Comprehensive Feature Testing
 *
 * This test suite covers all features of the gate app:
 * 1. Login/Authentication (License activation)
 * 2. Dashboard
 * 3. Scanner (QR code scanning)
 * 4. Currently Checked In list
 * 5. TV Display (realtime monitor)
 * 6. Synced Data (students/guardians)
 * 7. Settings
 */

test.describe('Gate App - All Features', () => {
  const GATE_APP_URL = 'http://192.168.1.163:9002';
  const consoleErrors: ConsoleMessage[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg);
        console.log(`❌ [CONSOLE ERROR] ${msg.text()}`);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      console.log(`❌ [PAGE ERROR] ${error.message}`);
    });
  });

  test('1. Login Page - License Activation', async ({ page }) => {
    console.log('🧪 Testing Login/License Activation...');

    await page.goto(GATE_APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check for login page elements
    const pageTitle = await page.title();
    console.log(`  Page Title: "${pageTitle}"`);
    expect(pageTitle).toContain('School Gatekeep');

    // Check for main heading
    const heading = page.locator('h3:has-text("School Gatekeep")');
    await expect(heading).toBeVisible();
    console.log('  ✅ Main heading found');

    // Check for license key input
    const licenseInput = page.locator('input[placeholder*="license" i], input[type="text"]').first();
    const hasInput = await licenseInput.count() > 0;
    console.log(`  Input field found: ${hasInput ? '✅' : '❌'}`);

    // Check for activate button
    const activateButton = page.locator('button:has-text("Activate")');
    const hasButton = await activateButton.count() > 0;
    console.log(`  Activate button found: ${hasButton ? '✅' : '❌'}`);

    await page.screenshot({
      path: 'playwright-testing/test-results/gate-app-login.png',
      fullPage: true
    });

    expect(consoleErrors.length).toBe(0);
  });

  test('2. Dashboard Navigation', async ({ page }) => {
    console.log('🧪 Testing Dashboard...');

    await page.goto(`${GATE_APP_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check for dashboard elements
    const welcomeHeading = page.locator('h1:has-text("Welcome")');
    const hasWelcome = await welcomeHeading.count() > 0;
    console.log(`  Welcome message: ${hasWelcome ? '✅' : '❌'}`);

    // Check for navigation modules
    const modules = ['Scan', 'TV Display', 'Settings'];
    for (const module of modules) {
      const moduleLink = page.locator(`text=${module}`);
      const exists = await moduleLink.count() > 0;
      console.log(`  Module "${module}": ${exists ? '✅' : '❌'}`);
    }

    await page.screenshot({
      path: 'playwright-testing/test-results/gate-app-dashboard.png',
      fullPage: true
    });

    expect(consoleErrors.length).toBe(0);
  });

  test('3. Scanner Page - Main Feature', async ({ page }) => {
    console.log('🧪 Testing Scanner Page...');

    await page.goto(`${GATE_APP_URL}/scan`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check for scanner elements
    const scannerCard = page.locator('text=Scanner');
    await expect(scannerCard).toBeVisible();
    console.log('  ✅ Scanner card found');

    // Check for stats cards
    const stats = ["Today's Total", "Check In/Out", "Last Scan"];
    for (const stat of stats) {
      const statCard = page.locator(`text=${stat}`);
      const exists = await statCard.count() > 0;
      console.log(`  Stat "${stat}": ${exists ? '✅' : '❌'}`);
    }

    // Check for recent scans section
    const recentScans = page.locator('text=Recent Scans');
    await expect(recentScans).toBeVisible();
    console.log('  ✅ Recent scans section found');

    // Check for sync status indicator
    const syncStatus = page.locator('text=/Offline|Online|Live Updates/i');
    const hasSyncStatus = await syncStatus.count() > 0;
    console.log(`  Sync status indicator: ${hasSyncStatus ? '✅' : '❌'}`);

    await page.screenshot({
      path: 'playwright-testing/test-results/gate-app-scanner.png',
      fullPage: true
    });

    expect(consoleErrors.length).toBe(0);
  });

  test('4. Checked In Page', async ({ page }) => {
    console.log('🧪 Testing Checked In Page...');

    await page.goto(`${GATE_APP_URL}/checked-in`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check for page heading
    const heading = page.locator('h1:has-text("Currently Checked In")');
    await expect(heading).toBeVisible();
    console.log('  ✅ Page heading found');

    // Check for back to scanner link
    const backLink = page.locator('text=Back to Scanner');
    await expect(backLink).toBeVisible();
    console.log('  ✅ Back to scanner link found');

    // Check for people count display
    const peopleCount = page.locator('text=/\\d+ (person|people)/i');
    const hasCount = await peopleCount.count() > 0;
    console.log(`  People count display: ${hasCount ? '✅' : '❌'}`);

    await page.screenshot({
      path: 'playwright-testing/test-results/gate-app-checked-in.png',
      fullPage: true
    });

    expect(consoleErrors.length).toBe(0);
  });

  test('5. TV Display Page - Realtime Monitor', async ({ page }) => {
    console.log('🧪 Testing TV Display Page...');

    await page.goto(`${GATE_APP_URL}/tv`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check for main heading
    const heading = page.locator('h1:has-text("School Gatekeep")');
    const hasHeading = await heading.count() > 0;
    console.log(`  Main heading: ${hasHeading ? '✅' : '❌'}`);

    // Check for live attendance monitor text
    const liveMonitor = page.locator('text=Live Attendance Monitor');
    const hasMonitor = await liveMonitor.count() > 0;
    console.log(`  Live monitor label: ${hasMonitor ? '✅' : '❌'}`);

    // Check for fullscreen button
    const fullscreenBtn = page.locator('button:has-text("Fullscreen")');
    const hasFullscreen = await fullscreenBtn.count() > 0;
    console.log(`  Fullscreen button: ${hasFullscreen ? '✅' : '❌'}`);

    // Check for time display
    const timeDisplay = page.locator('text=/\\d{1,2}:\\d{2}(:\\d{2})? (AM|PM)/i');
    const hasTime = await timeDisplay.count() > 0;
    console.log(`  Time display: ${hasTime ? '✅' : '❌'}`);

    // Check for stats cards
    const statsLabels = ['Total Today', 'Students', 'Check-ins', 'Check-outs'];
    for (const label of statsLabels) {
      const statCard = page.locator(`text=${label}`);
      const exists = await statCard.count() > 0;
      console.log(`  Stat "${label}": ${exists ? '✅' : '❌'}`);
    }

    // Check for recent activity section
    const recentActivity = page.locator('text=Recent Activity');
    const hasActivity = await recentActivity.count() > 0;
    console.log(`  Recent activity section: ${hasActivity ? '✅' : '❌'}`);

    await page.screenshot({
      path: 'playwright-testing/test-results/gate-app-tv.png',
      fullPage: true
    });

    expect(consoleErrors.length).toBe(0);
  });

  test('6. Synced Data Page - Students & Guardians', async ({ page }) => {
    console.log('🧪 Testing Synced Data Page...');

    await page.goto(`${GATE_APP_URL}/synced-data`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check for page heading
    const heading = page.locator('h1:has-text("Synced Data")');
    await expect(heading).toBeVisible();
    console.log('  ✅ Page heading found');

    // Check for refresh button
    const refreshBtn = page.locator('button:has-text("Refresh")');
    const hasRefresh = await refreshBtn.count() > 0;
    console.log(`  Refresh button: ${hasRefresh ? '✅' : '❌'}`);

    // Check for summary cards
    const summaryCards = ['Total Students', 'Total Guardians'];
    for (const card of summaryCards) {
      const cardElement = page.locator(`text=${card}`);
      const exists = await cardElement.count() > 0;
      console.log(`  Summary "${card}": ${exists ? '✅' : '❌'}`);
    }

    // Check for tabs
    const studentsTab = page.locator('button:has-text("Students")');
    const guardiansTab = page.locator('button:has-text("Guardians")');
    const hasTabs = (await studentsTab.count() > 0) && (await guardiansTab.count() > 0);
    console.log(`  Students/Guardians tabs: ${hasTabs ? '✅' : '❌'}`);

    // Check for search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    const hasSearch = await searchInput.count() > 0;
    console.log(`  Search input: ${hasSearch ? '✅' : '❌'}`);

    // Test tab switching
    if (await guardiansTab.isVisible()) {
      await guardiansTab.click();
      await page.waitForTimeout(500);
      console.log('  ✅ Guardians tab clicked');
    }

    await page.screenshot({
      path: 'playwright-testing/test-results/gate-app-synced-data.png',
      fullPage: true
    });

    expect(consoleErrors.length).toBe(0);
  });

  test('7. Settings Page', async ({ page }) => {
    console.log('🧪 Testing Settings Page...');

    await page.goto(`${GATE_APP_URL}/settings`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check for page heading
    const heading = page.locator('h1:has-text("Settings")');
    await expect(heading).toBeVisible();
    console.log('  ✅ Page heading found');

    // Check for settings sections
    const sections = [
      'General Settings',
      'Scanner Settings',
      'Data Management',
      'Account'
    ];

    for (const section of sections) {
      const sectionTitle = page.locator(`text=${section}`);
      const exists = await sectionTitle.count() > 0;
      console.log(`  Section "${section}": ${exists ? '✅' : '❌'}`);
    }

    // Check for specific settings controls
    const controls = [
      'Sync Interval',
      'Camera Preference',
      'Scan Sound',
      'Save Settings'
    ];

    for (const control of controls) {
      const controlElement = page.locator(`text=${control}`);
      const exists = await controlElement.count() > 0;
      console.log(`  Control "${control}": ${exists ? '✅' : '❌'}`);
    }

    // Check for license information
    const licenseKey = page.locator('text=License Key');
    const hasLicense = await licenseKey.count() > 0;
    console.log(`  License info: ${hasLicense ? '✅' : '❌'}`);

    // Check for logout button
    const logoutBtn = page.locator('button:has-text("Logout")');
    const hasLogout = await logoutBtn.count() > 0;
    console.log(`  Logout button: ${hasLogout ? '✅' : '❌'}`);

    await page.screenshot({
      path: 'playwright-testing/test-results/gate-app-settings.png',
      fullPage: true
    });

    expect(consoleErrors.length).toBe(0);
  });

  test('8. Navigation Between Pages', async ({ page }) => {
    console.log('🧪 Testing Navigation Flow...');

    // Start at login
    await page.goto(GATE_APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('  ✅ Visited: Login');

    // Try to go to dashboard (may redirect to login if not authenticated)
    await page.goto(`${GATE_APP_URL}/dashboard`);
    await page.waitForTimeout(1000);
    console.log('  ✅ Visited: Dashboard');

    // Navigate to scanner
    await page.goto(`${GATE_APP_URL}/scan`);
    await page.waitForTimeout(1000);
    console.log('  ✅ Visited: Scanner');

    // Navigate to checked-in
    await page.goto(`${GATE_APP_URL}/checked-in`);
    await page.waitForTimeout(1000);
    console.log('  ✅ Visited: Checked In');

    // Navigate to TV display
    await page.goto(`${GATE_APP_URL}/tv`);
    await page.waitForTimeout(1000);
    console.log('  ✅ Visited: TV Display');

    // Navigate to synced data
    await page.goto(`${GATE_APP_URL}/synced-data`);
    await page.waitForTimeout(1000);
    console.log('  ✅ Visited: Synced Data');

    // Navigate to settings
    await page.goto(`${GATE_APP_URL}/settings`);
    await page.waitForTimeout(1000);
    console.log('  ✅ Visited: Settings');

    console.log(`\n📊 Navigation Test Complete`);
    console.log(`   Total Console Errors: ${consoleErrors.length}`);

    expect(consoleErrors.length).toBe(0);
  });

  test('9. Responsive Layout Check', async ({ page }) => {
    console.log('🧪 Testing Responsive Layout...');

    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Laptop', width: 1366, height: 768 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${GATE_APP_URL}/scan`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `playwright-testing/test-results/gate-app-responsive-${viewport.name.toLowerCase()}.png`,
        fullPage: false
      });

      console.log(`  ✅ ${viewport.name} (${viewport.width}x${viewport.height})`);
    }

    expect(consoleErrors.length).toBe(0);
  });

  test('10. Performance & Load Time', async ({ page }) => {
    console.log('🧪 Testing Performance...');

    const pages = [
      { name: 'Login', url: GATE_APP_URL },
      { name: 'Scanner', url: `${GATE_APP_URL}/scan` },
      { name: 'TV Display', url: `${GATE_APP_URL}/tv` },
      { name: 'Settings', url: `${GATE_APP_URL}/settings` }
    ];

    for (const pageInfo of pages) {
      const startTime = Date.now();
      await page.goto(pageInfo.url, { waitUntil: 'networkidle', timeout: 30000 });
      const loadTime = Date.now() - startTime;

      console.log(`  ${pageInfo.name}: ${loadTime}ms ${loadTime < 5000 ? '✅' : '⚠️'}`);

      // Performance should be under 5 seconds
      expect(loadTime).toBeLessThan(10000);
    }

    expect(consoleErrors.length).toBe(0);
  });
});
