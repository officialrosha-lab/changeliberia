import { test } from '@playwright/test';

test('debug login buttons after tab', async ({ page }) => {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  
  // Click Email + Password tab
  const emailTab = page.locator('button:has-text("Email + Password")');
  await emailTab.click();
  await page.waitForTimeout(500);
  
  console.log('\n=== BUTTONS AFTER TAB CLICK ===');
  const buttons = await page.locator('button').all();
  console.log('Total buttons:', buttons.length);
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const type = await buttons[i].getAttribute('type');
    const visible = await buttons[i].isVisible();
    if (visible) {
      console.log(`  ${i}: type=${type}, text="${text?.trim()}", visible=true`);
    }
  }
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/login-buttons.png' });
});
