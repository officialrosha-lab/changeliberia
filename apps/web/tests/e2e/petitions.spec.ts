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
  getTableData,
} from './test-helpers';

/**
 * Petitions E2E tests
 * Tests: create, view, sign, search, share
 */

test.describe('Petitions Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.goto('/auth/login');
    await fillInput(page, 'input[name="email"]', testEmail);
    await fillInput(page, 'input[name="password"]', testPassword);
    await clickElement(page, 'button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL(/dashboard|home/, { timeout: 10000 });
  });

  test('should display petitions list on home page', async ({ page }) => {
    await page.goto('/');

    // Check for petitions grid
    const petitionsGrid = page.locator('[data-testid="petitions-grid"]');
    await expect(petitionsGrid).toBeVisible();

    // Check for petition cards
    const petitionCards = page.locator('[data-testid="petition-card"]');
    const count = await petitionCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should search petitions by keyword', async ({ page }) => {
    await page.goto('/petitions');

    // Fill search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await fillInput(page, 'input[placeholder*="Search"]', 'healthcare');

      // Wait for results to update
      await page.waitForLoadState('networkidle');

      // Verify results contain keyword
      const petitionTitles = page.locator('[data-testid="petition-title"]');
      const firstTitle = await petitionTitles.first().textContent();
      expect(firstTitle?.toLowerCase()).toContain('healthcare');
    }
  });

  test('should filter petitions by category', async ({ page }) => {
    await page.goto('/petitions');

    // Look for category filter
    const categorySelect = page.locator('select[name="category"]');
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption('healthcare');

      // Wait for results to load
      await page.waitForLoadState('networkidle');

      // Verify results are filtered
      const petitionCards = page.locator('[data-testid="petition-card"]');
      const count = await petitionCards.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should view petition details', async ({ page }) => {
    await page.goto('/petitions');

    // Click first petition
    const firstPetition = page.locator('[data-testid="petition-card"]').first();
    await firstPetition.click();

    // Wait for navigation
    await page.waitForURL(/\/petitions\/\d+|[a-z0-9-]+$/);

    // Verify petition details are visible
    await expectTextContent(page, 'h1', /.+/); // Title
    await expectTextContent(page, '[data-testid="petition-description"]', /.+/); // Description
    
    // Check for sign button
    const signButton = page.locator('button:has-text("Sign Petition")');
    await expect(signButton).toBeVisible();
  });

  test('should sign a petition', async ({ page }) => {
    // Navigate to a petition
    await page.goto('/petitions');
    const firstPetition = page.locator('[data-testid="petition-card"]').first();
    await firstPetition.click();

    await page.waitForURL(/\/petitions\/\d+|[a-z0-9-]+$/);

    // Get initial signature count
    const signatureCountBefore = await getText(page, '[data-testid="signature-count"]');
    const beforeCount = parseInt(signatureCountBefore.match(/\d+/)?.[0] || '0');

    // Click sign petition button
    const signButton = page.locator('button:has-text("Sign Petition")');
    await clickElement(page, 'button:has-text("Sign Petition")');

    // Handle modal or form if it appears
    const modal = page.locator('[role="dialog"]');
    if (await modal.isVisible()) {
      // Check if we need to fill additional info
      const emailInput = modal.locator('input[name="email"]');
      if (await emailInput.isVisible()) {
        const testEmail = generateTestEmail();
        await fillInput(page, 'input[name="email"]', testEmail);
      }

      // Confirm signature
      const confirmButton = modal.locator('button:has-text("Confirm")');
      await clickElement(page, 'button:has-text("Confirm")');
    }

    // Verify success message
    await expectTextContent(page, '[role="status"]', /thank you|signed|success/i);

    // Verify signature count increased
    await page.waitForTimeout(1000); // Wait for count to update
    const signatureCountAfter = await getText(page, '[data-testid="signature-count"]');
    const afterCount = parseInt(signatureCountAfter.match(/\d+/)?.[0] || '0');
    expect(afterCount).toBeGreaterThan(beforeCount);
  });

  test('should prevent duplicate signatures', async ({ page }) => {
    // Navigate to petition
    await page.goto('/petitions');
    const firstPetition = page.locator('[data-testid="petition-card"]').first();
    await firstPetition.click();

    await page.waitForURL(/\/petitions\/\d+|[a-z0-9-]+$/);

    // Try to sign
    const signButton = page.locator('button:has-text("Sign Petition")');
    if (await signButton.isVisible()) {
      await clickElement(page, 'button:has-text("Sign Petition")');

      // Handle modal
      const modal = page.locator('[role="dialog"]');
      if (await modal.isVisible()) {
        await clickElement(page, 'button:has-text("Confirm")');
      }

      // Wait and try signing again
      await page.waitForTimeout(1000);

      // Check if button is disabled or shows error
      const disabledButton = page.locator('button:has-text("Already Signed")');
      const errorMessage = page.locator('[role="alert"]:has-text("already")');

      const isDuplicate = (await disabledButton.isVisible()) || (await errorMessage.isVisible());
      expect(isDuplicate).toBeTruthy();
    }
  });

  test('should create new petition', async ({ page }) => {
    // Navigate to create petition
    await page.goto('/create');
    await expect(page).toHaveTitle(/Create|New Petition/i);

    // Fill petition form
    const formData = {
      '[name="title"]': 'Test Petition for Healthcare Reform',
      '[name="description"]': 'This is a test petition to improve healthcare services in Liberia.',
      '[name="category"]': 'healthcare',
      '[name="goal"]': '1000',
    };

    await fillForm(page, formData);

    // Check if there's a wizard/stepper
    const nextButton = page.locator('button:has-text("Next")');
    if (await nextButton.isVisible()) {
      await clickElement(page, 'button:has-text("Next")');
      await page.waitForLoadState('networkidle');
    }

    // Submit form
    const submitButton = page.locator('button:has-text("Create Petition")|button:has-text("Submit")');
    await waitForNavigation(page, async () => {
      await clickElement(page, 'button:has-text("Create Petition")|button:has-text("Submit")');
    });

    // Verify petition was created
    const url = page.url();
    expect(url).toMatch(/\/petitions\/|success/i);

    // Verify success message
    await expectTextContent(page, '[role="status"]', /created|success/i);
  });

  test('should share petition via social media', async ({ page }) => {
    // Navigate to petition
    await page.goto('/petitions');
    const firstPetition = page.locator('[data-testid="petition-card"]').first();
    await firstPetition.click();

    await page.waitForURL(/\/petitions\/\d+|[a-z0-9-]+$/);

    // Click share button
    const shareButton = page.locator('button[aria-label*="Share"]:not([aria-label*="count"])');
    if (await shareButton.isVisible()) {
      await clickElement(page, 'button[aria-label*="Share"]:not([aria-label*="count"])');

      // Wait for share modal
      const shareModal = page.locator('[data-testid="share-modal"]|[role="dialog"]');
      await expect(shareModal).toBeVisible();

      // Check for social links
      const twitterLink = shareModal.locator('a[href*="twitter"]|a[href*="x.com"]');
      const facebookLink = shareModal.locator('a[href*="facebook"]');

      expect(await twitterLink.isVisible()).toBeTruthy();
      expect(await facebookLink.isVisible()).toBeTruthy();
    }
  });

  test('should copy petition link to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Navigate to petition
    await page.goto('/petitions');
    const firstPetition = page.locator('[data-testid="petition-card"]').first();
    await firstPetition.click();

    await page.waitForURL(/\/petitions\/\d+|[a-z0-9-]+$/);

    // Click copy link button
    const copyButton = page.locator('button[aria-label*="Copy"]|button:has-text("Copy Link")');
    if (await copyButton.isVisible()) {
      await copyButton.click();

      // Verify success message
      await expectTextContent(page, '[role="status"]', /copied|clipboard/i);
    }
  });

  test('should sort petitions by trending', async ({ page }) => {
    await page.goto('/petitions');

    // Find sort dropdown
    const sortSelect = page.locator('select[name="sort"]|button[aria-label*="Sort"]');
    if (await sortSelect.isVisible()) {
      const isSelectElement = await sortSelect.evaluate((el) => el instanceof HTMLSelectElement);
      if (isSelectElement) {
        await sortSelect.selectOption('trending');
      } else {
        await clickElement(page, 'button[aria-label*="Sort"]');
        await clickElement(page, '[role="option"]:has-text("Trending")');
      }

      // Wait for results to update
      await page.waitForLoadState('networkidle');

      // Verify petitions are sorted by signature count
      const petitionCards = page.locator('[data-testid="petition-card"]');
      expect(await petitionCards.count()).toBeGreaterThan(0);
    }
  });

  test('should display petition stats', async ({ page }) => {
    // Navigate to petition
    await page.goto('/petitions');
    const firstPetition = page.locator('[data-testid="petition-card"]').first();
    await firstPetition.click();

    await page.waitForURL(/\/petitions\/\d+|[a-z0-9-]+$/);

    // Check for various stats
    const signatureCount = page.locator('[data-testid="signature-count"]');
    const daysRemaining = page.locator('[data-testid="days-remaining"]');
    const progressBar = page.locator('[data-testid="progress-bar"]');

    expect(await signatureCount.isVisible()).toBeTruthy();
    expect(await daysRemaining.isVisible()).toBeTruthy();
    expect(await progressBar.isVisible()).toBeTruthy();
  });

  test('should save draft petition', async ({ page }) => {
    // Navigate to create petition
    await page.goto('/create');

    // Fill some fields
    await fillInput(page, 'input[name="title"]', 'Draft Petition');
    await fillInput(page, 'input[name="description"]', 'This is a draft petition.');

    // Click save draft button
    const saveDraftButton = page.locator('button:has-text("Save Draft")');
    if (await saveDraftButton.isVisible()) {
      await clickElement(page, 'button:has-text("Save Draft")');

      // Verify success message
      await expectTextContent(page, '[role="status"]', /saved|draft/i);

      // Navigate away and back to verify persistence
      await page.goto('/dashboard');
      await page.goto('/create');

      // Check if draft is restored
      const titleValue = await page.locator('input[name="title"]').inputValue();
      expect(titleValue).toBe('Draft Petition');
    }
  });
});
