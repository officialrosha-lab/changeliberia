import { test } from '@playwright/test';
import { generateTestEmail, generateTestPassword } from './test-helpers';

test('debug signup API calls', async ({ page }) => {
  const email = generateTestEmail();
  const password = generateTestPassword();
  const fullName = 'Test User';
  const phone = '+231770000001';

  // Intercept API calls
  page.on('response', (response) => {
    if (response.url().includes('/auth')) {
      console.log(`API Response: ${response.status()} ${response.url()}`);
      response.text().then(body => {
        console.log(`  Body: ${body.substring(0, 200)}`);
      });
    }
  });

  page.on('request', (request) => {
    if (request.url().includes('/auth')) {
      console.log(`API Request: ${request.method()} ${request.url()}`);
      console.log(`  Body: ${JSON.stringify(request.postDataJSON())}`);
    }
  });

  // Navigate and fill form
  await page.goto('/auth/signup');
  await page.waitForLoadState('networkidle');

  // Click Email tab
  const emailTab = page.locator('button:has-text("Email + Password")');
  await emailTab.click();
  await page.waitForTimeout(500);

  // Fill form
  await page.locator('input[name="fullName"]').fill(fullName);
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);

  console.log(`\n=== SUBMITTING FORM ===`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);

  // Click submit and wait for response
  await page.locator('button:has-text("Create account")').click();

  // Wait for any API response
  await page.waitForTimeout(5000);

  console.log(`\nFinal URL: ${page.url()}`);

  // Check for errors in console
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log(`CONSOLE ERROR: ${msg.text()}`);
    }
  });
});
