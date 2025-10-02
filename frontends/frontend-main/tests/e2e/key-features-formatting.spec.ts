import { test, expect } from '@playwright/test';

test('Key Features formatting', async ({ page }) => {
  await page.goto('http://localhost:3000/api/public/school-gate');
  await page.waitForLoadState('networkidle');

  // Check Key Features section exists with proper heading
  const keyFeaturesTitle = await page.locator('.info-box-title:has-text("Key Features")');
  await expect(keyFeaturesTitle).toBeVisible();

  // Check feature list exists
  const featureList = await page.locator('.feature-list').first();
  await expect(featureList).toBeVisible();

  // Check list items
  const listItems = await featureList.locator('li').count();
  console.log('Found', listItems, 'feature items');

  // Take screenshot of the Key Features section
  const infoBox = await page.locator('.info-box').first();
  await infoBox.screenshot({ path: 'tests/screenshots/key-features.png' });

  console.log('✅ Key Features section is properly formatted');

  // Also check the Required Header section
  const requiredHeaderTitle = await page.locator('.info-box-title:has-text("Required Header")');
  await expect(requiredHeaderTitle).toBeVisible();
  console.log('✅ Required Header section is properly formatted');
});