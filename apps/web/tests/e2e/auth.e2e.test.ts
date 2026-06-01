import { test, expect } from '../fixtures/auth';

/**
 * Authentication E2E Tests
 * Tests login, logout, token refresh, and session management
 */

test.describe('Authentication Flow', () => {
  test('TC-AUTH-001: User login with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Submit form
    await page.click('button:has-text("Sign In")');

    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');

    // Verify token is stored
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();

    // Verify user is logged in
    expect(page.url()).toContain('/dashboard');
  });

  test('TC-AUTH-002: User login with invalid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill login form with wrong password
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Submit form
    await page.click('button:has-text("Sign In")');

    // Verify error message displayed
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toContainText('Invalid credentials');

    // Verify user not logged in
    expect(page.url()).toContain('/login');
  });

  test('TC-AUTH-003: Logout functionality', async ({ adminPage }) => {
    // Navigate to dashboard (admin already authenticated)
    await adminPage.goto('/dashboard');

    // Click logout button
    await adminPage.click('button:has-text("Logout")');

    // Wait for redirect to login
    await adminPage.waitForURL('/login');

    // Verify token is cleared
    const token = await adminPage.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });

  test('TC-AUTH-004: Session persistence after page reload', async ({ adminPage }) => {
    // Navigate to dashboard
    await adminPage.goto('/dashboard');

    // Verify user data loaded
    const userName = adminPage.locator('[data-testid="user-name"]');
    await expect(userName).toBeVisible();

    // Reload page
    await adminPage.reload();

    // Verify user still logged in
    const userNameAfterReload = adminPage.locator('[data-testid="user-name"]');
    await expect(userNameAfterReload).toBeVisible();

    // Verify still on dashboard
    expect(adminPage.url()).toContain('/dashboard');
  });

  test('TC-AUTH-005: Protected route access without authentication', async ({ page }) => {
    // Clear localStorage (simulate no auth)
    await page.evaluate(() => localStorage.clear());

    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/login');

    expect(page.url()).toContain('/login');
  });

  test('TC-AUTH-006: Protected route access with valid token', async ({ adminPage }) => {
    // Navigate to protected route directly
    await adminPage.goto('/dashboard');

    // Should load successfully
    await adminPage.waitForURL('/dashboard');

    expect(adminPage.url()).toContain('/dashboard');
    await expect(adminPage.locator('main')).toBeVisible();
  });

  test('TC-AUTH-007: Admin-only route access', async ({ userPage }) => {
    // User token has USER role, not ADMIN
    await userPage.goto('/admin');

    // Should be redirected to unauthorized or dashboard
    // (depending on implementation)
    const url = userPage.url();
    expect(
      url.includes('/login') || url.includes('/dashboard') || url.includes('/unauthorized'),
    ).toBeTruthy();
  });

  test('TC-AUTH-008: Admin can access admin routes', async ({ adminPage }) => {
    // Admin token has ADMIN role
    await adminPage.goto('/admin/analytics');

    // Should load successfully
    await adminPage.waitForURL('/admin/analytics');

    expect(adminPage.url()).toContain('/admin/analytics');
    await expect(adminPage.locator('main')).toBeVisible();
  });

  test('TC-AUTH-009: Password reset flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Click "Forgot Password" link
    await page.click('a:has-text("Forgot Password")');

    // Fill reset form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button:has-text("Send Reset Link")');

    // Verify success message
    await expect(page.locator('[role="alert"]')).toContainText('Reset link sent');
  });

  test('TC-AUTH-010: User registration', async ({ page }) => {
    // Navigate to signup
    await page.goto('/signup');

    // Fill registration form
    await page.fill('input[name="fullName"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');

    // Accept terms
    await page.check('input[name="acceptTerms"]');

    // Submit form
    await page.click('button:has-text("Create Account")');

    // Verify redirected to verification or dashboard
    await page.waitForURL(/\/(verify-email|dashboard)/);

    expect(page.url()).toMatch(/\/(verify-email|dashboard)/);
  });
});

test.describe('Session Management', () => {
  test('TC-SESSION-001: Multiple concurrent sessions', async ({ context }) => {
    // Open two pages with different users
    const adminPage = await context.newPage();
    const userPage = await context.newPage();

    // Admin login
    await adminPage.goto('/login');
    await adminPage.fill('input[name="email"]', 'admin@example.com');
    await adminPage.fill('input[name="password"]', 'adminpass');
    await adminPage.click('button:has-text("Sign In")');
    await adminPage.waitForURL('/dashboard');

    // User login
    await userPage.goto('/login');
    await userPage.fill('input[name="email"]', 'user@example.com');
    await userPage.fill('input[name="password"]', 'userpass');
    await userPage.click('button:has-text("Sign In")');
    await userPage.waitForURL('/dashboard');

    // Verify both sessions independent
    const adminToken = await adminPage.evaluate(() => localStorage.getItem('auth_token'));
    const userToken = await userPage.evaluate(() => localStorage.getItem('auth_token'));

    expect(adminToken).not.toEqual(userToken);

    await adminPage.close();
    await userPage.close();
  });

  test('TC-SESSION-002: Concurrent request handling', async ({ adminPage }) => {
    // Navigate to dashboard
    await adminPage.goto('/dashboard');

    // Make multiple API requests
    const requests = [
      adminPage.request.get('/api/messages'),
      adminPage.request.get('/api/analytics/messages?period=week'),
      adminPage.request.get('/api/broadcasts'),
    ];

    const responses = await Promise.all(requests);

    // All should succeed
    responses.forEach((response) => {
      expect(response.ok()).toBeTruthy();
    });
  });
});
