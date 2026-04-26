/**
 * Global test teardown
 * Runs once after all tests complete
 */
async function globalTeardown() {
  console.log('🧹 Playwright global teardown...');
  
  // Optional: Clean up test database, close connections, etc.
  // For example:
  // - Delete test users
  // - Reset test data
  // - Close external connections
  
  console.log('✅ Global teardown complete');
}

export default globalTeardown;
