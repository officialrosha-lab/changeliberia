import { test } from '@playwright/test';

test('debug signup form with tabs', async ({ page }) => {
  await page.goto('/auth/signup');
  await page.waitForLoadState('networkidle');
  
  console.log('\n=== BEFORE CLICKING TAB ===');
  const inputs1 = await page.locator('input').all();
  console.log('Inputs found:', inputs1.length);
  for (let i = 0; i < inputs1.length; i++) {
    const name = await inputs1[i].getAttribute('name');
    const visible = await inputs1[i].isVisible();
    console.log(`  ${i}: name=${name}, visible=${visible}`);
  }
  
  // Try different selectors for the tab
  console.log('\n=== SEARCHING FOR EMAIL TAB ===');
  const emailTab1 = page.locator('button:has-text("Email + Password")');
  console.log('Selector 1 count:', await emailTab1.count());
  
  const emailTab2 = page.locator('text=Email + Password');
  console.log('Selector 2 count:', await emailTab2.count());
  
  const allButtons = await page.locator('button').all();
  console.log('Total buttons:', allButtons.length);
  for (let i = 0; i < allButtons.length; i++) {
    const text = await allButtons[i].textContent();
    if (text && text.includes('Email')) {
      console.log(`  Found Email button at index ${i}: "${text.trim()}"`);
      console.log('  Clicking it...');
      await allButtons[i].click();
      await page.waitForTimeout(1000);
      break;
    }
  }
  
  console.log('\n=== AFTER CLICKING TAB ===');
  const inputs2 = await page.locator('input').all();
  console.log('Inputs found:', inputs2.length);
  for (let i = 0; i < inputs2.length; i++) {
    const name = await inputs2[i].getAttribute('name');
    const type = await inputs2[i].getAttribute('type');
    const visible = await inputs2[i].isVisible();
    console.log(`  ${i}: name=${name}, type=${type}, visible=${visible}`);
  }
  
  // Look for password field in different ways
  console.log('\n=== SEARCHING FOR PASSWORD FIELD ===');
  const pwByName = page.locator('input[name="password"]');
  console.log('By name="password":', await pwByName.count());
  
  const pwByType = page.locator('input[type="password"]');
  console.log('By type="password":', await pwByType.count());
  
  const allInputs = await page.locator('input').all();
  for (let i = 0; i < allInputs.length; i++) {
    const name = await allInputs[i].getAttribute('name');
    const type = await allInputs[i].getAttribute('type');
    console.log(`  Input ${i}: name=${name}, type=${type}`);
  }
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/signup-after-tab.png' });
});
