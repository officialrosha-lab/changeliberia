import { test } from '@playwright/test';

test('debug login page structure', async ({ page }) => {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  
  console.log('\n=== LOGIN PAGE ===');
  console.log('Page title:', await page.title());
  
  const inputs = await page.locator('input').all();
  console.log('Inputs found:', inputs.length);
  for (let i = 0; i < inputs.length; i++) {
    const name = await inputs[i].getAttribute('name');
    const type = await inputs[i].getAttribute('type');
    console.log(`  ${i}: name=${name}, type=${type}`);
  }
  
  const buttons = await page.locator('button').all();
  console.log('Buttons found:', buttons.length);
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const type = await buttons[i].getAttribute('type');
    console.log(`  ${i}: type=${type}, text=${text?.trim()}`);
  }
  
  // Look for submit button
  const submitBtn = page.locator('button[type="submit"]');
  console.log('\nSubmit buttons:', await submitBtn.count());
  
  // Look for sign in button
  const signInBtn = page.locator('button:has-text("Sign In")');
  console.log('Sign In buttons:', await signInBtn.count());
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/login-page.png' });
});
