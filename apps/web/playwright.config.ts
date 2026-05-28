import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * Tests critical user flows: auth, petitions, donations, admin CMS
 */

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  
  /* Run tests sequentially (one worker) to avoid browser launch issues */
  fullyParallel: false,
  workers: 1,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],  // Simple list reporter only
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',

    /* Collect trace for each test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Disable all video recording - incompatible with macOS 12 */
    video: 'off' as any,

    /* Maximum time for each action */
    actionTimeout: 15000,

    /* Maximum time to navigate to a URL */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Override all video settings from device preset
        video: 'off' as any,
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Override all video settings from device preset
        video: 'off' as any,
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: undefined,  // Disable - server should already be running

  /* Timeout settings */
  timeout: 60 * 1000, // 60 seconds per test
  expect: {
    timeout: 10 * 1000, // 10 seconds per expect
  },

  /* Global test settings - disabled for debugging */
  // globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  // globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
});
