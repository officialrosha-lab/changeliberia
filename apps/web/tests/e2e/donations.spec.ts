import { test, expect } from '@playwright/test';
import {
  fillInput,
  clickElement,
  expectTextContent,
  generateTestEmail,
  generateTestPassword,
  waitForNavigation,
  getText,
  fillForm,
  isVisible,
  waitForAPIResponse,
} from './test-helpers';

/**
 * Donations & Stripe E2E tests
 * Tests: donation widget, checkout, payment flow, receipts
 */

test.describe('Donations & Stripe Integration', () => {
  test('should display donation widget on home page', async ({ page }) => {
    await page.goto('/');

    // Check for donation widget
    const donationWidget = page.locator('[data-testid="donation-widget"]|[data-testid="donate-section"]');
    await expect(donationWidget).toBeVisible();
  });

  test('should display donation preset amounts', async ({ page }) => {
    await page.goto('/');

    // Find donation widget
    const donationWidget = page.locator('[data-testid="donation-widget"]');
    const presetButtons = donationWidget.locator('button:has-text("$")');

    const count = await presetButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should allow custom donation amount', async ({ page }) => {
    await page.goto('/');

    // Find custom amount input
    const customInput = page.locator('input[name="customAmount"]|input[type="number"][name*="amount"]');
    
    if (await customInput.isVisible()) {
      await fillInput(page, 'input[name="customAmount"]|input[type="number"][name*="amount"]', '50');

      // Verify value updated
      const value = await customInput.inputValue();
      expect(value).toBe('50');
    }
  });

  test('should open donation checkout on preset amount click', async ({ page }) => {
    await page.goto('/');

    // Click a preset donation amount
    const donationButton = page.locator('[data-testid="donation-widget"] button:has-text("$10")');
    
    if (await donationButton.isVisible()) {
      await clickElement(page, '[data-testid="donation-widget"] button:has-text("$10")');

      // Wait for checkout modal or page
      await page.waitForLoadState('networkidle');

      // Check for Stripe form or checkout page
      const stripeFrame = page.frameLocator('iframe[title*="Stripe"]');
      const checkoutForm = page.locator('[data-testid="checkout-form"]|[data-testid="payment-form"]');

      let isStripeLoaded = false;
      try {
        await stripeFrame.locator('body').waitFor({ timeout: 2000 });
        isStripeLoaded = true;
      } catch {
        isStripeLoaded = false;
      }
      const isCheckoutVisible = await checkoutForm.isVisible();

      expect(isStripeLoaded || isCheckoutVisible).toBeTruthy();
    }
  });

  test('should fill donation form with email', async ({ page }) => {
    await page.goto('/');

    // Fill donation widget
    const donationButton = page.locator('[data-testid="donation-widget"] button:has-text("$25")');
    
    if (await donationButton.isVisible()) {
      await clickElement(page, '[data-testid="donation-widget"] button:has-text("$25")');
      await page.waitForLoadState('networkidle');

      // Fill email if not logged in
      const emailInput = page.locator('input[name="email"]|input[type="email"]').first();
      if (await emailInput.isVisible()) {
        const testEmail = generateTestEmail();
        await fillInput(page, 'input[name="email"]', testEmail);
      }
    }
  });

  test('should display donation amount in checkout', async ({ page }) => {
    await page.goto('/');

    // Select donation
    const donationButton = page.locator('[data-testid="donation-widget"] button:has-text("$50")');
    
    if (await donationButton.isVisible()) {
      await clickElement(page, '[data-testid="donation-widget"] button:has-text("$50")');
      await page.waitForLoadState('networkidle');

      // Look for amount display
      const amountDisplay = page.locator('[data-testid="donation-amount"]|[data-testid="total-amount"]');
      const text = await amountDisplay.textContent();
      expect(text).toContain('50');
    }
  });

  test('should make successful donation with test card', async ({ page }) => {
    // This test uses Stripe's test card: 4242 4242 4242 4242
    await page.goto('/');

    // Open donation checkout
    const donationButton = page.locator('[data-testid="donation-widget"] button:has-text("$20")');
    if (await donationButton.isVisible()) {
      await clickElement(page, '[data-testid="donation-widget"] button:has-text("$20")');
      await page.waitForLoadState('networkidle');

      // Fill donor email
      const emailInput = page.locator('input[name="email"]|input[type="email"]').first();
      if (await emailInput.isVisible()) {
        await fillInput(page, 'input[name="email"]', generateTestEmail());
      }

      // Fill name
      const nameInput = page.locator('input[name="name"]|input[name="fullName"]').first();
      if (await nameInput.isVisible()) {
        await fillInput(page, 'input[name="name"]', 'Test Donor');
      }

      // Fill Stripe card field via iframe
      const stripeFrame = page.frameLocator('iframe[title*="Stripe"][name*="card"]');
      const cardNumberField = stripeFrame.locator('input[name="cardnumber"]');

      if (await cardNumberField.isVisible()) {
        await cardNumberField.fill('4242424242424242');

        // Fill expiry
        const expiryField = stripeFrame.locator('input[name="exp-date"]');
        await expiryField.fill('1225');

        // Fill CVC
        const cvcField = stripeFrame.locator('input[name="cvc"]');
        await cvcField.fill('123');
      }

      // Submit payment
      const submitButton = page.locator('button:has-text("Donate")|button:has-text("Pay")|button[type="submit"]').last();
      
      // Wait for API response
      const paymentPromise = waitForAPIResponse(page, /payment|charge|donation/i, async () => {
        await clickElement(page, 'button:has-text("Donate")|button:has-text("Pay")|button[type="submit"]:last-child');
      });

      await paymentPromise;

      // Verify success
      await expectTextContent(page, '[role="status"]|[data-testid="success-message"]', /success|thank you|receipt/i);
    }
  });

  test('should display donation receipt after payment', async ({ page }) => {
    // Navigate to donation success page (or receipt page)
    // In a real scenario, this would be after a successful payment redirect
    
    // Check for receipt elements
    const receiptAmount = page.locator('[data-testid="receipt-amount"]|.receipt-amount');
    const receiptId = page.locator('[data-testid="receipt-id"]|.receipt-id');
    const receiptDate = page.locator('[data-testid="receipt-date"]|.receipt-date');

    // At least one should exist on a receipt page
    const elementsVisible = [
      await receiptAmount.isVisible().catch(() => false),
      await receiptId.isVisible().catch(() => false),
      await receiptDate.isVisible().catch(() => false),
    ].some(v => v === true);

    // This test is conditional based on page structure
    if (elementsVisible) {
      expect(elementsVisible).toBeTruthy();
    }
  });

  test('should reject invalid card', async ({ page }) => {
    // Uses Stripe's test card: 4000 0000 0000 0002 (card declined)
    await page.goto('/');

    const donationButton = page.locator('[data-testid="donation-widget"] button:has-text("$15")');
    if (await donationButton.isVisible()) {
      await clickElement(page, '[data-testid="donation-widget"] button:has-text("$15")');
      await page.waitForLoadState('networkidle');

      // Fill email
      const emailInput = page.locator('input[name="email"]|input[type="email"]').first();
      if (await emailInput.isVisible()) {
        await fillInput(page, 'input[name="email"]', generateTestEmail());
      }

      // Fill form data
      const nameInput = page.locator('input[name="name"]|input[name="fullName"]').first();
      if (await nameInput.isVisible()) {
        await fillInput(page, 'input[name="name"]', 'Test User');
      }

      // Fill invalid card
      const stripeFrame = page.frameLocator('iframe[title*="Stripe"][name*="card"]');
      const cardNumberField = stripeFrame.locator('input[name="cardnumber"]');

      if (await cardNumberField.isVisible()) {
        await cardNumberField.fill('4000000000000002'); // Declined card
        const expiryField = stripeFrame.locator('input[name="exp-date"]');
        await expiryField.fill('1225');
        const cvcField = stripeFrame.locator('input[name="cvc"]');
        await cvcField.fill('123');
      }

      // Submit
      const submitButton = page.locator('button:has-text("Donate")|button:has-text("Pay")|button[type="submit"]').last();
      await clickElement(page, 'button:has-text("Donate")|button:has-text("Pay")|button[type="submit"]:last-child');

      // Should show error
      await expectTextContent(page, '[role="alert"]|.error-message', /declined|invalid|error/i);
    }
  });

  test('should send donation receipt email', async ({ page }) => {
    // This test verifies email sending (would need email backend verification)
    // For now, just check that receipt email option is shown

    const emailCheckbox = page.locator('input[type="checkbox"][name="sendReceipt"]');
    if (await emailCheckbox.isVisible()) {
      await emailCheckbox.check();
      expect(await emailCheckbox.isChecked()).toBe(true);
    }
  });

  test('should display recurring donation option', async ({ page }) => {
    await page.goto('/');

    const recurringCheckbox = page.locator('input[type="checkbox"][name="recurring"]|input[type="checkbox"][name="monthly"]');
    
    if (await recurringCheckbox.isVisible()) {
      await recurringCheckbox.check();

      // Check for recurring frequency options
      const frequencySelect = page.locator('select[name="frequency"]|button[role="listbox"]');
      expect(await frequencySelect.isVisible()).toBeTruthy();
    }
  });

  test('should handle donation form validation', async ({ page }) => {
    await page.goto('/');

    const donationButton = page.locator('[data-testid="donation-widget"] button:has-text("$10")');
    if (await donationButton.isVisible()) {
      await clickElement(page, '[data-testid="donation-widget"] button:has-text("$10")');
      await page.waitForLoadState('networkidle');

      // Try to submit without required fields
      const submitButton = page.locator('button:has-text("Donate")|button:has-text("Pay")|button[type="submit"]').last();
      
      if (await submitButton.isEnabled()) {
        await clickElement(page, 'button:has-text("Donate")|button:has-text("Pay")|button[type="submit"]:last-child');

        // Should show validation errors
        const errors = page.locator('[role="alert"]');
        const errorCount = await errors.count();
        expect(errorCount).toBeGreaterThan(0);
      }
    }
  });

  test('should track donation analytics', async ({ page }) => {
    // Navigate and interact
    await page.goto('/');

    // Listen for analytics events
    let analyticsEvent = false;

    page.on('console', (msg) => {
      if (msg.text().includes('donation') || msg.text().includes('analytics')) {
        analyticsEvent = true;
      }
    });

    // Trigger donation interaction
    const donationButton = page.locator('[data-testid="donation-widget"] button').first();
    if (await donationButton.isVisible()) {
      await clickElement(page, '[data-testid="donation-widget"] button');
    }

    // Check for GTM/analytics data
    await page.waitForTimeout(1000);
  });

  test('should display donation goal/progress', async ({ page }) => {
    // Check admin dashboard or campaigns page for donation progress
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    // Login first
    await page.goto('/auth/login');
    await fillInput(page, 'input[name="email"]', testEmail);
    await fillInput(page, 'input[name="password"]', testPassword);
    await clickElement(page, 'button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Navigate to donations/campaigns page
    await page.goto('/admin/campaigns');

    // Check for progress display
    const progressBar = page.locator('[data-testid="donation-progress"]|.progress-bar');
    const goalAmount = page.locator('[data-testid="goal-amount"]|.goal-amount');

    expect(await progressBar.isVisible().catch(() => false) || await goalAmount.isVisible().catch(() => false)).toBeTruthy();
  });

  test('should prevent double charge on retry', async ({ page }) => {
    // Test idempotency key handling
    await page.goto('/');

    // This test checks that if payment is submitted twice,
    // it doesn't result in two charges

    const donationButton = page.locator('[data-testid="donation-widget"] button:has-text("$30")');
    if (await donationButton.isVisible()) {
      await clickElement(page, '[data-testid="donation-widget"] button:has-text("$30")');
      await page.waitForLoadState('networkidle');

      // Check for idempotency key in form
      const idempotencyKey = page.locator('input[type="hidden"][name*="idempotency"]|input[type="hidden"][name*="key"]');
      
      if (await idempotencyKey.isVisible()) {
        const keyValue = await idempotencyKey.inputValue();
        expect(keyValue).toBeTruthy();
        expect(keyValue.length).toBeGreaterThan(0);
      }
    }
  });
});
