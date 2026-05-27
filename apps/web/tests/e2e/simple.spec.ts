import { test, expect } from '@playwright/test';

test('simple page load', async ({ page }) => {
  await page.goto('http://localhost:3000/auth/login');
  const title = await page.title();
  console.log('Page title:', title);
  expect(page.url()).toContain('localhost:3000');
});
