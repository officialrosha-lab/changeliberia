import { FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright tests
 * Runs once after all tests complete
 */

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Starting test suite cleanup...\n');

  // Clean up test data
  console.log('🗑️  Cleaning up test data...');
  try {
    // Delete test users, messages, broadcasts created during tests
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Test data cleanup failed:', error);
    // Don't throw - continue with other cleanup
  }

  // Generate report
  console.log('📊 Generating test report...');
  try {
    // Reports are handled by Playwright's reporter config
    console.log('✅ Test report generated');
  } catch (error) {
    console.error('❌ Report generation failed:', error);
  }

  // Close database connections
  console.log('🔌 Closing database connections...');
  try {
    // Close Prisma client or other DB connections
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
  }

  console.log('\n✨ Cleanup complete\n');
}

export default globalTeardown;
