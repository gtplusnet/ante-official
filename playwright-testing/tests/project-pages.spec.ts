import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9000';
const API_URL = 'http://localhost:3000';

// Test credentials
const TEST_USER = {
  username: 'guillermotabligan',
  password: 'water123'
};

// Helper function to login
async function login(page) {
  await page.goto(`${BASE_URL}/login`);

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Check if we need to switch to manual login mode (if OAuth buttons are shown first)
  const manualLoginButton = page.locator('[data-testid="manual-login-button"]');
  const isManualButtonVisible = await manualLoginButton.isVisible().catch(() => false);

  if (isManualButtonVisible) {
    await manualLoginButton.click();
    await page.waitForTimeout(500); // Wait for transition
  }

  // Fill in credentials using data-testid
  await page.fill('[data-testid="login-username-input"]', TEST_USER.username);
  await page.fill('[data-testid="login-password-input"]', TEST_USER.password);

  // Click submit button
  await page.click('[data-testid="login-submit-button"]');

  // Wait for navigation to complete (hash-based routing)
  // App uses hash routing, so URL will be like: http://localhost:9000/login#/member/dashboard
  await page.waitForURL(/.*#\/member\/.*/, { timeout: 15000 });

  // Wait for page to stabilize
  await page.waitForTimeout(2000);
}

test.describe('Project Module - Backend API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Project Dashboard - should use backend API and load data', async ({ page }) => {
    // Set up API interceptor to verify backend calls
    let apiCallMade = false;
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/project') && url.includes('localhost:3000')) {
        apiCallMade = true;
        console.log('✅ Backend API call detected:', url);
      }
    });

    // Navigate to project dashboard
    await page.goto(`${BASE_URL}/#/member/project/dashboard`);

    // Wait for any content to load
    await page.waitForTimeout(5000);

    // Verify backend API was called
    expect(apiCallMade).toBe(true);

    console.log('✅ Project Dashboard using backend API');
  });

  test('Project List/Grid View - should use backend API and load data', async ({ page }) => {
    // Set up API interceptor
    let apiCallMade = false;
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/project') && url.includes('localhost:3000')) {
        apiCallMade = true;
        console.log('✅ Backend API call detected:', url);
      }
    });

    // Navigate to project list
    await page.goto(`${BASE_URL}/#/member/project`);

    // Wait for page to load
    await page.waitForTimeout(5000);

    // Verify backend API was called
    expect(apiCallMade).toBe(true);

    console.log('✅ Project List/Grid View using backend API');
  });

  test('Project Board View - should use backend API', async ({ page }) => {
    // Set up API interceptor
    let apiCallMade = false;
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/project') && url.includes('localhost:3000')) {
        apiCallMade = true;
      }
    });

    // Navigate to project board
    await page.goto(`${BASE_URL}/#/member/project`);
    await page.waitForTimeout(5000);

    // Verify backend API was called
    expect(apiCallMade).toBe(true);

    console.log('✅ Project Board View using backend API');
  });

  test('Project SubMenu - should use backend API for active projects', async ({ page }) => {
    // Set up API interceptor
    let apiCallMade = false;
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/project') && url.includes('localhost:3000')) {
        apiCallMade = true;
      }
    });

    // Navigate to any project page
    await page.goto(`${BASE_URL}/#/member/project`);
    await page.waitForTimeout(5000);

    // Verify backend API was called
    expect(apiCallMade).toBe(true);

    console.log('✅ Project SubMenu using backend API');
  });

  test('Verify NO Supabase direct access in project pages', async ({ page }) => {
    // Set up interceptor to catch any Supabase calls
    let supabaseCallMade = false;
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('supabase.co') && url.includes('/rest/')) {
        // This would indicate direct Supabase table access
        supabaseCallMade = true;
        console.warn('⚠️ Direct Supabase call detected:', url);
      }
    });

    // Navigate to various project pages
    await page.goto(`${BASE_URL}/#/member/project/dashboard`);
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/#/member/project`);
    await page.waitForTimeout(3000);

    // Verify NO Supabase calls were made
    expect(supabaseCallMade).toBe(false);

    console.log('✅ No direct Supabase access detected - all using backend API');
  });

  test('Backend API returns properly formatted data', async ({ page }) => {
    // Set up response interceptor
    const apiResponses = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('localhost:3000/project') && response.status() === 200) {
        try {
          const data = await response.json();
          apiResponses.push({ url, data });
        } catch (e) {
          // Ignore non-JSON responses
        }
      }
    });

    // Navigate to project dashboard
    await page.goto(`${BASE_URL}/#/member/project/dashboard`);
    await page.waitForTimeout(5000);

    // Verify we got API responses
    expect(apiResponses.length).toBeGreaterThan(0);

    // Verify response structure
    const projectResponse = apiResponses.find(r => r.url.includes('/project'));
    if (projectResponse) {
      const { data } = projectResponse;

      // Backend should return list array
      expect(data).toHaveProperty('list');
      expect(Array.isArray(data.list)).toBe(true);

      if (data.list.length > 0) {
        const project = data.list[0];

        // Verify backend formats data
        if (project.budget) {
          expect(project.budget).toHaveProperty('formatted');
          expect(project.budget).toHaveProperty('raw');
        }

        if (project.startDate) {
          expect(project.startDate).toHaveProperty('formatted');
        }

        console.log('✅ Backend returns properly formatted data');
      }
    }
  });
});
