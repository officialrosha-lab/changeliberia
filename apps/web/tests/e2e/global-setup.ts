import { chromium, FullConfig } from '@playwright/test';

/**
 * Global test setup
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  // Optional: Seed test data, setup test database, etc.
  console.log('🔧 Playwright global setup...');
  
  // Optional: Create a test user or seed data via API
  if (process.env.SETUP_TEST_DATA === 'true') {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
    console.log(`Initializing test environment at ${baseURL}`);
    
    // Navigate to ensure server is running
    try {
      await page.goto('/');
      console.log('✅ Application is ready');
    } catch (error) {
      console.warn('⚠️ Application not yet ready:', (error as Error).message);
    }
    
    await context.close();
    await browser.close();
  }

  console.log('✅ Global setup complete');
}

export default globalSetup;
