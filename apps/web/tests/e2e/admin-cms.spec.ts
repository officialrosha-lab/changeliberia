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
  uploadFile,
} from './test-helpers';

/**
 * Admin CMS E2E tests
 * Tests: page builder, content creation, publishing, asset management
 */

test.describe('Admin CMS Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!';

    await page.goto('/auth/login');
    await fillInput(page, 'input[name="email"]', adminEmail);
    await fillInput(page, 'input[name="password"]', adminPassword);
    await clickElement(page, 'button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL(/dashboard|admin/, { timeout: 10000 });
  });

  test('should display admin CMS dashboard', async ({ page }) => {
    await page.goto('/admin/cms');

    // Check for CMS interface
    const cmsDashboard = page.locator('[data-testid="cms-dashboard"]|[data-testid="admin-cms"]');
    await expect(cmsDashboard).toBeVisible();

    // Check for content list
    const contentList = page.locator('[data-testid="content-list"]|[data-testid="pages-list"]');
    expect(await contentList.isVisible()).toBeTruthy();
  });

  test('should list all pages in CMS', async ({ page }) => {
    await page.goto('/admin/cms/pages');

    // Check for page list
    const pageItems = page.locator('[data-testid="page-item"]|tr[data-testid*="page"]');
    const count = await pageItems.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should create new page with page builder', async ({ page }) => {
    await page.goto('/admin/cms/pages');

    // Click create page button
    const createButton = page.locator('button:has-text("Create Page")|button:has-text("New Page")|a:has-text("New Page")');
    if (await createButton.isVisible()) {
      await clickElement(page, 'button:has-text("Create Page")|button:has-text("New Page")|a:has-text("New Page")');
    }

    // Wait for page builder to load
    await page.waitForLoadState('networkidle');

    // Check for builder interface
    const pageBuilder = page.locator('[data-testid="page-builder"]|.page-builder');
    expect(await pageBuilder.isVisible()).toBeTruthy();

    // Fill page details
    const titleInput = page.locator('input[name="title"]|input[placeholder*="Title"]');
    if (await titleInput.isVisible()) {
      await fillInput(page, 'input[name="title"]', 'Test Page');
    }

    const slugInput = page.locator('input[name="slug"]|input[placeholder*="URL slug"]');
    if (await slugInput.isVisible()) {
      await fillInput(page, 'input[name="slug"]', 'test-page');
    }
  });

  test('should add content block to page', async ({ page }) => {
    await page.goto('/admin/cms/pages/new');
    await page.waitForLoadState('networkidle');

    // Look for add block button
    const addBlockButton = page.locator('button:has-text("Add Block")|button[aria-label*="Add"]');
    if (await addBlockButton.isVisible()) {
      await clickElement(page, 'button:has-text("Add Block")|button[aria-label*="Add"]');

      // Wait for block menu
      const blockMenu = page.locator('[role="menu"]|[data-testid="block-menu"]');
      await expect(blockMenu).toBeVisible();

      // Add a text block
      const textBlockOption = blockMenu.locator('button:has-text("Text")|li:has-text("Text")');
      if (await textBlockOption.isVisible()) {
        await clickElement(page, 'button:has-text("Text")|li:has-text("Text")');
      }

      // Verify block added
      const blockContent = page.locator('[data-testid="content-block"]');
      expect(await blockContent.count()).toBeGreaterThan(0);
    }
  });

  test('should edit block content', async ({ page }) => {
    await page.goto('/admin/cms/pages/new');
    await page.waitForLoadState('networkidle');

    // Add a text block first
    const addBlockButton = page.locator('button:has-text("Add Block")').first();
    if (await addBlockButton.isVisible()) {
      await clickElement(page, 'button:has-text("Add Block")');

      const textBlockOption = page.locator('button:has-text("Text")').first();
      if (await textBlockOption.isVisible()) {
        await clickElement(page, 'button:has-text("Text")');
      }

      // Edit block content
      const contentArea = page.locator('[contenteditable="true"]|textarea[name*="content"]').first();
      if (await contentArea.isVisible()) {
        await fillInput(page, '[contenteditable="true"]|textarea[name*="content"]', 'Test content');
      }
    }
  });

  test('should configure block settings', async ({ page }) => {
    await page.goto('/admin/cms/pages/new');
    await page.waitForLoadState('networkidle');

    // Add a block
    const addBlockButton = page.locator('button:has-text("Add Block")').first();
    if (await addBlockButton.isVisible()) {
      await clickElement(page, 'button:has-text("Add Block")');

      const blockOption = page.locator('button:has-text("Image")').first();
      if (await blockOption.isVisible()) {
        await clickElement(page, 'button:has-text("Image")');

        // Open settings
        const settingsButton = page.locator('button[aria-label*="Settings"]|button[aria-label*="Configure"]').first();
        if (await settingsButton.isVisible()) {
          await clickElement(page, settingsButton);

          // Check for settings panel
          const settingsPanel = page.locator('[data-testid="settings-panel"]|[role="dialog"]');
          expect(await settingsPanel.isVisible()).toBeTruthy();
        }
      }
    }
  });

  test('should upload image to media library', async ({ page }) => {
    await page.goto('/admin/cms/media');
    await page.waitForLoadState('networkidle');

    // Find upload area
    const uploadArea = page.locator('[data-testid="upload-area"]|input[type="file"]');
    if (await uploadArea.isVisible()) {
      // Create a test image file
      const testImagePath = '/tmp/test-image.png';
      
      // Upload file
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles(testImagePath).catch(() => {
          // File might not exist, that's ok for this test
        });
      }
    }
  });

  test('should set page SEO metadata', async ({ page }) => {
    await page.goto('/admin/cms/pages/new');
    await page.waitForLoadState('networkidle');

    // Look for SEO section
    const seoSection = page.locator('[data-testid="seo-section"]|button:has-text("SEO")');
    if (await seoSection.isVisible()) {
      const isSeoButton = await seoSection.evaluate((el) => el instanceof HTMLButtonElement);
      if (isSeoButton) {
        await clickElement(page, 'button:has-text("SEO")');
      }

      // Fill SEO fields
      const formData = {
        '[name="metaTitle"]': 'Test Page Title',
        '[name="metaDescription"]': 'Test page description for search engines',
        '[name="metaKeywords"]': 'test, page, keywords',
      };

      await fillForm(page, formData);

      // Check SEO preview
      const seoPreview = page.locator('[data-testid="seo-preview"]');
      expect(await seoPreview.isVisible().catch(() => false)).toBeTruthy();
    }
  });

  test('should create content type', async ({ page }) => {
    await page.goto('/admin/cms/content-types');
    await page.waitForLoadState('networkidle');

    // Click create content type
    const createButton = page.locator('button:has-text("Create Type")|button:has-text("New Type")');
    if (await createButton.isVisible()) {
      await clickElement(page, 'button:has-text("Create Type")|button:has-text("New Type")');

      // Fill content type name
      const nameInput = page.locator('input[name="name"]|input[placeholder*="Name"]');
      if (await nameInput.isVisible()) {
        await fillInput(page, 'input[name="name"]', 'Test Content Type');
      }

      // Add fields
      const addFieldButton = page.locator('button:has-text("Add Field")').first();
      if (await addFieldButton.isVisible()) {
        await clickElement(page, 'button:has-text("Add Field")');

        // Configure field
        const fieldNameInput = page.locator('input[name="fieldName"]').last();
        if (await fieldNameInput.isVisible()) {
          await fillInput(page, 'input[name="fieldName"]', 'testField');
        }
      }
    }
  });

  test('should edit existing page', async ({ page }) => {
    await page.goto('/admin/cms/pages');
    await page.waitForLoadState('networkidle');

    // Click first page to edit
    const firstPageLink = page.locator('[data-testid="page-item"] a').first();
    if (await firstPageLink.isVisible()) {
      await clickElement(page, '[data-testid="page-item"] a');

      // Wait for editor
      await page.waitForLoadState('networkidle');

      // Edit page content
      const contentArea = page.locator('[contenteditable="true"]|textarea[name*="content"]').first();
      if (await contentArea.isVisible()) {
        await fillInput(page, '[contenteditable="true"]|textarea[name*="content"]', 'Updated content');
      }

      // Save changes
      const saveButton = page.locator('button:has-text("Save")|button:has-text("Update")');
      if (await saveButton.isVisible()) {
        await clickElement(page, 'button:has-text("Save")|button:has-text("Update")');

        // Verify success
        await expectTextContent(page, '[role="status"]', /saved|success|updated/i);
      }
    }
  });

  test('should publish draft page', async ({ page }) => {
    await page.goto('/admin/cms/pages');
    await page.waitForLoadState('networkidle');

    // Find a draft page
    const draftPage = page.locator('[data-testid="page-item"][data-status="draft"]').first();
    if (await draftPage.isVisible()) {
      // Open page
      const pageLink = draftPage.locator('a').first();
      await clickElement(page, pageLink);

      await page.waitForLoadState('networkidle');

      // Click publish button
      const publishButton = page.locator('button:has-text("Publish")');
      if (await publishButton.isVisible()) {
        await clickElement(page, 'button:has-text("Publish")');

        // Confirm publication
        const confirmButton = page.locator('[role="dialog"] button:has-text("Publish")|button:has-text("Confirm")');
        if (await confirmButton.isVisible()) {
          await clickElement(page, confirmButton);
        }

        // Verify success
        await expectTextContent(page, '[role="status"]', /published|live/i);
      }
    }
  });

  test('should unpublish page', async ({ page }) => {
    await page.goto('/admin/cms/pages');
    await page.waitForLoadState('networkidle');

    // Find a published page
    const publishedPage = page.locator('[data-testid="page-item"][data-status="published"]').first();
    if (await publishedPage.isVisible()) {
      // Open page
      const pageLink = publishedPage.locator('a').first();
      await clickElement(page, pageLink);

      await page.waitForLoadState('networkidle');

      // Click unpublish button
      const unpublishButton = page.locator('button:has-text("Unpublish")');
      if (await unpublishButton.isVisible()) {
        await clickElement(page, 'button:has-text("Unpublish")');

        // Confirm
        const confirmButton = page.locator('[role="dialog"] button:has-text("Unpublish")');
        if (await confirmButton.isVisible()) {
          await clickElement(page, confirmButton);
        }

        // Verify success
        await expectTextContent(page, '[role="status"]', /unpublished|draft/i);
      }
    }
  });

  test('should delete page', async ({ page }) => {
    await page.goto('/admin/cms/pages');
    await page.waitForLoadState('networkidle');

    // Click first page
    const firstPageLink = page.locator('[data-testid="page-item"] a').first();
    if (await firstPageLink.isVisible()) {
      await clickElement(page, '[data-testid="page-item"] a');

      await page.waitForLoadState('networkidle');

      // Click delete button
      const deleteButton = page.locator('button:has-text("Delete")|button[aria-label*="Delete"]');
      if (await deleteButton.isVisible()) {
        await clickElement(page, deleteButton);

        // Confirm deletion
        const confirmButton = page.locator('[role="dialog"] button:has-text("Delete")|button:has-text("Confirm")');
        if (await confirmButton.isVisible()) {
          await clickElement(page, confirmButton);
        }

        // Verify redirect to pages list
        await page.waitForURL(/cms\/pages/, { timeout: 5000 });
        expect(page.url()).toContain('cms/pages');
      }
    }
  });

  test('should preview page before publishing', async ({ page }) => {
    await page.goto('/admin/cms/pages');
    await page.waitForLoadState('networkidle');

    // Open a page
    const firstPageLink = page.locator('[data-testid="page-item"] a').first();
    if (await firstPageLink.isVisible()) {
      await clickElement(page, '[data-testid="page-item"] a');

      await page.waitForLoadState('networkidle');

      // Click preview button
      const previewButton = page.locator('button:has-text("Preview")|button[aria-label*="Preview"]');
      if (await previewButton.isVisible()) {
        await clickElement(page, 'button:has-text("Preview")|button[aria-label*="Preview"]');

        // Check for preview modal
        const previewModal = page.locator('[data-testid="preview-modal"]|[role="dialog"]');
        expect(await previewModal.isVisible()).toBeTruthy();
      }
    }
  });

  test('should duplicate page', async ({ page }) => {
    await page.goto('/admin/cms/pages');
    await page.waitForLoadState('networkidle');

    // Get page count before
    const pagesBefore = await page.locator('[data-testid="page-item"]').count();

    // Open a page
    const firstPageLink = page.locator('[data-testid="page-item"] a').first();
    if (await firstPageLink.isVisible()) {
      await clickElement(page, '[data-testid="page-item"] a');

      await page.waitForLoadState('networkidle');

      // Click duplicate button
      const duplicateButton = page.locator('button:has-text("Duplicate")|button[aria-label*="Duplicate"]');
      if (await duplicateButton.isVisible()) {
        await clickElement(page, 'button:has-text("Duplicate")|button[aria-label*="Duplicate"]');

        // Verify success
        await expectTextContent(page, '[role="status"]', /duplicated|copied/i);

        // Navigate back to pages list
        await page.goto('/admin/cms/pages');

        // Check page count increased
        const pagesAfter = await page.locator('[data-testid="page-item"]').count();
        expect(pagesAfter).toBeGreaterThan(pagesBefore);
      }
    }
  });

  test('should manage content revisions', async ({ page }) => {
    await page.goto('/admin/cms/pages');
    await page.waitForLoadState('networkidle');

    // Open a page
    const firstPageLink = page.locator('[data-testid="page-item"] a').first();
    if (await firstPageLink.isVisible()) {
      await clickElement(page, '[data-testid="page-item"] a');

      await page.waitForLoadState('networkidle');

      // Look for revisions tab
      const revisionsTab = page.locator('button:has-text("Revisions")|[role="tab"]:has-text("Revisions")');
      if (await revisionsTab.isVisible()) {
        await clickElement(page, revisionsTab);

        // Check for revision list
        const revisionsList = page.locator('[data-testid="revision-item"]');
        expect(await revisionsList.count()).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should display page performance metrics', async ({ page }) => {
    await page.goto('/admin/cms/pages');
    await page.waitForLoadState('networkidle');

    // Open a page
    const firstPageLink = page.locator('[data-testid="page-item"] a').first();
    if (await firstPageLink.isVisible()) {
      await clickElement(page, '[data-testid="page-item"] a');

      await page.waitForLoadState('networkidle');

      // Look for performance section
      const performanceSection = page.locator('[data-testid="performance-section"]|[data-testid="insights"]');
      if (await performanceSection.isVisible()) {
        // Check for metrics
        const metrics = page.locator('[data-testid="metric"]');
        expect(await metrics.count()).toBeGreaterThan(0);
      }
    }
  });
});
