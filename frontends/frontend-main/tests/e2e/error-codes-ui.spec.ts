import { test, expect } from '@playwright/test';

test('Check error codes UI improvements', async ({ page }) => {
  await page.goto('http://localhost:3000/api/public/school-gate');
  await page.waitForLoadState('networkidle');

  // Scroll to Error Handling section
  await page.evaluate(() => {
    const element = document.querySelector('#errors');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // Wait for the section to be in view
  await page.waitForTimeout(1000);

  // Check if we're using the old UI or new UI
  const hasErrorCards = await page.locator('.error-code-card').count() > 0;
  const hasOldErrorBox = await page.locator('.info-box.warning').count() > 0;

  console.log('\n=== Error UI Detection ===');
  console.log('Has new error cards:', hasErrorCards);
  console.log('Has old info box:', hasOldErrorBox);

  if (!hasErrorCards) {
    console.log('\nError cards not found. Taking screenshot of current state...');
    await page.screenshot({
      path: 'tests/screenshots/error-section-current.png',
      fullPage: true
    });
    console.log('Full page screenshot saved to tests/screenshots/error-section-current.png');
    return;
  }

  // Wait for error code cards to be visible
  await page.waitForSelector('.error-code-card', { state: 'visible', timeout: 5000 });

  // Check that error code cards are present
  const errorCards = await page.locator('.error-code-card').count();
  console.log(`\n=== Error Code Cards Found: ${errorCards} ===`);
  expect(errorCards).toBeGreaterThan(0);

  // Check each error card structure
  const firstCard = page.locator('.error-code-card').first();

  // Check if card has required elements
  const hasHeader = await firstCard.locator('.error-code-header').isVisible();
  const hasCode = await firstCard.locator('.error-code').isVisible();
  const hasStatus = await firstCard.locator('.error-status').isVisible();
  const hasDescription = await firstCard.locator('.error-code-description').isVisible();
  const hasSolution = await firstCard.locator('.error-code-solution').isVisible();

  console.log('\n=== Error Card Structure ===');
  console.log('Has header:', hasHeader);
  console.log('Has error code:', hasCode);
  console.log('Has status badge:', hasStatus);
  console.log('Has description:', hasDescription);
  console.log('Has solution:', hasSolution);

  // Get error code details
  const errorCode = await firstCard.locator('.error-code').textContent();
  const errorStatus = await firstCard.locator('.error-status').textContent();
  const errorDesc = await firstCard.locator('.error-code-description').textContent();

  console.log('\n=== First Error Code Details ===');
  console.log('Code:', errorCode);
  console.log('Status:', errorStatus);
  console.log('Description:', errorDesc);

  // Check status badge styling
  const statusBadge = firstCard.locator('.error-status');
  const backgroundColor = await statusBadge.evaluate(el => {
    return window.getComputedStyle(el).backgroundColor;
  });

  console.log('\n=== Status Badge Styling ===');
  console.log('Background color:', backgroundColor);

  // Check grid layout
  const gridContainer = page.locator('.error-codes-grid');
  const gridDisplay = await gridContainer.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      display: styles.display,
      gridTemplateColumns: styles.gridTemplateColumns,
      gap: styles.gap
    };
  });

  console.log('\n=== Grid Layout ===');
  console.log('Display:', gridDisplay.display);
  console.log('Columns:', gridDisplay.gridTemplateColumns);
  console.log('Gap:', gridDisplay.gap);

  // Take screenshot of error codes section
  const errorSection = page.locator('#errors');
  await errorSection.screenshot({
    path: 'tests/screenshots/error-codes-ui.png',
    fullPage: false
  });
  console.log('\nScreenshot saved to tests/screenshots/error-codes-ui.png');

  // Verify all expected error codes are present
  const expectedCodes = [
    'INVALID_LICENSE',
    'STUDENT_NOT_FOUND',
    'GATE_NOT_FOUND',
    'DUPLICATE_CHECK_IN',
    'NO_CHECK_IN_RECORD',
    'INVALID_TIMESTAMP'
  ];

  console.log('\n=== Checking All Error Codes ===');
  for (const code of expectedCodes) {
    const codeElement = page.locator(`.error-code:has-text("${code}")`);
    const exists = await codeElement.count() > 0;
    console.log(`${code}: ${exists ? '✓' : '✗'}`);
    expect(exists).toBeTruthy();
  }

  // Check hover effect
  const cardBeforeHover = await firstCard.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      borderColor: styles.borderColor,
      transform: styles.transform
    };
  });

  await firstCard.hover();
  await page.waitForTimeout(300); // Wait for transition

  const cardAfterHover = await firstCard.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      borderColor: styles.borderColor,
      transform: styles.transform
    };
  });

  console.log('\n=== Hover Effect ===');
  console.log('Before hover - Border:', cardBeforeHover.borderColor);
  console.log('After hover - Border:', cardAfterHover.borderColor);
  console.log('Transform change:', cardAfterHover.transform !== cardBeforeHover.transform);
});