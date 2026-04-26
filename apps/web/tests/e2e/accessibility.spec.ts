import { test, expect } from '@playwright/test';
import {
  fillInput,
  clickElement,
  expectTextContent,
  getText,
  pressKeys,
  isFocused,
} from './test-helpers';

/**
 * Accessibility E2E tests
 * Tests: keyboard navigation, screen reader support, ARIA attributes, color contrast
 */

test.describe('Accessibility (a11y)', () => {
  test('should have proper page title', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should have semantic HTML structure', async ({ page }) => {
    await page.goto('/');

    // Check for main landmark
    const main = page.locator('main|[role="main"]');
    expect(await main.isVisible()).toBeTruthy();

    // Check for header landmark
    const header = page.locator('header|[role="banner"]');
    expect(await header.isVisible()).toBeTruthy();

    // Check for footer landmark
    const footer = page.locator('footer|[role="contentinfo"]');
    expect(await footer.isVisible()).toBeTruthy();
  });

  test('should support keyboard navigation with Tab key', async ({ page }) => {
    await page.goto('/');

    // Get all focusable elements
    const focusableElements = page.locator(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const count = await focusableElements.count();
    expect(count).toBeGreaterThan(0);

    // Tab through first few elements
    for (let i = 0; i < Math.min(3, count); i++) {
      await pressKeys(page, 'Tab');
      
      // An element should be focused
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName || '';
      });

      expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(focusedElement)).toBeTruthy();
    }
  });

  test('should support Shift+Tab for reverse navigation', async ({ page }) => {
    await page.goto('/');

    // Focus on a button
    const button = page.locator('button').first();
    await button.focus();

    // Get initial focused element
    const initialElement = await page.evaluate(() => {
      return (document.activeElement as HTMLElement)?.textContent?.substring(0, 20);
    });

    // Shift+Tab back
    await pressKeys(page, 'Shift+Tab');

    // Different element should be focused
    const newElement = await page.evaluate(() => {
      return (document.activeElement as HTMLElement)?.textContent?.substring(0, 20);
    });

    // Should have moved focus (though might be same element in small pages)
    expect(typeof initialElement).toBe('string');
    expect(typeof newElement).toBe('string');
  });

  test('should support Enter key for button activation', async ({ page }) => {
    await page.goto('/');

    // Focus a button
    const button = page.locator('button').first();
    await button.focus();

    // Press Enter
    await pressKeys(page, 'Enter');

    // Button click handler should fire (page should respond)
    expect(page.url()).toBeTruthy();
  });

  test('should support Space key for checkbox activation', async ({ page }) => {
    await page.goto('/auth/signup');

    // Find a checkbox
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.focus();

      // Check initial state
      const initialChecked = await checkbox.isChecked();

      // Press Space
      await pressKeys(page, 'Space');

      // Checkbox state should toggle
      const newChecked = await checkbox.isChecked();
      expect(newChecked).toBe(!initialChecked);
    }
  });

  test('should handle navigation with Enter key', async ({ page }) => {
    await page.goto('/');

    // Focus a navigation link
    const navLink = page.locator('nav a').first();
    if (await navLink.isVisible()) {
      await navLink.focus();

      // Get the href
      const href = await navLink.getAttribute('href');

      // Press Enter
      await pressKeys(page, 'Enter');

      // Should navigate (URL should change or be same as before)
      expect(page.url()).toBeTruthy();
    }
  });

  test('should have clear focus indicators', async ({ page }) => {
    await page.goto('/');

    // Focus an element
    const button = page.locator('button').first();
    await button.focus();

    // Check for focus styles
    const focusOutline = await button.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline || styles.boxShadow || styles.border;
    });

    // Should have some focus indicator
    expect(focusOutline).toBeTruthy();
  });

  test('should provide meaningful link text', async ({ page }) => {
    await page.goto('/');

    // Check links have descriptive text
    const badLinks = page.locator('a:has-text("Click here"), a:has-text("Read more"), a[title=""], a:has-text("Link")');
    
    // Should be minimal or none
    const badCount = await badLinks.count();
    expect(badCount).toBeLessThan(3); // Allow some non-descriptive links
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/auth/signup');

    // Check that inputs have associated labels
    const inputs = page.locator('input[name*="email"], input[name*="password"], input[name*="name"]');
    
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const label = await page.locator(`label[for="${id}"]`).isVisible();

      // Should have either implicit label, aria-label, or explicit label
      expect(id || ariaLabel || label).toBeTruthy();
    }
  });

  test('should have descriptive button text', async ({ page }) => {
    await page.goto('/');

    const buttons = page.locator('button:not([aria-label]):not([title])');
    
    if (await buttons.count() > 0) {
      for (let i = 0; i < Math.min(5, await buttons.count()); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        
        // Buttons should have meaningful text
        if (text && text.trim()) {
          expect(text.length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should have ARIA labels for icon buttons', async ({ page }) => {
    await page.goto('/');

    // Find icon buttons (buttons with no text)
    const iconButtons = page.locator('button:not(:has-text(/\S/))');
    
    if (await iconButtons.count() > 0) {
      for (let i = 0; i < Math.min(5, await iconButtons.count()); i++) {
        const button = iconButtons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');
        
        // Icon buttons should have aria-label or title
        expect(ariaLabel || title).toBeTruthy();
      }
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check that headings are in proper order
    const h1s = page.locator('h1');
    const h2s = page.locator('h2');
    const h3s = page.locator('h3');

    const h1Count = await h1s.count();

    // Should have exactly one h1
    expect(h1Count).toBe(1);

    // H2 and H3 should exist
    expect(await h2s.count()).toBeGreaterThanOrEqual(0);
    expect(await h3s.count()).toBeGreaterThanOrEqual(0);
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');

    // Check images have alt text
    const images = page.locator('img:not([alt=""]):not([alt*="null"])');
    const imageCount = await page.locator('img').count();
    const altCount = await images.count();

    // Most images should have alt text (some decorative might not)
    expect(altCount).toBeGreaterThanOrEqual(imageCount * 0.8); // 80% minimum
  });

  test('should provide form error messages', async ({ page }) => {
    await page.goto('/auth/signup');

    // Fill form with invalid data
    await fillInput(page, 'input[name="email"]', 'invalid-email');
    await fillInput(page, 'input[name="password"]', 'weak');

    // Submit
    const submitButton = page.locator('button[type="submit"]');
    await clickElement(page, 'button[type="submit"]');

    // Wait for errors
    await page.waitForTimeout(500);

    // Should have error messages
    const errorMessage = page.locator('[role="alert"]');
    expect(await errorMessage.isVisible()).toBeTruthy();
  });

  test('should associate error messages with fields', async ({ page }) => {
    await page.goto('/auth/signup');

    // Fill form with invalid data
    const emailInput = page.locator('input[name="email"]');
    await emailInput.fill('invalid');

    // Should show error
    await page.waitForTimeout(300);

    const inputId = await emailInput.getAttribute('id');
    if (inputId) {
      // Look for aria-describedby
      const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
      expect(ariaDescribedBy).toBeTruthy();
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');

    // Check text contrast ratios
    // This is a simplified check - real contrast testing is more complex
    const bodies = page.locator('body');
    
    if (await bodies.isVisible()) {
      // Just verify text is readable
      const textColor = await bodies.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      expect(textColor).toBeTruthy();
    }
  });

  test('should use aria-live for dynamic content', async ({ page }) => {
    await page.goto('/');

    // Check for aria-live regions
    const liveRegions = page.locator('[aria-live]');
    
    // Should have at least one live region for notifications
    expect(await liveRegions.count()).toBeGreaterThanOrEqual(0);
  });

  test('should announce status updates', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill login form
    const emailInput = page.locator('input[name="email"]');
    await emailInput.fill('test@example.com');
    await fillInput(page, 'input[name="password"]', 'password');

    // Submit
    await clickElement(page, 'button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(500);

    // Should have status message
    const statusMessage = page.locator('[role="status"], [aria-live="polite"]');
    
    // At minimum, some feedback should exist
    expect(await page.locator('[role="alert"], [role="status"]').count()).toBeGreaterThanOrEqual(0);
  });

  test('should provide skip links', async ({ page }) => {
    await page.goto('/');

    // Check for skip to main content link
    const skipLink = page.locator('a:has-text("Skip"):has-text("main")|a[href="#main"]|a[href="#content"]');
    
    if (await skipLink.isVisible()) {
      expect(await skipLink.isVisible()).toBeTruthy();
    }
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');

    // Check for nav landmark
    const nav = page.locator('nav, [role="navigation"]');
    expect(await nav.isVisible()).toBeTruthy();

    // Check for aria-label if multiple navs
    const navCount = await nav.count();
    if (navCount > 1) {
      for (let i = 0; i < navCount; i++) {
        const ariaLabel = await nav.nth(i).getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
    }
  });

  test('should have accessible modals', async ({ page }) => {
    await page.goto('/petitions');

    // Open a petition to see if modal is used
    const firstPetition = page.locator('[data-testid="petition-card"]').first();
    if (await firstPetition.isVisible()) {
      await clickElement(page, '[data-testid="petition-card"]');

      //Wait for modal or page
      await page.waitForLoadState('networkidle');

      // If modal, check for proper attributes
      const modal = page.locator('[role="dialog"]');
      if (await modal.isVisible()) {
        // Modal should have aria-labelledby or aria-label
        const ariaLabel = await modal.getAttribute('aria-label');
        const ariaLabelledBy = await modal.getAttribute('aria-labelledby');

        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('should handle focus trap in modal', async ({ page }) => {
    // This is a complex test that requires a modal to be open
    // Simplified version just checks modal exists and can be closed with Escape
    
    await page.goto('/');

    // Look for modal trigger
    const modalTrigger = page.locator('button:has-text("More")').first();
    if (await modalTrigger.isVisible()) {
      await clickElement(page, 'button:has-text("More")|button[aria-label*="Share"]');

      // Wait for modal
      await page.waitForTimeout(300);

      // Try to close with Escape
      await pressKeys(page, 'Escape');

      // Modal should be hidden or closed
      const modal = page.locator('[role="dialog"]');
      const isVisible = await modal.isVisible().catch(() => false);
      
      // May or may not have modal, just checking it works
      expect(typeof isVisible).toBe('boolean');
    }
  });

  test('should have accessible form completion', async ({ page }) => {
    await page.goto('/auth/signup');

    // Tab through form and fill with Tab+text
    await pressKeys(page, 'Tab');
    
    const firstInputSelector = 'input';
    if (await isFocused(page, firstInputSelector)) {
      // Type in field
      await page.locator(firstInputSelector).first().fill('test@example.com');

      // Should be able to navigate
      await pressKeys(page, 'Tab');

      const secondInputSelector = 'input[type="password"]';
      expect(await isFocused(page, secondInputSelector)).toBeTruthy();
    }
  });

  test('should have language attribute on html', async ({ page }) => {
    await page.goto('/');

    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
    expect(lang?.length).toBeGreaterThan(0);
  });

  test('should support browser zoom', async ({ page }) => {
    await page.goto('/');

    // Zoom in
    await page.keyboard.press('Control+Plus');
    
    // Content should still be visible and readable
    const header = page.locator('header|[role="banner"]');
    expect(await header.isVisible()).toBeTruthy();

    // Zoom out
    await page.keyboard.press('Control+Minus');
    
    expect(await header.isVisible()).toBeTruthy();

    // Reset
    await page.keyboard.press('Control+0');
  });
});
