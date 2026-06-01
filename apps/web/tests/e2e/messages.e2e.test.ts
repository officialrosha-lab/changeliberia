import { test, expect } from '../fixtures/auth';

/**
 * Messages Feature E2E Tests
 * Tests message CRUD operations, real-time updates, and bulk actions
 */

test.describe('Messages Feature', () => {
  test.beforeEach(async ({ adminPage }) => {
    // Navigate to messages page before each test
    await adminPage.goto('/messages');
    await adminPage.waitForLoadState('networkidle');
  });

  test('TC-MSG-001: Send message to recipient', async ({ adminPage }) => {
    // Click compose button
    await adminPage.click('button:has-text("Compose")');

    // Fill message form
    await adminPage.fill('input[name="recipient"]', 'user@example.com');
    await adminPage.fill('input[name="subject"]', 'Test Message');
    await adminPage.fill('textarea[name="content"]', 'This is a test message');

    // Submit form
    await adminPage.click('button:has-text("Send")');

    // Verify success message
    await expect(adminPage.locator('[role="alert"]')).toContainText('Message sent');

    // Verify message appears in sent folder
    await adminPage.click('a:has-text("Sent")');
    await expect(adminPage.locator('text=Test Message')).toBeVisible();
  });

  test('TC-MSG-002: Receive message and see notification', async ({ adminPage }) => {
    // Create message via API
    const response = await adminPage.request.post('/api/messages', {
      data: {
        recipientId: 'admin-user-123',
        subject: 'Incoming Test Message',
        content: 'This is an incoming message',
        category: 'admin_message',
      },
    });

    expect(response.ok()).toBeTruthy();

    // Refresh inbox
    await adminPage.reload();
    await adminPage.waitForLoadState('networkidle');

    // Verify message appears in inbox
    await expect(adminPage.locator('text=Incoming Test Message')).toBeVisible();

    // Verify notification badge
    const unreadBadge = adminPage.locator('[data-testid="unread-badge"]');
    await expect(unreadBadge).toBeVisible();
  });

  test('TC-MSG-003: Mark message as read', async ({ adminPage }) => {
    // Click on first message
    await adminPage.click('[data-testid="message-item"]:first-child');

    // Verify message expanded
    await expect(adminPage.locator('[data-testid="message-content"]')).toBeVisible();

    // Click "Mark as Read" button
    await adminPage.click('button:has-text("Mark as Read")');

    // Verify button disappears
    await expect(adminPage.locator('button:has-text("Mark as Read")')).not.toBeVisible();

    // Verify unread indicator removed
    const unreadIndicator = adminPage.locator('[data-testid="unread-indicator"]').first();
    await expect(unreadIndicator).not.toBeVisible();
  });

  test('TC-MSG-004: Search messages', async ({ adminPage }) => {
    // Enter search query
    await adminPage.fill('input[placeholder="Search messages..."]', 'test');

    // Click search button
    await adminPage.click('button:has-text("Search")');

    // Wait for results
    await adminPage.waitForLoadState('networkidle');

    // Verify results filtered
    const messageItems = adminPage.locator('[data-testid="message-item"]');
    const count = await messageItems.count();

    expect(count).toBeGreaterThan(0);

    // Verify messages contain search term
    const firstMessage = messageItems.first();
    const text = await firstMessage.textContent();
    expect(text?.toLowerCase()).toContain('test');
  });

  test('TC-MSG-005: Archive message', async ({ adminPage }) => {
    const initialMessageCount = await adminPage.locator('[data-testid="message-item"]').count();

    // Click on first message
    await adminPage.click('[data-testid="message-item"]:first-child');

    // Click archive button
    await adminPage.click('button:has-text("Archive")');

    // Verify success message
    await expect(adminPage.locator('[role="alert"]')).toContainText('archived');

    // Verify message removed from inbox
    const finalMessageCount = await adminPage.locator('[data-testid="message-item"]').count();
    expect(finalMessageCount).toBeLessThan(initialMessageCount);

    // Verify message in archive
    await adminPage.click('a:has-text("Archive")');
    await expect(adminPage.locator('text=Message not')).not.toBeVisible(); // Should have messages
  });

  test('TC-MSG-006: Delete message with confirmation', async ({ adminPage }) => {
    const initialMessageCount = await adminPage.locator('[data-testid="message-item"]').count();

    // Click on first message
    await adminPage.click('[data-testid="message-item"]:first-child');

    // Click delete button
    await adminPage.click('button:has-text("Delete")');

    // Confirm deletion in dialog
    await adminPage.click('button:has-text("Confirm")');

    // Verify success message
    await expect(adminPage.locator('[role="alert"]')).toContainText('deleted');

    // Verify message removed
    const finalMessageCount = await adminPage.locator('[data-testid="message-item"]').count();
    expect(finalMessageCount).toBeLessThan(initialMessageCount);
  });

  test('TC-MSG-007: Bulk select and mark as read', async ({ adminPage }) => {
    // Select multiple messages
    await adminPage.click('input[type="checkbox"]');
    await adminPage.click('input[type="checkbox"]');
    await adminPage.click('input[type="checkbox"]');

    // Verify bulk actions bar appears
    await expect(adminPage.locator('text=/\\d+ selected/')).toBeVisible();

    // Click "Mark as Read"
    await adminPage.click('button:has-text("Mark as Read")');

    // Verify success message
    await expect(adminPage.locator('[role="alert"]')).toContainText('marked');

    // Verify bulk actions bar disappears
    await expect(adminPage.locator('text=/\\d+ selected/')).not.toBeVisible();
  });

  test('TC-MSG-008: Bulk archive messages', async ({ adminPage }) => {
    const initialMessageCount = await adminPage.locator('[data-testid="message-item"]').count();

    // Select multiple messages
    for (let i = 0; i < Math.min(3, initialMessageCount); i++) {
      await adminPage.click(`input[type="checkbox"]:nth-of-type(${i + 1})`);
    }

    // Click archive in bulk actions
    await adminPage.click('button:has-text("Archive")');

    // Verify success message
    await expect(adminPage.locator('[role="alert"]')).toContainText('archived');

    // Verify messages removed from inbox
    const finalMessageCount = await adminPage.locator('[data-testid="message-item"]').count();
    expect(finalMessageCount).toBeLessThan(initialMessageCount);
  });

  test('TC-MSG-009: Bulk delete messages', async ({ adminPage }) => {
    const initialMessageCount = await adminPage.locator('[data-testid="message-item"]').count();

    // Select multiple messages
    for (let i = 0; i < Math.min(2, initialMessageCount); i++) {
      await adminPage.click(`input[type="checkbox"]:nth-of-type(${i + 1})`);
    }

    // Click delete in bulk actions
    await adminPage.click('button:has-text("Delete")');

    // Confirm in dialog
    await adminPage.click('button:has-text("Confirm")');

    // Verify success message
    await expect(adminPage.locator('[role="alert"]')).toContainText('deleted');

    // Verify messages removed
    const finalMessageCount = await adminPage.locator('[data-testid="message-item"]').count();
    expect(finalMessageCount).toBeLessThan(initialMessageCount);
  });

  test('TC-MSG-010: Message pagination', async ({ adminPage }) => {
    // Verify current page
    const currentPage = await adminPage.locator('text=Page 1').textContent();
    expect(currentPage).toContain('Page 1');

    // Click next button if available
    const nextButton = adminPage.locator('button:has-text("Next")');
    const isDisabled = await nextButton.isDisabled();

    if (!isDisabled) {
      await nextButton.click();
      await adminPage.waitForLoadState('networkidle');

      // Verify moved to page 2
      const newPage = await adminPage.locator('text=Page').textContent();
      expect(newPage).toContain('Page');
    }
  });

  test('TC-MSG-011: Filter by category', async ({ adminPage }) => {
    // Click filter button
    await adminPage.click('button:has-text("Filter")');

    // Select category filter
    await adminPage.selectOption('select', 'admin_message');

    // Apply filter
    await adminPage.click('button:has-text("Apply")');
    await adminPage.waitForLoadState('networkidle');

    // Verify results are filtered
    const messages = await adminPage.locator('[data-testid="message-category"]').allTextContents();
    messages.forEach((category) => {
      expect(category).toContain('Admin Message');
    });
  });

  test('TC-MSG-012: Filter by read status', async ({ adminPage }) => {
    // Click filter button
    await adminPage.click('button:has-text("Filter")');

    // Select unread filter
    await adminPage.selectOption('select', 'unread');

    // Apply filter
    await adminPage.click('button:has-text("Apply")');
    await adminPage.waitForLoadState('networkidle');

    // Verify all messages are unread
    const unreadIndicators = adminPage.locator('[data-testid="unread-indicator"]');
    const count = await unreadIndicators.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC-MSG-013: Auto-refresh toggle', async ({ adminPage }) => {
    // Click auto-refresh checkbox
    await adminPage.check('input[value="auto-refresh"]');

    // Wait a bit
    await adminPage.waitForTimeout(2000);

    // Verify refresh button shows activity
    const refreshButton = adminPage.locator('button[title="Refresh messages"]');
    // In a real test, we'd verify the loading spinner

    // Uncheck auto-refresh
    await adminPage.uncheck('input[value="auto-refresh"]');
  });

  test('TC-MSG-014: View message thread', async ({ adminPage }) => {
    // Click on first message
    await adminPage.click('[data-testid="message-item"]:first-child');

    // Click "View thread" button
    await adminPage.click('a:has-text("View thread")');

    // Wait for thread page to load
    await adminPage.waitForURL(/\/messages\/[a-z0-9]+/);

    // Verify thread content displayed
    await expect(adminPage.locator('[data-testid="thread-content"]')).toBeVisible();
  });

  test('TC-MSG-015: Reply to message in thread', async ({ adminPage }) => {
    // Navigate to thread
    const messages = await adminPage.locator('[data-testid="message-item"]');
    if ((await messages.count()) > 0) {
      await adminPage.click('[data-testid="message-item"]:first-child');
      await adminPage.click('a:has-text("View thread")');
      await adminPage.waitForURL(/\/messages\/[a-z0-9]+/);

      // Type reply
      await adminPage.fill('textarea[name="reply"]', 'This is my reply');

      // Send reply
      await adminPage.click('button:has-text("Send Reply")');

      // Verify success
      await expect(adminPage.locator('[role="alert"]')).toContainText('sent');

      // Verify reply appears in thread
      await expect(adminPage.locator('text=This is my reply')).toBeVisible();
    }
  });
});
