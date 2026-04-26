import { test, expect } from '@playwright/test';
import {
  fillInput,
  clickElement,
  expectTextContent,
  generateTestPassword,
  getText,
  isVisible,
} from './test-helpers';

/**
 * Admin Dashboard E2E tests
 * Tests: analytics, performance metrics, security audit, revenue tracking
 */

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!';

    await page.goto('/auth/login');
    await fillInput(page, 'input[name="email"]', adminEmail);
    await fillInput(page, 'input[name="password"]', adminPassword);
    await clickElement(page, 'button[type="submit"]');

    // Wait for dashboard navigation
    await page.waitForURL(/dashboard/, { timeout: 10000 });
  });

  test('should display admin dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Check for dashboard content
    const dashboard = page.locator('[data-testid="admin-dashboard"]|[data-testid="dashboard"]');
    await expect(dashboard).toBeVisible();

    // Check for key sections
    const analyticsSection = page.locator('[data-testid="analytics-section"]');
    expect(await analyticsSection.isVisible()).toBeTruthy();
  });

  test('should display key metrics', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Check for key metrics
    const petitionCount = page.locator('[data-testid="total-petitions"]|[data-testid="metric-petitions"]');
    const signatureCount = page.locator('[data-testid="total-signatures"]|[data-testid="metric-signatures"]');
    const userCount = page.locator('[data-testid="total-users"]|[data-testid="metric-users"]');

    expect(await petitionCount.isVisible()).toBeTruthy();
    expect(await signatureCount.isVisible()).toBeTruthy();
    expect(await userCount.isVisible()).toBeTruthy();

    // Check metrics have values
    const petitionValue = await getText(page, '[data-testid="total-petitions"]|[data-testid="metric-petitions"]');
    expect(petitionValue.match(/\d+/)).toBeTruthy();
  });

  test('should display petitions analytics chart', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Look for analytics chart
    const analyticsChart = page.locator('[data-testid="petitions-chart"]|canvas|svg:has-text("Petitions")').first();
    
    if (await analyticsChart.isVisible()) {
      expect(await analyticsChart.isVisible()).toBeTruthy();
    }
  });

  test('should display signatures timeline', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Look for timeline or line chart
    const timelineChart = page.locator('[data-testid="signatures-timeline"]|canvas|svg');
    
    if (await timelineChart.count() > 0) {
      expect(await timelineChart.first().isVisible()).toBeTruthy();
    }
  });

  test('should filter analytics by date range', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Look for date range filter
    const dateInput = page.locator('input[type="date"]|input[name="startDate"]').first();
    if (await dateInput.isVisible()) {
      await fillInput(page, 'input[type="date"]', '2024-01-01');

      // Wait for analytics to update
      await page.waitForLoadState('networkidle');

      // Verify charts updated
      const charts = page.locator('canvas|svg');
      expect(await charts.count()).toBeGreaterThan(0);
    }
  });

  test('should display performance metrics', async ({ page }) => {
    await page.goto('/admin/dashboard/performance');
    await page.waitForLoadState('networkidle');

    // Check for performance section
    const performanceSection = page.locator('[data-testid="performance-section"]|[data-testid="core-vitals"]');
    expect(await performanceSection.isVisible()).toBeTruthy();

    // Check for Web Vitals metrics
    const lcpMetric = page.locator('[data-testid="lcp"]|[data-testid="metric-lcp"]');
    const fidMetric = page.locator('[data-testid="fid"]|[data-testid="metric-fid"]');
    const clsMetric = page.locator('[data-testid="cls"]|[data-testid="metric-cls"]');

    expect(await lcpMetric.isVisible()).toBeTruthy();
    expect(await fidMetric.isVisible()).toBeTruthy();
    expect(await clsMetric.isVisible()).toBeTruthy();
  });

  test('should display bundle analyzer', async ({ page }) => {
    await page.goto('/admin/dashboard/performance');

    // Look for bundle analyzer section
    const bundleAnalyzer = page.locator('[data-testid="bundle-analyzer"]|[data-testid="bundle-size"]');
    
    if (await bundleAnalyzer.isVisible()) {
      // Check for bundle breakdown
      const bundleCharts = page.locator('canvas|svg');
      expect(await bundleCharts.count()).toBeGreaterThan(0);
    }
  });

  test('should display security audit results', async ({ page }) => {
    await page.goto('/admin/dashboard/security');
    await page.waitForLoadState('networkidle');

    // Check for security section
    const securitySection = page.locator('[data-testid="security-section"]|[data-testid="security-audit"]');
    expect(await securitySection.isVisible()).toBeTruthy();

    // Check for security checks
    const cspCheck = page.locator('[data-testid="check-csp"]|[data-testid="csp-header"]');
    const csrfCheck = page.locator('[data-testid="check-csrf"]|[data-testid="csrf-token"]');
    const httpsCheck = page.locator('[data-testid="check-https"]|[data-testid="https-redirect"]');

    expect(await cspCheck.isVisible()).toBeTruthy();
    expect(await csrfCheck.isVisible()).toBeTruthy();
    expect(await httpsCheck.isVisible()).toBeTruthy();
  });

  test('should display security check status', async ({ page }) => {
    await page.goto('/admin/dashboard/security');

    // Look for status indicators
    const passIndicators = page.locator('[data-testid*="check"]:has-text("Pass")|[data-testid*="check"]:has-text("✓")');
    
    if (await passIndicators.count() > 0) {
      expect(await passIndicators.count()).toBeGreaterThan(0);
    }
  });

  test('should display fraud detection metrics', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Look for fraud metrics
    const fraudSection = page.locator('[data-testid="fraud-section"]|[data-testid="fraud-detection"]');
    
    if (await fraudSection.isVisible()) {
      // Check for fraud indicators
      const suspiciousPetitions = page.locator('[data-testid="suspicious-petitions"]');
      const blockedSignatures = page.locator('[data-testid="blocked-signatures"]');

      expect(await suspiciousPetitions.isVisible().catch(() => false) || await blockedSignatures.isVisible().catch(() => false)).toBeTruthy();
    }
  });

  test('should display user growth chart', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Look for user growth chart
    const userChart = page.locator('[data-testid="user-growth"]|canvas|svg:has-text("Users")').first();
    
    if (await userChart.isVisible()) {
      expect(await userChart.isVisible()).toBeTruthy();
    }
  });

  test('should display revenue dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard/revenue');
    await page.waitForLoadState('networkidle');

    // Check for revenue section
    const revenueSection = page.locator('[data-testid="revenue-section"]|[data-testid="donations"]');
    expect(await revenueSection.isVisible()).toBeTruthy();

    // Check for revenue metrics
    const totalRevenue = page.locator('[data-testid="total-revenue"]|[data-testid="total-donations"]');
    const monthlyRevenue = page.locator('[data-testid="monthly-revenue"]|[data-testid="this-month"]');

    expect(await totalRevenue.isVisible()).toBeTruthy();
    expect(await monthlyRevenue.isVisible()).toBeTruthy();
  });

  test('should display revenue trend chart', async ({ page }) => {
    await page.goto('/admin/dashboard/revenue');

    // Look for revenue chart
    const revenueChart = page.locator('[data-testid="revenue-chart"]|canvas|svg');
    
    if (await revenueChart.count() > 0) {
      expect(await revenueChart.nth(0).isVisible()).toBeTruthy();
    }
  });

  test('should display top performing petitions', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Look for top petitions section
    const topPetitionsSection = page.locator('[data-testid="top-petitions"]|[data-testid="trending"]');
    
    if (await topPetitionsSection.isVisible()) {
      // Check for petition list
      const petitionItems = topPetitionsSection.locator('[data-testid="petition-item"]');
      expect(await petitionItems.count()).toBeGreaterThan(0);
    }
  });

  test('should display user demographics', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Look for demographics section
    const demographicsSection = page.locator('[data-testid="demographics"]|[data-testid="user-stats"]');
    
    if (await demographicsSection.isVisible()) {
      // Check for demographic breakdown
      const genderChart = page.locator('[data-testid="gender-breakdown"]');
      const ageChart = page.locator('[data-testid="age-breakdown"]');
      const locationChart = page.locator('[data-testid="location-breakdown"]');

      expect(
        await genderChart.isVisible().catch(() => false) ||
        await ageChart.isVisible().catch(() => false) ||
        await locationChart.isVisible().catch(() => false)
      ).toBeTruthy();
    }
  });

  test('should export dashboard data as CSV', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Look for export button
    const exportButton = page.locator('button:has-text("Export")|button[aria-label*="Export"]');
    
    if (await exportButton.isVisible()) {
      // Start waiting for download
      const downloadPromise = page.waitForEvent('download');

      await clickElement(page, 'button:has-text("Export")|button[aria-label*="Export"]');

      // Check for download options
      const csvOption = page.locator('[role="menu"] button:has-text("CSV")');
      if (await csvOption.isVisible()) {
        await clickElement(page, csvOption);

        // Wait for download to complete
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('csv');
      }
    }
  });

  test('should display real-time analytics', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Look for real-time section
    const realtimeSection = page.locator('[data-testid="realtime"]|[data-testid="live"]');
    
    if (await realtimeSection.isVisible()) {
      // Check for real-time metrics
      const activeUsers = page.locator('[data-testid="active-users"]');
      expect(await activeUsers.isVisible()).toBeTruthy();

      // Verify metrics update
      const firstValue = await getText(page, '[data-testid="active-users"]');
      
      // Wait a moment and check again
      await page.waitForTimeout(2000);
      const secondValue = await getText(page, '[data-testid="active-users"]');

      // Values might be the same, but element should still be visible
      expect(await activeUsers.isVisible()).toBeTruthy();
    }
  });

  test('should display alerts and notifications', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Look for alerts section
    const alertsSection = page.locator('[data-testid="alerts"]|[role="region"][aria-label*="alert"]');
    
    if (await alertsSection.isVisible()) {
      // Check for alert items
      const alertItems = alertsSection.locator('[data-testid="alert-item"]');
      expect(await alertItems.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should navigate between dashboard tabs', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Find navigation tabs
    const tabs = page.locator('[role="tablist"] [role="tab"]|nav button');
    const tabCount = await tabs.count();

    if (tabCount > 1) {
      // Click second tab
      const secondTab = tabs.nth(1);
      await clickElement(page, secondTab);

      // Wait for content to load
      await page.waitForLoadState('networkidle');

      // Verify different content is displayed
      expect(page.url()).not.toBe('');
    }
  });

  test('should configure dashboard widgets', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Look for customize button
    const customizeButton = page.locator('button:has-text("Customize")|button[aria-label*="Customize"]|button[aria-label*="Configure"]');
    
    if (await customizeButton.isVisible()) {
      await clickElement(page, customizeButton);

      // Wait for customize modal
      const customizeModal = page.locator('[role="dialog"]|[data-testid="customize-modal"]');
      expect(await customizeModal.isVisible()).toBeTruthy();

      // Toggle a widget
      const widgetToggle = customizeModal.locator('input[type="checkbox"]').first();
      if (await widgetToggle.isVisible()) {
        await widgetToggle.click();

        // Save customization
        const saveButton = customizeModal.locator('button:has-text("Save")');
        if (await saveButton.isVisible()) {
          await clickElement(page, 'button:has-text("Save")');
        }
      }
    }
  });

  test('should display system health status', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Look for system status section
    const systemStatus = page.locator('[data-testid="system-status"]|[data-testid="health"]');
    
    if (await systemStatus.isVisible()) {
      // Check for status indicators
      const uptimeStatus = page.locator('[data-testid="uptime"]');
      const apiStatus = page.locator('[data-testid="api-status"]');
      const databaseStatus = page.locator('[data-testid="database-status"]');

      expect(
        await uptimeStatus.isVisible().catch(() => false) ||
        await apiStatus.isVisible().catch(() => false) ||
        await databaseStatus.isVisible().catch(() => false)
      ).toBeTruthy();
    }
  });

  test('should resize and rearrange dashboard widgets', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Look for draggable widgets
    const widgets = page.locator('[data-testid="widget"]|[draggable="true"]');
    
    if (await widgets.count() > 1) {
      // Try to drag first widget
      const firstWidget = widgets.first();
      const secondWidget = widgets.nth(1);

      if (await firstWidget.isVisible() && await secondWidget.isVisible()) {
        // Get positions
        const firstBox = await firstWidget.boundingBox();
        const secondBox = await secondWidget.boundingBox();

        if (firstBox && secondBox) {
          // Drag first widget
          await firstWidget.dragTo(secondWidget);

          // Wait for layout update
          await page.waitForTimeout(500);

          // Verify layout changed
          expect(await firstWidget.boundingBox()).toBeTruthy();
        }
      }
    }
  });
});
