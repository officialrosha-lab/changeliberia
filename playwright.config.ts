import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Change Liberia E2E testing
 * Supports multiple browser engines and environments
 */

const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const apiBaseURL = process.env.API_BASE_URL || 'http://localhost:4000';

export default defineConfig({
  testDir: './apps/web/tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: [
    {
      command: 'pnpm --filter web dev',
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'pnpm --filter api dev',
      url: apiBaseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],

  expect: {
    timeout: 5000,
  },

  timeout: 30 * 1000,

  globalSetup: './apps/web/tests/global-setup.ts',
  globalTeardown: './apps/web/tests/global-teardown.ts',
});
