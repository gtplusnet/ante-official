import { test, expect } from '@playwright/test';

test('Check which backend URL Gate App is using', async ({ page }) => {
  const requests: string[] = [];

  // Capture all requests
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('ondigitalocean.app') || url.includes('localhost:3000') || url.includes('geertest.com')) {
      requests.push(url);
      console.log('REQUEST:', url);
    }
  });

  // Navigate to Gate App
  await page.goto('https://ante-gate.geertest.com/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Try to trigger an API call by attempting login
  try {
    await page.fill('input[name="username"]', 'test');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  } catch (e) {
    console.log('Login form interaction failed:', e);
  }

  // Print all backend requests
  console.log('\n=== BACKEND REQUESTS ===');
  requests.forEach(req => console.log(req));

  // Check if any request went to staging backend
  const stagingRequests = requests.filter(r => r.includes('ante-backend-staging'));
  const productionRequests = requests.filter(r => r.includes('ante-backend-production'));
  const localhostRequests = requests.filter(r => r.includes('localhost:3000'));

  console.log(`\nStaging requests: ${stagingRequests.length}`);
  console.log(`Production requests: ${productionRequests.length}`);
  console.log(`Localhost requests: ${localhostRequests.length}`);

  if (productionRequests.length > 0) {
    console.log('\n❌ PRODUCTION REQUESTS FOUND:');
    productionRequests.forEach(req => console.log('  ', req));
  }

  if (localhostRequests.length > 0) {
    console.log('\n❌ LOCALHOST REQUESTS FOUND:');
    localhostRequests.forEach(req => console.log('  ', req));
  }

  if (stagingRequests.length > 0) {
    console.log('\n✅ STAGING REQUESTS FOUND:');
    stagingRequests.forEach(req => console.log('  ', req));
  }

  expect(productionRequests.length).toBe(0);
  expect(localhostRequests.length).toBe(0);
  expect(stagingRequests.length).toBeGreaterThan(0);
});
