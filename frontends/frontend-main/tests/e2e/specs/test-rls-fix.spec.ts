import { test, expect } from '@playwright/test';

test.describe('RLS Policy Fix Test', () => {
  test('should be able to access Client table through Project relationship', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:9001/#/login');
    await page.fill('input[type="text"]', 'guillermotabligan');
    await page.fill('input[type="password"]', 'water123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('**/#/dashboard');

    // Navigate to a project page (ID 1 as example)
    await page.goto('http://localhost:9001/#/project/1');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for permission denied errors
    const bodyText = await page.textContent('body');

    // Assert no permission errors
    expect(bodyText).not.toContain('permission denied');
    expect(bodyText).not.toContain('403');
    expect(bodyText).not.toContain('Forbidden');

    console.log('✅ RLS Test Passed: No permission errors found');
  });
});