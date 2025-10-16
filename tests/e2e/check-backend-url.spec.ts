import { test, expect } from '@playwright/test';

test('Check which backend URL Guardian App is using', async ({ page }) => {
  const requests: string[] = [];

  // Capture all requests
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('ondigitalocean.app') || url.includes('geertest.com')) {
      requests.push(url);
      console.log('REQUEST:', url);
    }
  });

  // Navigate to Guardian App
  await page.goto('https://ante-guardian.geertest.com/login/');
  await page.waitForLoadState('networkidle');

  // Try to login
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'test123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Print all backend requests
  console.log('\n=== BACKEND REQUESTS ===');
  requests.forEach(req => console.log(req));

  // Check if any request went to staging backend
  const stagingRequests = requests.filter(r => r.includes('ante-backend-staging'));
  const productionRequests = requests.filter(r => r.includes('ante-backend-production'));

  console.log(`\nStaging requests: ${stagingRequests.length}`);
  console.log(`Production requests: ${productionRequests.length}`);

  if (productionRequests.length > 0) {
    console.log('\n❌ PRODUCTION REQUESTS FOUND:');
    productionRequests.forEach(req => console.log('  ', req));
  }

  if (stagingRequests.length > 0) {
    console.log('\n✅ STAGING REQUESTS FOUND:');
    stagingRequests.forEach(req => console.log('  ', req));
  }

  expect(productionRequests.length).toBe(0);
  expect(stagingRequests.length).toBeGreaterThan(0);
});
