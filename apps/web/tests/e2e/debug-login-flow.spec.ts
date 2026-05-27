import { test } from '@playwright/test';

test('debug login tab flow', async ({ page }) => {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  
  console.log('\n=== INITIAL STATE ===');
  const inputs1 = await page.locator('input').all();
  console.log('Inputs:', inputs1.length);
  for (let i = 0; i < inputs1.length; i++) {
    const name = await inputs1[i].getAttribute('name');
    console.log(`  ${i}: name=${name}`);
  }
  
  // Click Email + Password tab
  console.log('\n=== CLICKING EMAIL TAB ===');
  const emailTab = page.locator('button:has-text("Email + Password")');
  await emailTab.click();
  await page.waitForTimeout(500);
  
  console.log('\n=== AFTER TAB CLICK ===');
  const inputs2 = await page.locator('input').all();
  console.log('Inputs:', inputs2.length);
  for (let i = 0; i < inputs2.length; i++) {
    const name = await inputs2[i].getAttribute('name');
    const type = await inputs2[i].getAttribute('type');
    console.log(`  ${i}: name=${name}, type=${type}`);
  }
  
  // Fill email and click continue
  console.log('\n=== FILLING EMAIL AND CONTINUE ===');
  const emailInput = page.locator('input[name="email"]');
  await emailInput.fill('test@example.com');
  
  const continueBtn = page.locator('button:has-text("Continue")');
  console.log('Continue buttons:', await continueBtn.count());
  await continueBtn.first().click();
  
  await page.waitForTimeout(1000);
  
  console.log('\n=== AFTER CONTINUE ===');
  const inputs3 = await page.locator('input').all();
  console.log('Inputs:', inputs3.length);
  for (let i = 0; i < inputs3.length; i++) {
    const name = await inputs3[i].getAttribute('name');
    const type = await inputs3[i].getAttribute('type');
    const visible = await inputs3[i].isVisible();
    console.log(`  ${i}: name=${name}, type=${type}, visible=${visible}`);
  }
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/login-after-email.png' });
});
