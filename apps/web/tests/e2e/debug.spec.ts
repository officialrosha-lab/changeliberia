import { test } from '@playwright/test';

test('debug signup page structure', async ({ page }) => {
  await page.goto('/auth/signup');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/signup-page.png' });
  
  // Log all input fields
  const inputs = await page.locator('input').all();
  console.log('Found', inputs.length, 'input elements');
  
  for (let i = 0; i < inputs.length; i++) {
    const type = await inputs[i].getAttribute('type');
    const name = await inputs[i].getAttribute('name');
    const id = await inputs[i].getAttribute('id');
    console.log(`Input ${i}: type=${type}, name=${name}, id=${id}`);
  }
  
  // Log all buttons
  const buttons = await page.locator('button').all();
  console.log('Found', buttons.length, 'button elements');
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const type = await buttons[i].getAttribute('type');
    console.log(`Button ${i}: type=${type}, text=${text}`);
  }
  
  // Check page title
  console.log('Page title:', await page.title());
  
  // Check for forms
  const forms = await page.locator('form').all();
  console.log('Found', forms.length, 'form elements');
});
