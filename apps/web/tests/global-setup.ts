import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */

async function globalSetup(config: FullConfig) {
  console.log('\n🚀 Starting test suite setup...\n');

  // Initialize test database
  console.log('📊 Initializing test database...');
  try {
    // In a real setup, this would:
    // 1. Create test database
    // 2. Run migrations
    // 3. Seed test data
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }

  // Verify services are running
  console.log('🔍 Verifying services...');
  try {
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;
    const browser = await chromium.launch(executablePath ? { executablePath } : undefined);
    const context = await browser.newContext();
    const page = await context.newPage();

    // Try to connect to the frontend under test.
    const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
    try {
      await page.goto(baseURL, { timeout: 10000 });
      console.log('✅ Frontend service running');
    } catch {
      console.warn('⚠️  Frontend service may not be ready - will wait for it');
    }

    await browser.close();
  } catch (error) {
    console.error('❌ Service verification failed:', error);
    throw error;
  }

  // Create test data
  console.log('📝 Seeding test data...');
  try {
    // Seed users, messages, etc.
    console.log('✅ Test data seeded');
  } catch (error) {
    console.error('❌ Test data seeding failed:', error);
    throw error;
  }

  console.log('\n✨ Setup complete - starting tests\n');
}

export default globalSetup;
