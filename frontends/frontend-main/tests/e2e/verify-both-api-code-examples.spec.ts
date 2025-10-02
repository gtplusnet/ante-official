import { test, expect } from '@playwright/test';

test.describe('Code Examples on Both API Pages', () => {
  test('School Gate API Code Examples', async ({ page }) => {
    await page.goto('http://localhost:3000/api/public/school-gate');
    await page.waitForLoadState('networkidle');

    // Check tabs exist
    const tabs = await page.locator('#examples .tab');
    const tabCount = await tabs.count();
    console.log('School Gate - Found', tabCount, 'tabs');
    expect(tabCount).toBeGreaterThan(0);

    // Check code blocks exist
    const codeBlocks = await page.locator('#examples pre code');
    const codeBlockCount = await codeBlocks.count();
    console.log('School Gate - Found', codeBlockCount, 'code blocks');
    expect(codeBlockCount).toBeGreaterThan(0);

    // Click on a tab to test functionality
    const pythonTab = await page.locator('.tab:has-text("Python")').first();
    await pythonTab.click();

    // Verify Python code is visible
    const pythonCode = await page.locator('.tab-content.active pre code').first();
    const codeText = await pythonCode.textContent();
    expect(codeText).toContain('import requests');
    console.log('✅ School Gate API Code Examples working');
  });

  test('Manpower API Code Examples', async ({ page }) => {
    await page.goto('http://localhost:3000/api/public/manpower');
    await page.waitForLoadState('networkidle');

    // Check tabs exist
    const tabs = await page.locator('#examples .tab');
    const tabCount = await tabs.count();
    console.log('Manpower - Found', tabCount, 'tabs');
    expect(tabCount).toBeGreaterThan(0);

    // Check code blocks exist
    const codeBlocks = await page.locator('#examples pre code');
    const codeBlockCount = await codeBlocks.count();
    console.log('Manpower - Found', codeBlockCount, 'code blocks');
    expect(codeBlockCount).toBeGreaterThan(0);

    // Click on a Node.js tab to test functionality
    const nodejsTab = await page.locator('.tab:has-text("Node.js")').first();
    await nodejsTab.click();

    // Verify Node.js code is visible
    const nodejsCode = await page.locator('.tab-content.active pre code').first();
    const codeText = await nodejsCode.textContent();
    expect(codeText).toContain('axios');
    console.log('✅ Manpower API Code Examples working');
  });
});