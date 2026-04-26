import { test, expect } from '@playwright/test';
import {
  fillInput,
  clickElement,
  expectTextContent,
  generateTestEmail,
  generateTestPassword,
  waitForNavigation,
  isVisible,
} from './test-helpers';

/**
 * User authentication E2E tests
 * Tests: signup, login, logout, password reset
 */

test.describe('Authentication Flow', () => {
  test('should signup with valid credentials', async ({ page }) => {
    const email = generateTestEmail();
    const password = generateTestPassword();

    // Navigate to signup page
    await page.goto('/auth/signup');
    await expect(page).toHaveTitle(/Sign Up|Register/i);

    // Fill signup form
    await fillInput(page, 'input[name="email"]', email);
    await fillInput(page, 'input[name="password"]', password);
    await fillInput(page, 'input[name="confirmPassword"]', password);
    await fillInput(page, 'input[name="fullName"]', 'Test User');

    // Accept terms
    const termsCheckbox = page.locator('input[type="checkbox"][name="terms"]');
    if (await isVisible(page, 'input[type="checkbox"][name="terms"]')) {
      await termsCheckbox.click();
    }

    // Submit form
    await waitForNavigation(page, async () => {
      await clickElement(page, 'button[type="submit"]');
    });

    // Verify redirect to dashboard or verification page
    const url = page.url();
    expect(url).toMatch(/dashboard|verify|login/i);
  });

  test('should login with valid credentials', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    // Navigate to login page
    await page.goto('/auth/login');
    await expect(page).toHaveTitle(/Login|Sign In/i);

    // Fill login form
    await fillInput(page, 'input[name="email"]', testEmail);
    await fillInput(page, 'input[name="password"]', testPassword);

    // Submit form
    await waitForNavigation(page, async () => {
      await clickElement(page, 'button[type="submit"]');
    });

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/dashboard|home/);
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill form with invalid data
    await fillInput(page, 'input[name="email"]', 'invalid-email');
    await fillInput(page, 'input[name="password"]', 'password123');

    // Submit form
    await clickElement(page, 'button[type="submit"]');

    // Verify error message
    await expectTextContent(page, '[role="alert"]', /invalid|valid email/i);
  });

  test('should show error for incorrect password', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';

    await page.goto('/auth/login');

    // Fill form with wrong password
    await fillInput(page, 'input[name="email"]', testEmail);
    await fillInput(page, 'input[name="password"]', 'wrongpassword123');

    // Submit form
    await clickElement(page, 'button[type="submit"]');

    // Verify error message
    await expectTextContent(page, '[role="alert"]', /incorrect|invalid|wrong/i);
  });

  test('should logout successfully', async ({ page, context }) => {
    // First login
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.goto('/auth/login');
    await fillInput(page, 'input[name="email"]', testEmail);
    await fillInput(page, 'input[name="password"]', testPassword);
    await clickElement(page, 'button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL(/dashboard|home/, { timeout: 10000 });

    // Click logout
    await clickElement(page, '[data-testid="logout-button"]');

    // Verify redirect to login/home
    await page.waitForURL(/login|home/, { timeout: 5000 });
    const url = page.url();
    expect(url).not.toMatch(/dashboard|admin/);
  });

  test('should require strong password on signup', async ({ page }) => {
    const email = generateTestEmail();

    await page.goto('/auth/signup');

    // Fill form with weak password
    await fillInput(page, 'input[name="email"]', email);
    await fillInput(page, 'input[name="password"]', 'weak');
    await fillInput(page, 'input[name="confirmPassword"]', 'weak');

    // Look for password strength indicator
    const strengthIndicator = page.locator('[data-testid="password-strength"]');
    if (await strengthIndicator.isVisible()) {
      const strengthText = await strengthIndicator.textContent();
      expect(strengthText).toMatch(/weak|poor/i);
    }

    // Try to submit
    const submitButton = page.locator('button[type="submit"]');
    const isDisabled = await submitButton.isDisabled();
    expect(
      isDisabled || (await expectTextContent(page, '[role="alert"]', /strong|password/i))
    ).toBeTruthy();
  });

  test('should handle password reset flow', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';

    // Navigate to forgot password
    await page.goto('/auth/login');
    const forgotLink = page.locator('a:has-text("Forgot Password")');
    
    if (await forgotLink.isVisible()) {
      await forgotLink.click();

      // Fill email
      await fillInput(page, 'input[name="email"]', testEmail);

      // Submit
      await clickElement(page, 'button[type="submit"]');

      // Verify success message
      await expectTextContent(page, '[role="status"]', /check|email|sent/i);
    }
  });

  test('should persist auth state across page reloads', async ({ page, context }) => {
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    // Login
    await page.goto('/auth/login');
    await fillInput(page, 'input[name="email"]', testEmail);
    await fillInput(page, 'input[name="password"]', testPassword);
    await clickElement(page, 'button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL(/dashboard|home/, { timeout: 10000 });

    // Reload page
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    const url = page.url();
    expect(url).toMatch(/dashboard|home/);
  });

  test('should redirect to login for unauthenticated users', async ({ page }) => {
    // Try to access protected page without login
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Should redirect to login
    const url = page.url();
    expect(url).toMatch(/login|auth/);
  });

  test('should show password visibility toggle', async ({ page }) => {
    await page.goto('/auth/login');

    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.locator('[data-testid="password-visibility-toggle"]');

    if (await toggleButton.isVisible()) {
      // Check initial type is password
      let type = await passwordInput.getAttribute('type');
      expect(type).toBe('password');

      // Click toggle
      await toggleButton.click();

      // Check type changed to text
      type = await passwordInput.getAttribute('type');
      expect(type).toBe('text');

      // Click again to hide
      await toggleButton.click();
      type = await passwordInput.getAttribute('type');
      expect(type).toBe('password');
    }
  });
});
