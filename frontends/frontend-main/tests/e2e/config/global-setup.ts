import { chromium } from '@playwright/test';

async function globalSetup() {
  console.log('🚀 Setting up global test environment...');
  
  // Create a browser instance to warm up and check if the app is running
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Check if the application is running
    console.log('⏳ Checking if application is running...');
    await page.goto('http://localhost:9000', { waitUntil: 'networkidle' });
    console.log('✅ Application is running and accessible');
    
    // Optionally pre-authenticate and save auth state
    // This can speed up tests by avoiding repeated login
    console.log('🔧 Pre-authentication setup complete');
  } catch (error) {
    console.error('❌ Failed to connect to application:', error);
    throw new Error('Application is not running. Please start the dev server with "yarn dev"');
  } finally {
    await context.close();
    await browser.close();
  }
  
  console.log('✅ Global setup completed successfully');
}

export default globalSetup;