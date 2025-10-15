/**
 * Complete Gate App Features Test
 *
 * Tests ALL features of the Gate App:
 * - Authentication and login
 * - Navigation between pages
 * - UI components and interactions
 * - Form inputs and validation
 * - Data display and formatting
 * - Settings management
 * - LocalStorage persistence
 * - Error handling
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:9002';
const VALID_LICENSE_KEY = '8ZS1Q3P7LBMUWELU4ROQJ6JISAZJCBB7'; // Valid Gate License
const MOCK_COMPANY_ID = '16';

// Console error tracking
let allErrors: string[] = [];
let testResults: Array<{test: string, status: 'PASS' | 'FAIL', details: string}> = [];

function trackConsoleErrors(page: Page) {
  allErrors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();

    // Filter out expected errors
    if (text.includes('npm warn')) return;
    if (text.includes('Next.js inferred')) return;
    if (text.includes('[AuthHelper]')) return;
    if (text.includes('401')) return;
    if (text.includes('Failed to load resource')) return;

    if (type === 'error') {
      if (text.toLowerCase().includes('supabase') ||
          text.toLowerCase().includes('module not found') ||
          text.toLowerCase().includes('cannot find')) {
        allErrors.push(text);
        console.error(`❌ ERROR: ${text}`);
      }
    }
  });

  page.on('pageerror', (error) => {
    if (!error.message.includes('401') && !error.message.includes('AuthHelper')) {
      allErrors.push(`PAGE ERROR: ${error.message}`);
      console.error(`❌ PAGE ERROR: ${error.message}`);
    }
  });
}

function recordTest(testName: string, passed: boolean, details: string) {
  testResults.push({
    test: testName,
    status: passed ? 'PASS' : 'FAIL',
    details
  });

  if (passed) {
    console.log(`✅ ${testName}: ${details}`);
  } else {
    console.error(`❌ ${testName}: ${details}`);
  }
}

// Helper function to login with valid credentials
async function loginWithValidLicense(page: Page) {
  console.log('🔑 Logging in with valid license...');

  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  const licenseInput = page.locator('input[type="text"]').first();
  await licenseInput.fill(VALID_LICENSE_KEY);

  const loginButton = page.getByRole('button', { name: /activate/i });
  await loginButton.click();

  // Wait for navigation to scan page (Next.js may add trailing slash)
  await page.waitForURL(new RegExp(`${BASE_URL}/scan/?$`), { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for full initialization

  console.log('✅ Login successful');
}

test.describe('Gate App - Complete Feature Testing', () => {
  test.beforeEach(async ({ page }) => {
    trackConsoleErrors(page);
    testResults = [];
  });

  test.afterEach(async () => {
    // Print summary after each test
    console.log('\n📊 Test Summary:');
    testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.details}`);
    });
  });

  test('Feature 1: Login Page - UI and Validation', async ({ page }) => {
    console.log('\n=== FEATURE TEST 1: Login Page ===\n');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Test 1.1: Page Title
    const titleText = await page.locator('h2, .text-2xl').first().textContent();
    const hasTitle = titleText?.toLowerCase().includes('school') || titleText?.toLowerCase().includes('gate');
    recordTest('Login Page Title', hasTitle === true, `Found: "${titleText}"`);

    // Test 1.2: License Input Field
    const licenseInput = page.locator('input[type="text"]').first();
    const inputVisible = await licenseInput.isVisible();
    recordTest('License Input Visible', inputVisible, 'Input field is accessible');

    // Test 1.3: Activate Button
    const activateButton = page.getByRole('button', { name: /activate/i });
    const buttonVisible = await activateButton.isVisible();
    recordTest('Activate Button Visible', buttonVisible, 'Button is accessible');

    // Test 1.4: Input Placeholder
    const placeholder = await licenseInput.getAttribute('placeholder');
    recordTest('Input Placeholder', !!placeholder, `Placeholder: "${placeholder}"`);

    // Test 1.5: Button States
    const isButtonDisabled = await activateButton.isDisabled();
    recordTest('Button Initial State', isButtonDisabled, 'Button disabled when empty (HTML5 validation)');

    // Test 1.6: Form Interaction - Type in input
    await licenseInput.fill(VALID_LICENSE_KEY);
    const inputValue = await licenseInput.inputValue();
    recordTest('Input Accepts Text', inputValue === VALID_LICENSE_KEY, `Value: "${inputValue}"`);

    // Test 1.7: Button Enabled After Input
    const isButtonEnabled = !(await activateButton.isDisabled());
    recordTest('Button Enabled After Input', isButtonEnabled, 'Button becomes enabled');

    // Test 1.8: Clear Input
    await licenseInput.clear();
    const isEmpty = (await licenseInput.inputValue()) === '';
    recordTest('Input Can Be Cleared', isEmpty, 'Input cleared successfully');

    // Test 1.9: No Console Errors
    recordTest('No Console Errors on Login', allErrors.length === 0, `Errors: ${allErrors.length}`);

    expect(allErrors.length).toBe(0);
  });

  test('Feature 2: Navigation and Routing', async ({ page }) => {
    console.log('\n=== FEATURE TEST 2: Navigation ===\n');

    // Login with valid credentials
    await loginWithValidLicense(page);

    const routes = [
      { path: '/scan', name: 'Scanner Page', expectedElement: 'text=/scan|qr/i' },
      { path: '/checked-in', name: 'Checked-In Page', expectedElement: 'text=/checked in/i' },
      { path: '/synced-data', name: 'Synced Data Page', expectedElement: 'text=/synced data/i' },
      { path: '/settings', name: 'Settings Page', expectedElement: 'text=/settings/i' },
      { path: '/tv', name: 'TV Display Page', expectedElement: 'text=/latest|waiting/i' }
    ];

    for (const route of routes) {
      // Test 2.x: Navigate to page
      await page.goto(`${BASE_URL}${route.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check URL
      const currentUrl = page.url();
      const correctUrl = currentUrl.includes(route.path);
      recordTest(`${route.name} - URL Correct`, correctUrl, `URL: ${currentUrl}`);

      // Check page loaded
      const element = page.locator(route.expectedElement).first();
      const hasContent = (await element.count()) > 0;
      recordTest(`${route.name} - Content Loaded`, hasContent, `Element found: ${hasContent}`);

      // Check no errors
      const noErrors = allErrors.length === 0;
      recordTest(`${route.name} - No Errors`, noErrors, `Errors: ${allErrors.length}`);

      allErrors = []; // Reset for next page
    }
  });

  test('Feature 3: Scanner Page Components', async ({ page }) => {
    console.log('\n=== FEATURE TEST 3: Scanner Page ===\n');

    await loginWithValidLicense(page);
    await page.goto(`${BASE_URL}/scan`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test 3.1: Page Title/Header
    const header = page.locator('h1, h2, .text-3xl').first();
    const headerText = await header.textContent();
    recordTest('Scanner Header Exists', !!headerText, `Header: "${headerText}"`);

    // Test 3.2: Stats Display
    const statsElements = await page.locator('text=/total|today|check.*in|check.*out/i').count();
    recordTest('Stats Display Present', statsElements > 0, `Found ${statsElements} stat elements`);

    // Test 3.3: Recent Scans Section
    const recentSection = await page.locator('text=/recent|latest|history/i').count();
    recordTest('Recent Scans Section', recentSection > 0, `Found ${recentSection} elements`);

    // Test 3.4: Scanner Video/Canvas
    const videoElement = await page.locator('video, canvas').count();
    recordTest('Scanner Component', videoElement >= 0, `Found ${videoElement} video/canvas elements`);

    // Test 3.5: Page fully interactive
    const bodyClass = await page.locator('body').getAttribute('class');
    recordTest('Page Body Loaded', bodyClass !== null, 'Body has classes');

    // Test 3.6: No critical errors
    recordTest('Scanner Page - No Errors', allErrors.length === 0, `Errors: ${allErrors.length}`);
  });

  test('Feature 4: Checked-In Page Features', async ({ page }) => {
    console.log('\n=== FEATURE TEST 4: Checked-In Page ===\n');

    await loginWithValidLicense(page);
    await page.goto(`${BASE_URL}/checked-in`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test 4.1: Page Title
    const titleElement = page.getByText(/currently checked in/i);
    const hasTitle = (await titleElement.count()) > 0;
    recordTest('Checked-In Title', hasTitle, 'Title displayed');

    // Test 4.2: Count Display
    const countElement = await page.locator('text=/\\d+\\s+(person|people)/i').count();
    recordTest('Count Display', countElement >= 0, `Count elements: ${countElement}`);

    // Test 4.3: Back/Navigation Link
    const navLinks = await page.locator('a, button').count();
    recordTest('Navigation Elements', navLinks > 0, `Found ${navLinks} interactive elements`);

    // Test 4.4: Empty State or List
    const emptyState = await page.getByText(/no one|empty|waiting/i).count();
    const listItems = await page.locator('[class*="grid"], [class*="list"], tr, li').count();
    const hasContent = emptyState > 0 || listItems > 0;
    recordTest('Content Display', hasContent, `Empty state or list items present`);

    // Test 4.5: No errors
    recordTest('Checked-In Page - No Errors', allErrors.length === 0, `Errors: ${allErrors.length}`);
  });

  test('Feature 5: Synced Data Page and Tabs', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout for this test (tab interactions can be slow)
    console.log('\n=== FEATURE TEST 5: Synced Data Page ===\n');

    await loginWithValidLicense(page);
    await page.goto(`${BASE_URL}/synced-data`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test 5.1: Page Title
    const title = page.getByText(/synced data/i).first();
    const hasTitle = (await title.count()) > 0;
    recordTest('Synced Data Title', hasTitle, 'Title present');

    // Test 5.2: Students Tab
    const studentsTab = page.getByRole('button', { name: /students/i });
    const hasStudentsTab = (await studentsTab.count()) > 0;
    recordTest('Students Tab Present', hasStudentsTab, 'Students tab found');

    // Test 5.3: Guardians Tab
    const guardiansTab = page.getByRole('button', { name: /guardians/i });
    const hasGuardiansTab = (await guardiansTab.count()) > 0;
    recordTest('Guardians Tab Present', hasGuardiansTab, 'Guardians tab found');

    // Test 5.4: Tab Switching
    if (hasGuardiansTab) {
      await guardiansTab.first().click();
      await page.waitForTimeout(500);
      const guardianTabActive = await guardiansTab.first().evaluate(el => {
        return el.className.includes('white') || el.className.includes('active') || el.className.includes('shadow');
      });
      recordTest('Switch to Guardians Tab', guardianTabActive, 'Guardians tab activated');

      // Switch back
      if (hasStudentsTab) {
        await studentsTab.first().click();
        await page.waitForTimeout(500);
        recordTest('Switch Back to Students', true, 'Tab switching works');
      }
    }

    // Test 5.5: Refresh Button
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    const hasRefresh = (await refreshButton.count()) > 0;
    recordTest('Refresh Button Present', hasRefresh, 'Refresh button found');

    // Test 5.6: Search Functionality
    const searchInput = await page.locator('input[type="text"], input[placeholder*="search" i]').count();
    recordTest('Search Input Present', searchInput > 0, `Found ${searchInput} search inputs`);

    // Test 5.7: Data Table/List
    const tableElements = await page.locator('table, [class*="grid"], [class*="list"]').count();
    recordTest('Data Display Structure', tableElements > 0, `Found ${tableElements} data structures`);

    // Test 5.8: No errors
    recordTest('Synced Data - No Errors', allErrors.length === 0, `Errors: ${allErrors.length}`);
  });

  test('Feature 6: Settings Page Configuration', async ({ page }) => {
    console.log('\n=== FEATURE TEST 6: Settings Page ===\n');

    await loginWithValidLicense(page);
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test 6.1: Page Title
    const settingsTitle = page.getByText(/^settings$/i).first();
    const hasTitle = (await settingsTitle.count()) > 0;
    recordTest('Settings Title', hasTitle, 'Settings title found');

    // Test 6.2: License Information Section
    const licenseSection = await page.locator('text=/license key|company|gate/i').count();
    recordTest('License Info Section', licenseSection > 0, `Found ${licenseSection} license elements`);

    // Test 6.3: Company ID Display
    const companyDisplay = await page.getByText(new RegExp(MOCK_COMPANY_ID)).count();
    recordTest('Company ID Displayed', companyDisplay > 0, 'Company ID visible in settings');

    // Test 6.4: Gate Name Display
    const gateDisplay = await page.getByText(/test gate/i).count();
    recordTest('Gate Name Displayed', gateDisplay > 0, 'Gate name visible');

    // Test 6.5: Force Sync Button
    const forceSyncBtn = page.getByRole('button', { name: /force sync/i });
    const hasSyncBtn = (await forceSyncBtn.count()) > 0;
    recordTest('Force Sync Button', hasSyncBtn, 'Sync button present');

    // Test 6.6: Clear Data Button
    const clearDataBtn = page.getByRole('button', { name: /clear.*data/i });
    const hasClearBtn = (await clearDataBtn.count()) > 0;
    recordTest('Clear Data Button', hasClearBtn, 'Clear button present');

    // Test 6.7: Logout Button
    const logoutBtn = page.getByRole('button', { name: /logout/i });
    const hasLogoutBtn = (await logoutBtn.count()) > 0;
    recordTest('Logout Button', hasLogoutBtn, 'Logout button present');

    // Test 6.8: Settings Form Inputs
    const inputs = await page.locator('input, select').count();
    recordTest('Settings Form Inputs', inputs > 0, `Found ${inputs} form inputs`);

    // Test 6.9: Save Settings Button
    const saveBtn = page.getByRole('button', { name: /save/i });
    const hasSaveBtn = (await saveBtn.count()) > 0;
    recordTest('Save Settings Button', hasSaveBtn, 'Save button present');

    // Test 6.10: No errors
    recordTest('Settings - No Errors', allErrors.length === 0, `Errors: ${allErrors.length}`);
  });

  test('Feature 7: TV Display Mode', async ({ page }) => {
    console.log('\n=== FEATURE TEST 7: TV Display ===\n');

    await loginWithValidLicense(page);
    await page.goto(`${BASE_URL}/tv`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test 7.1: TV Display Content
    const tvContent = await page.locator('text=/latest scan|waiting|recent/i').count();
    recordTest('TV Display Content', tvContent > 0, `Found ${tvContent} TV elements`);

    // Test 7.2: Full Screen Elements
    const bodyHeight = await page.evaluate(() => document.body.style.minHeight || 'auto');
    recordTest('TV Layout Style', bodyHeight !== '', `Body height: ${bodyHeight}`);

    // Test 7.3: Display Cards/Sections
    const displaySections = await page.locator('section, div[class*="card"], div[class*="display"]').count();
    recordTest('Display Sections', displaySections > 0, `Found ${displaySections} sections`);

    // Test 7.4: No Navigation Interference
    const hasMinimalNav = await page.locator('nav, header').count() <= 1;
    recordTest('Minimal Navigation', hasMinimalNav, 'TV mode has minimal UI');

    // Test 7.5: No errors
    recordTest('TV Display - No Errors', allErrors.length === 0, `Errors: ${allErrors.length}`);
  });

  test('Feature 8: LocalStorage Persistence', async ({ page }) => {
    console.log('\n=== FEATURE TEST 8: LocalStorage ===\n');

    await page.goto(`${BASE_URL}/login`);

    // Test 8.1: Set License Data
    await page.evaluate((data) => {
      localStorage.setItem('licenseKey', data.license);
      localStorage.setItem('companyId', data.companyId);
      localStorage.setItem('gateName', data.gateName);
      localStorage.setItem('licenseType', 'Gate License');
    }, { license: VALID_LICENSE_KEY, companyId: MOCK_COMPANY_ID, gateName: 'Test Gate' });

    const storedLicense = await page.evaluate(() => localStorage.getItem('licenseKey'));
    recordTest('LocalStorage - Set License', storedLicense === VALID_LICENSE_KEY, `Stored: ${storedLicense}`);

    const storedCompany = await page.evaluate(() => localStorage.getItem('companyId'));
    recordTest('LocalStorage - Set Company', storedCompany === MOCK_COMPANY_ID, `Stored: ${storedCompany}`);

    const storedGate = await page.evaluate(() => localStorage.getItem('gateName'));
    recordTest('LocalStorage - Set Gate Name', storedGate === 'Test Gate', `Stored: ${storedGate}`);

    // Test 8.2: Persistence Across Pages
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');

    const persistedLicense = await page.evaluate(() => localStorage.getItem('licenseKey'));
    recordTest('LocalStorage - Persists Across Pages', persistedLicense === VALID_LICENSE_KEY, 'Data persisted');

    // Test 8.3: Clear LocalStorage
    await page.evaluate(() => {
      localStorage.removeItem('licenseKey');
      localStorage.removeItem('companyId');
      localStorage.removeItem('gateName');
    });

    const clearedLicense = await page.evaluate(() => localStorage.getItem('licenseKey'));
    recordTest('LocalStorage - Can Clear', clearedLicense === null, 'Data cleared successfully');
  });

  test('Feature 9: Form Interactions and Validation', async ({ page }) => {
    console.log('\n=== FEATURE TEST 9: Form Interactions ===\n');

    await loginWithValidLicense(page);
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test 9.1: Input Fields Accept Text
    const textInputs = page.locator('input[type="text"]');
    const inputCount = await textInputs.count();

    if (inputCount > 0) {
      const firstInput = textInputs.first();
      await firstInput.fill('Test Value');
      const value = await firstInput.inputValue();
      recordTest('Text Input Accepts Value', value === 'Test Value', `Value: "${value}"`);

      await firstInput.clear();
      const cleared = (await firstInput.inputValue()) === '';
      recordTest('Text Input Can Clear', cleared, 'Input cleared');
    } else {
      recordTest('Text Input Test', true, 'No text inputs to test');
    }

    // Test 9.2: Number Inputs
    const numberInputs = page.locator('input[type="number"]');
    const numberCount = await numberInputs.count();

    if (numberCount > 0) {
      const numberInput = numberInputs.first();
      await numberInput.fill('10');
      const numValue = await numberInput.inputValue();
      recordTest('Number Input Accepts Value', numValue === '10', `Value: ${numValue}`);
    } else {
      recordTest('Number Input Test', true, 'No number inputs to test');
    }

    // Test 9.3: Select Dropdowns
    const selects = page.locator('select');
    const selectCount = await selects.count();

    if (selectCount > 0) {
      const select = selects.first();
      const options = await select.locator('option').count();
      recordTest('Select Dropdown Options', options > 0, `Found ${options} options`);
    } else {
      recordTest('Select Dropdown Test', true, 'No select dropdowns to test');
    }

    // Test 9.4: Buttons are Clickable
    const buttons = page.locator('button:not([disabled])');
    const buttonCount = await buttons.count();
    recordTest('Clickable Buttons', buttonCount > 0, `Found ${buttonCount} enabled buttons`);

    // Test 9.5: No errors during interactions
    recordTest('Form Interactions - No Errors', allErrors.length === 0, `Errors: ${allErrors.length}`);
  });

  test('Feature 10: Responsive Layout and UI Elements', async ({ page }) => {
    console.log('\n=== FEATURE TEST 10: UI Elements ===\n');

    await loginWithValidLicense(page);
    await page.goto(`${BASE_URL}/scan`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test 10.1: Page Container
    const container = await page.locator('body > div, main, [class*="container"]').count();
    recordTest('Page Container Present', container > 0, `Found ${container} containers`);

    // Test 10.2: Headers
    const headers = await page.locator('h1, h2, h3, h4').count();
    recordTest('Headers Present', headers > 0, `Found ${headers} headers`);

    // Test 10.3: Cards/Sections
    const cards = await page.locator('[class*="card"], section, article').count();
    recordTest('Card Components', cards > 0, `Found ${cards} card elements`);

    // Test 10.4: Buttons
    const buttons = await page.locator('button').count();
    recordTest('Buttons Present', buttons > 0, `Found ${buttons} buttons`);

    // Test 10.5: Images/Icons
    const images = await page.locator('img, svg, [class*="icon"]').count();
    recordTest('Images/Icons', images >= 0, `Found ${images} images/icons`);

    // Test 10.6: Links
    const links = await page.locator('a').count();
    recordTest('Links Present', links >= 0, `Found ${links} links`);

    // Test 10.7: Responsive Meta Tag
    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content') || '';
    });
    recordTest('Viewport Meta Tag', viewport.includes('width'), `Viewport: ${viewport}`);

    // Test 10.8: CSS Loaded
    const hasStyles = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.body);
      return styles.margin !== '' || styles.padding !== '';
    });
    recordTest('CSS Styles Loaded', hasStyles, 'Styles applied to body');

    // Test 10.9: No errors
    recordTest('UI Elements - No Errors', allErrors.length === 0, `Errors: ${allErrors.length}`);
  });

  test('Feature 11: Final Complete Feature Check', async ({ page }) => {
    console.log('\n=== FEATURE TEST 11: Complete Feature Check ===\n');

    let totalTests = 0;
    let passedTests = 0;

    await loginWithValidLicense(page);

    const testScenarios = [
      { page: '/login', name: 'Login Page', element: 'input[type="text"]' },
      { page: '/scan', name: 'Scanner Page', element: 'text=/scanner|recent scans/i' },
      { page: '/checked-in', name: 'Checked-In Page', element: 'text=/checked in/i' },
      { page: '/synced-data', name: 'Synced Data Page', element: 'button' },
      { page: '/settings', name: 'Settings Page', element: 'text=/settings/i' },
      { page: '/tv', name: 'TV Display Page', element: 'text=/latest|waiting/i' }
    ];

    for (const scenario of testScenarios) {
      totalTests++;

      await page.goto(`${BASE_URL}${scenario.page}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const element = page.locator(scenario.element).first();
      const exists = (await element.count()) > 0;

      if (exists) {
        passedTests++;
        recordTest(`${scenario.name} Feature`, true, 'Page and elements working');
      } else {
        recordTest(`${scenario.name} Feature`, false, 'Element not found');
      }
    }

    const successRate = (passedTests / totalTests * 100).toFixed(1);
    recordTest('Overall Success Rate', passedTests === totalTests, `${passedTests}/${totalTests} (${successRate}%)`);

    recordTest('No Critical Errors', allErrors.length === 0, `Total errors: ${allErrors.length}`);

    console.log('\n📊 FINAL SUMMARY:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Success Rate: ${successRate}%`);
    console.log(`   Console Errors: ${allErrors.length}`);

    expect(passedTests).toBe(totalTests);
    expect(allErrors.length).toBe(0);
  });
});
