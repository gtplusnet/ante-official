/**
 * Quick Migration Test
 * Verifies that the login page loads without Supabase errors
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9002';

test('login page should load without Supabase errors', async ({ page }) => {
  const errors: string[] = [];

  // Capture console errors
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();

    // Only capture actual errors (not warnings)
    if (type === 'error') {
      // Filter out Supabase errors (should not exist)
      if (text.toLowerCase().includes('supabase')) {
        errors.push(`❌ SUPABASE ERROR: ${text}`);
      } else {
        errors.push(text);
      }
    }
  });

  console.log('Navigating to login page...');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for any async operations

  // Take screenshot
  await page.screenshot({ path: 'test-results/login-page.png', fullPage: true });

  // Check for Supabase errors
  const supabaseErrors = errors.filter(e => e.toLowerCase().includes('supabase'));

  if (supabaseErrors.length > 0) {
    console.error('❌ Found Supabase-related errors:');
    supabaseErrors.forEach(err => console.error(`  - ${err}`));
    throw new Error(`Migration failed: Found ${supabaseErrors.length} Supabase-related errors`);
  }

  // Check if page loaded correctly
  const hasLicenseInput = await page.locator('input[type="text"]').isVisible();
  const hasActivateButton = await page.getByRole('button', { name: /activate/i }).isVisible();

  expect(hasLicenseInput).toBe(true);
  expect(hasActivateButton).toBe(true);

  console.log('✅ Login page loaded successfully without Supabase errors!');
  console.log(`✅ Total console errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('Non-Supabase errors:');
    errors.forEach(err => console.log(`  - ${err}`));
  }
});
