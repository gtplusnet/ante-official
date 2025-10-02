async function globalTeardown() {
  console.log('🧹 Running global teardown...');
  
  // Clean up any global resources
  // For example, delete test data, close connections, etc.
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;