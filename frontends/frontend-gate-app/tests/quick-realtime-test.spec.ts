import { test, expect } from '@playwright/test';

test('Quick realtime check', async ({ page }) => {
  const consoleLogs: string[] = [];
  
  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(text);
    // Only log important messages
    if (text.includes('🔌') || text.includes('📺') || text.includes('✅') || text.includes('❌')) {
      console.log(text);
    }
  });

  // Go directly to scan page (assuming already logged in from previous session)
  await page.goto('http://100.80.38.96:9002/scan');
  
  // Wait for initialization
  await page.waitForTimeout(5000);
  
  // Check logs
  const realtimeLogs = consoleLogs.filter(log => 
    log.includes('setupRealtime') || 
    log.includes('Starting realtime') ||
    log.includes('attendance service') ||
    log.includes('realtime subscription')
  );
  
  console.log('\nRealtime setup logs found:', realtimeLogs.length);
  realtimeLogs.forEach(log => console.log('  -', log));
  
  // Check for errors
  const errors = consoleLogs.filter(log => log.includes('❌') || log.includes('Failed'));
  if (errors.length > 0) {
    console.log('\nErrors found:');
    errors.forEach(log => console.log('  -', log));
  }
  
  expect(realtimeLogs.length).toBeGreaterThan(0);
});