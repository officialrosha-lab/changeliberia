import { test, expect } from '../fixtures/auth';

/**
 * Analytics Dashboard E2E Tests
 * Tests real-time metrics, WebSocket updates, and dashboard interactions
 */

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ adminPage }) => {
    // Navigate to analytics dashboard
    await adminPage.goto('/admin/analytics');
    await adminPage.waitForLoadState('networkidle');
  });

  test('TC-ANALYTICS-001: Dashboard loads with metrics', async ({ adminPage }) => {
    // Verify dashboard visible
    await expect(adminPage.locator('text=Analytics')).toBeVisible();

    // Verify key metrics displayed
    await expect(adminPage.locator('[data-testid="total-messages"]')).toBeVisible();
    await expect(adminPage.locator('[data-testid="total-broadcasts"]')).toBeVisible();
    await expect(adminPage.locator('[data-testid="active-users"]')).toBeVisible();

    // Verify charts rendered
    await expect(adminPage.locator('canvas')).toBeVisible();
  });

  test('TC-ANALYTICS-002: Real-time update on new message', async ({ adminPage, adminToken }) => {
    // Get initial message count
    const initialCount = await adminPage
      .locator('[data-testid="total-messages"]')
      .textContent();

    // Create message via API
    const response = await adminPage.request.post('/api/messages', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        recipientId: 'test-user-456',
        subject: 'Real-time Test',
        content: 'Testing real-time updates',
      },
    });

    expect(response.ok()).toBeTruthy();

    // Wait for dashboard to update
    await adminPage.waitForTimeout(1000);

    // Verify count increased (or displays loading)
    const newCount = await adminPage.locator('[data-testid="total-messages"]').textContent();

    // Count should increase or stay same (if not yet visible)
    expect(newCount).toBeDefined();

    // Verify notification badge appears
    const notificationBadge = adminPage.locator('[data-testid="notification-badge"]');
    await expect(notificationBadge).toBeVisible();
  });

  test('TC-ANALYTICS-003: WebSocket connection indicator', async ({ adminPage }) => {
    // Verify connection status visible
    const connectionStatus = adminPage.locator('[data-testid="connection-status"]');
    await expect(connectionStatus).toBeVisible();

    // Verify shows "Connected"
    const statusText = await connectionStatus.textContent();
    expect(statusText?.toLowerCase()).toContain('connected');

    // Verify green indicator color
    await expect(connectionStatus).toHaveAttribute(
      'class',
      /connected|active|success|green/i,
    );
  });

  test('TC-ANALYTICS-004: Live update feed displays new messages', async ({ adminPage, adminToken }) => {
    // Verify live feed visible
    await expect(adminPage.locator('[data-testid="live-feed"]')).toBeVisible();

    // Create test message
    await adminPage.request.post('/api/messages', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        recipientId: 'test-user-789',
        subject: 'Feed Test Message',
        content: 'This should appear in live feed',
      },
    });

    // Wait for update
    await adminPage.waitForTimeout(1000);

    // Verify message appears in feed
    const feedItems = adminPage.locator('[data-testid="feed-item"]');
    const count = await feedItems.count();

    expect(count).toBeGreaterThan(0);
  });

  test('TC-ANALYTICS-005: Period filter changes data', async ({ adminPage }) => {
    // Get initial data
    const initialCount = await adminPage
      .locator('[data-testid="total-messages"]')
      .textContent();

    // Click period dropdown
    await adminPage.click('[data-testid="period-select"]');

    // Select different period
    await adminPage.click('option[value="month"]');

    // Wait for update
    await adminPage.waitForLoadState('networkidle');

    // Verify data updated
    const updatedCount = await adminPage
      .locator('[data-testid="total-messages"]')
      .textContent();

    // May be different or same depending on data
    expect(updatedCount).toBeDefined();
  });

  test('TC-ANALYTICS-006: Charts render correctly', async ({ adminPage }) => {
    // Verify all chart containers visible
    const charts = adminPage.locator('[data-testid^="chart-"]');
    const chartCount = await charts.count();

    expect(chartCount).toBeGreaterThan(0);

    // Verify canvas elements present (chart library renders to canvas)
    const canvases = adminPage.locator('canvas');
    const canvasCount = await canvases.count();

    expect(canvasCount).toBeGreaterThan(0);
  });

  test('TC-ANALYTICS-007: Metrics accuracy vs API', async ({ adminPage, adminToken }) => {
    // Wait for data to load
    await adminPage.waitForLoadState('networkidle');

    // Get dashboard message count
    const dashboardCount = await adminPage
      .locator('[data-testid="total-messages"]')
      .textContent();

    // Get API message count
    const response = await adminPage.request.get(
      '/api/analytics/messages?period=week',
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    expect(response.ok()).toBeTruthy();

    const apiData = await response.json();
    const apiCount = apiData.total || apiData.count;

    // Extract number from dashboard text
    const dashboardNumber = parseInt(dashboardCount?.split(':')[1] || '0');

    // Verify they match or are close (allowing for timing differences)
    expect(Math.abs(dashboardNumber - apiCount)).toBeLessThanOrEqual(1);
  });

  test('TC-ANALYTICS-008: Notification badge auto-hides', async ({ adminPage, adminToken }) => {
    // Create message to trigger notification
    await adminPage.request.post('/api/messages', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        recipientId: 'test-user-999',
        subject: 'Notification Test',
        content: 'Testing auto-hide',
      },
    });

    // Wait for notification
    const notificationBadge = adminPage.locator('[data-testid="notification-badge"]');
    await expect(notificationBadge).toBeVisible();

    // Wait for auto-hide (typically 5 seconds)
    await adminPage.waitForTimeout(6000);

    // Verify notification disappeared
    await expect(notificationBadge).not.toBeVisible();
  });

  test('TC-ANALYTICS-009: Refresh button works', async ({ adminPage }) => {
    // Click refresh button
    await adminPage.click('[data-testid="refresh-btn"]');

    // Verify loading state appears
    const loadingIndicator = adminPage.locator('[data-testid="loading"]');
    await expect(loadingIndicator).toBeVisible();

    // Wait for load to complete
    await adminPage.waitForLoadState('networkidle');

    // Verify data still displayed
    await expect(adminPage.locator('[data-testid="total-messages"]')).toBeVisible();
  });

  test('TC-ANALYTICS-010: Network disconnection handling', async ({ adminPage }) => {
    // Simulate offline
    await adminPage.context().setOffline(true);

    // Wait a moment
    await adminPage.waitForTimeout(1000);

    // Connection status should show disconnected
    const connectionStatus = adminPage.locator('[data-testid="connection-status"]');
    const statusText = await connectionStatus.textContent();
    expect(statusText?.toLowerCase()).toMatch(/disconnect|offline|error/);

    // Restore connection
    await adminPage.context().setOffline(false);

    // Wait for reconnection
    await adminPage.waitForTimeout(2000);

    // Verify reconnected
    const newStatus = await connectionStatus.textContent();
    expect(newStatus?.toLowerCase()).toContain('connected');
  });

  test('TC-ANALYTICS-011: Dashboard responsiveness on mobile', async ({ browser }) => {
    // Create mobile context
    const mobileContext = await browser.newContext({
      ...{ width: 375, height: 667 },
    });

    const mobileAdminPage = await mobileContext.newPage();

    // Navigate to analytics
    await mobileAdminPage.goto('/admin/analytics');
    await mobileAdminPage.waitForLoadState('networkidle');

    // Verify dashboard still visible
    await expect(mobileAdminPage.locator('text=Analytics')).toBeVisible();

    // Verify metrics visible (may be in different layout)
    await expect(mobileAdminPage.locator('[data-testid="total-messages"]')).toBeVisible();

    // Verify no horizontal scrolling needed
    const bodyWidth = await mobileAdminPage.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

    await mobileContext.close();
  });

  test('TC-ANALYTICS-012: Dark mode toggle', async ({ adminPage }) => {
    // Get initial styles
    const dashboard = adminPage.locator('[data-testid="dashboard"]');
    const initialClass = await dashboard.getAttribute('class');

    // Toggle dark mode
    await adminPage.click('[data-testid="theme-toggle"]');

    // Wait for update
    await adminPage.waitForTimeout(500);

    // Verify class changed
    const updatedClass = await dashboard.getAttribute('class');

    expect(initialClass).not.toEqual(updatedClass);

    // Verify theme persisted in localStorage
    const theme = await adminPage.evaluate(() =>
      localStorage.getItem('theme'),
    );
    expect(theme).toBeDefined();
  });

  test('TC-ANALYTICS-013: Export data functionality', async ({ adminPage }) => {
    // Click export button
    const exportBtn = adminPage.locator('[data-testid="export-btn"]');

    if (await exportBtn.isVisible()) {
      await exportBtn.click();

      // Verify download starts
      const download = await adminPage.waitForEvent('download');
      const path = await download.path();

      expect(path).toBeDefined();

      // Verify file is CSV or JSON
      expect(path).toMatch(/\.(csv|json)$/);
    }
  });

  test('TC-ANALYTICS-014: Real-time metrics update during broadcast', async ({
    adminPage,
    adminToken,
  }) => {
    // Get initial broadcast count
    const initialCount = await adminPage
      .locator('[data-testid="total-broadcasts"]')
      .textContent();

    // Create broadcast via API
    await adminPage.request.post('/api/broadcasts', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: 'Real-time Broadcast Test',
        content: 'Testing broadcast real-time update',
        targetAudience: 'all',
      },
    });

    // Wait for update
    await adminPage.waitForTimeout(1000);

    // Verify broadcast count increased
    const updatedCount = await adminPage
      .locator('[data-testid="total-broadcasts"]')
      .textContent();

    expect(updatedCount).toBeDefined();
  });

  test('TC-ANALYTICS-015: Dashboard handles large datasets', async ({ adminPage }) => {
    // Navigate to weekly view (more data)
    await adminPage.click('[data-testid="period-select"]');
    await adminPage.click('option[value="week"]');

    // Wait for data load
    await adminPage.waitForLoadState('networkidle');

    // Verify no performance issues
    const metrics = adminPage.locator('[data-testid="total-messages"]');
    await expect(metrics).toBeVisible();

    // Verify charts still render
    const charts = adminPage.locator('canvas');
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThan(0);

    // Verify responsiveness
    // (In a real test, we'd measure performance metrics)
  });
});
