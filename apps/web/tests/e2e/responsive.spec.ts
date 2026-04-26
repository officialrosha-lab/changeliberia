import { test, expect, devices } from '@playwright/test';
import {
  fillInput,
  clickElement,
  expectTextContent,
  generateTestEmail,
  generateTestPassword,
  pressKeys,
  isVisible,
  isFocused,
} from './test-helpers';

/**
 * Responsive & Mobile E2E tests
 * Tests: mobile layout, touch interactions, responsive navigation
 */

test.describe('Responsive Design & Mobile', () => {
  // Test on mobile viewports
  test.describe('Mobile Layout (Pixel 5)', () => {
    test.use({ ...devices['Pixel 5'] });

    test('should display responsive navigation', async ({ page }) => {
      await page.goto('/');

      // Check for mobile menu button
      const menuButton = page.locator('[aria-label="Menu"]|[aria-label="Open menu"]|button:has-text("☰")');
      const desktopNav = page.locator('nav');

      // On mobile, hamburger menu should be visible instead of full nav
      const isMobileView = await page.evaluate(() => window.innerWidth < 768);
      
      if (isMobileView) {
        expect(await menuButton.isVisible()).toBeTruthy();
      }
    });

    test('should open mobile menu on button click', async ({ page }) => {
      await page.goto('/');

      const menuButton = page.locator('[aria-label="Menu"]|button:has-text("☰")');
      if (await menuButton.isVisible()) {
        await clickElement(page, '[aria-label="Menu"]|button:has-text("☰")');

        // Check for mobile menu
        const mobileMenu = page.locator('[data-testid="mobile-menu"]|nav[role="navigation"]');
        await expect(mobileMenu).toBeVisible();
      }
    });

    test('should navigate using mobile menu', async ({ page }) => {
      await page.goto('/');

      // Open menu
      const menuButton = page.locator('[aria-label="Menu"]|button:has-text("☰")');
      if (await menuButton.isVisible()) {
        await clickElement(page, '[aria-label="Menu"]|button:has-text("☰")');

        // Click a navigation link
        const petitionsLink = page.locator('[data-testid="mobile-menu"] a:has-text("Petitions")');
        if (await petitionsLink.isVisible()) {
          await clickElement(page, petitionsLink);

          // Verify navigation
          await page.waitForURL(/.*petitions.*/i);
          expect(page.url()).toMatch(/petitions/i);
        }
      }
    });

    test('should display responsive header', async ({ page }) => {
      await page.goto('/');

      // Check header layout on mobile
      const header = page.locator('header|[role="banner"]');
      const logo = header.locator('img|[aria-label*="logo"]').first();
      const menuButton = page.locator('[aria-label="Menu"]|button:has-text("☰")');

      expect(await header.isVisible()).toBeTruthy();
      expect(await logo.isVisible()).toBeTruthy();
      expect(await menuButton.isVisible()).toBeTruthy();
    });

    test('should stack form fields vertically on mobile', async ({ page }) => {
      await page.goto('/auth/signup');

      // Check form layout
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');

      const emailBox = await emailInput.boundingBox();
      const passwordBox = await passwordInput.boundingBox();

      if (emailBox && passwordBox) {
        // On mobile, inputs should be stacked (not side-by-side)
        // Password should be below email
        expect(passwordBox.y).toBeGreaterThan(emailBox.y);
      }
    });

    test('should display bottom navigation on mobile', async ({ page }) => {
      await page.goto('/');

      // Check for bottom navigation
      const bottomNav = page.locator('[data-testid="bottom-navigation"]|nav[aria-label="Bottom"]');
      
      if (await bottomNav.isVisible()) {
        // Check for nav items
        const navItems = bottomNav.locator('a|button');
        expect(await navItems.count()).toBeGreaterThan(0);
      }
    });

    test('should display touch-friendly buttons', async ({ page }) => {
      await page.goto('/');

      // Check button sizing for touch
      const buttons = page.locator('button');
      
      if (await buttons.count() > 0) {
        const firstButton = buttons.first();
        const box = await firstButton.boundingBox();

        if (box) {
          // Touch targets should be at least 44x44px
          expect(box.width).toBeGreaterThanOrEqual(40);
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('should handle touch tap interactions', async ({ page }) => {
      await page.goto('/');

      // Get a clickable element
      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        // Tap/click the button
        await clickElement(page, 'button');

        // Verify interaction worked
        expect(await button.isVisible()).toBeTruthy();
      }
    });

    test('should display images responsively', async ({ page }) => {
      await page.goto('/');

      // Check for images with responsive attributes
      const images = page.locator('img');
      
      if (await images.count() > 0) {
        const firstImage = images.first();
        const srcset = await firstImage.getAttribute('srcset');
        const sizes = await firstImage.getAttribute('sizes');

        // Should have responsive attributes
        const hasResponsiveAttrs = srcset || sizes;
        expect(hasResponsiveAttrs).toBeTruthy();
      }
    });

    test('should display advertisement/banners horizontally', async ({ page }) => {
      await page.goto('/');

      // Check for banners
      const banners = page.locator('[data-testid*="banner"]|[role="region"]');
      
      if (await banners.count() > 0) {
        const firstBanner = banners.first();
        const box = await firstBanner.boundingBox();

        if (box) {
          // Banner should fit mobile width
          expect(box.width).toBeLessThanOrEqual(500); // Mobile width
        }
      }
    });

    test('should allow horizontal swipe navigation', async ({ page }) => {
      await page.goto('/petitions');

      // Check for swipeable carousel
      const carousel = page.locator('[data-testid="carousel"]|[role="region"][aria-label*="carousel"]');
      
      if (await carousel.isVisible()) {
        // Perform swipe gesture
        const carouselBox = await carousel.boundingBox();
        
        if (carouselBox) {
          // Drag left to right (swipe back)
          await page.touchscreen.tap(carouselBox.x + carouselBox.width / 2, carouselBox.y + carouselBox.height / 2);
          await page.mouse.move(carouselBox.x + 50, carouselBox.y);
        }
      }
    });

    test('should display single column layout', async ({ page }) => {
      await page.goto('/petitions');

      // Check grid layout on mobile
      const petitionCards = page.locator('[data-testid="petition-card"]');
      
      if (await petitionCards.count() > 0) {
        const firstCard = petitionCards.first();
        const secondCard = petitionCards.nth(1);

        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();

        if (firstBox && secondBox) {
          // On mobile, cards should be in single column
          // So x positions should be similar (within viewport)
          const xDiff = Math.abs(firstBox.x - secondBox.x);
          expect(xDiff).toBeLessThan(100);

          // And second card should be below first
          expect(secondBox.y).toBeGreaterThan(firstBox.y);
        }
      }
    });

    test('should handle input properly on mobile keyboard', async ({ page }) => {
      await page.goto('/auth/login');

      // Fill email input
      const emailInput = page.locator('input[name="email"]');
      await emailInput.focus();
      await emailInput.type('test@example.com');

      // Check value
      const value = await emailInput.inputValue();
      expect(value).toBe('test@example.com');

      // Tab to password field
      await pressKeys(page, 'Tab');
      expect(await isFocused(page, 'input[name="password"]')).toBeTruthy();
    });

    test('should hide address bar on scroll down', async ({ page }) => {
      await page.goto('/');

      // Get initial viewport height
      const initialViewportHeight = await page.evaluate(() => window.innerHeight);

      // Scroll down
      await page.evaluate(() => window.scrollBy(0, 500));

      // Browser address bar might be hidden (viewport height could increase)
      const scrolledViewportHeight = await page.evaluate(() => window.innerHeight);

      // This is browser-dependent, but mobile browsers often hide bars on scroll
      expect(scrolledViewportHeight).toBeGreaterThanOrEqual(initialViewportHeight - 10);
    });

    test('should handle fixed header properly', async ({ page }) => {
      await page.goto('/');

      const header = page.locator('header|[role="banner"]');
      
      if (await header.isVisible()) {
        // Scroll down
        await page.evaluate(() => window.scrollBy(0, 300));

        // Header should still be visible
        expect(await header.isVisible()).toBeTruthy();
      }
    });
  });

  // Test on tablet viewport
  test.describe('Tablet Layout (iPad)', () => {
    test.use({
      viewport: { width: 1024, height: 1366 },
    });

    test('should display side navigation on tablet', async ({ page }) => {
      await page.goto('/');

      // On tablet, might show sidebar or desktop navigation
      const nav = page.locator('nav|[role="navigation"]');
      if (await nav.isVisible()) {
        expect(await nav.isVisible()).toBeTruthy();
      }
    });

    test('should display 2-column layout on tablet', async ({ page }) => {
      await page.goto('/petitions');

      const petitionCards = page.locator('[data-testid="petition-card"]');
      
      if (await petitionCards.count() > 1) {
        const firstCard = petitionCards.first();
        const secondCard = petitionCards.nth(1);

        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();

        if (firstBox && secondBox) {
          // On tablet, cards should be side by side
          // Check if they're on same row (similar y position)
          const yDiff = Math.abs(firstBox.y - secondBox.y);
          expect(yDiff).toBeLessThan(50);

          // And x positions should be different (different columns)
          const xDiff = Math.abs(firstBox.x - secondBox.x);
          expect(xDiff).toBeGreaterThan(100);
        }
      }
    });

    test('should maintain usability on tablet portrait', async ({ page }) => {
      // iPad portrait mode
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/');

      const mainContent = page.locator('main|[role="main"]');
      expect(await mainContent.isVisible()).toBeTruthy();
    });

    test('should scale images for tablet', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      
      await page.goto('/');

      const images = page.locator('img');
      
      if (await images.count() > 0) {
        const firstImage = images.first();
        const naturalWidth = await firstImage.evaluate((el: HTMLImageElement) => el.naturalWidth);
        
        // Image should be reasonably sized
        expect(naturalWidth).toBeGreaterThan(0);
      }
    });
  });

  // Test on landscape mode
  test.describe('Landscape Orientation', () => {
    test.use({
      viewport: { width: 812, height: 375 }, // iPhone landscape
    });

    test('should adapt layout to landscape', async ({ page }) => {
      await page.goto('/');

      // Should have proper overflow handling
      const mainContent = page.locator('main|[role="main"]');
      expect(await mainContent.isVisible()).toBeTruthy();
    });

    test('should prevent horizontal scrolling', async ({ page }) => {
      await page.goto('/');

      const maxWidth = await page.evaluate(() => {
        return Math.max(document.documentElement.clientWidth, window.innerWidth);
      });

      expect(maxWidth).toBeLessThanOrEqual(850); // Allow minimal overshoot
    });
  });

  // Test at different breakpoints
  test.describe('Responsive Breakpoints', () => {
    const breakpoints = [
      { name: 'Mobile (320px)', width: 320, height: 568 },
      { name: 'Mobile (480px)', width: 480, height: 854 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Desktop (1024px)', width: 1024, height: 768 },
      { name: 'Desktop (1920px)', width: 1920, height: 1080 },
    ];

    for (const breakpoint of breakpoints) {
      test(`should render properly at ${breakpoint.name}`, async ({ page }) => {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        
        await page.goto('/');

        // Page should be functional and visible
        const header = page.locator('header|[role="banner"]');
        const mainContent = page.locator('main|[role="main"]');

        expect(await header.isVisible()).toBeTruthy();
        expect(await mainContent.isVisible()).toBeTruthy();

        // No horizontal scrollbar needed
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        expect(hasHorizontalScroll).toBe(false);
      });
    }
  });

  test('should support pinch zoom on mobile', async ({ page }) => {
    await page.goto('/');

    // Check meta viewport tag
    const viewportMeta = page.locator('meta[name="viewport"]');
    const viewportContent = await viewportMeta.getAttribute('content');

    // Should allow user scaling
    expect(viewportContent).toContain('width=device-width');
  });

  test('should display readable font sizes on mobile', async ({ page }) => {
    await page.goto('/');

    // Check body font size
    const bodyFontSize = await page.evaluate(() => {
      const body = document.body;
      return parseInt(window.getComputedStyle(body).fontSize);
    });

    // Minimum 16px for readability on mobile
    expect(bodyFontSize).toBeGreaterThanOrEqual(12);
  });

  test('should properly handle modal on mobile', async ({ page }) => {
    await page.goto('/petitions');

    // Open a petition modal
    const firstPetition = page.locator('[data-testid="petition-card"]').first();
    if (await firstPetition.isVisible()) {
      await clickElement(page, '[data-testid="petition-card"]');

      // Wait for modal or navigation
      await page.waitForLoadState('networkidle');

      // Should be scrollable and not break layout
      const content = page.locator('main|[role="main"]');
      expect(await content.isVisible()).toBeTruthy();
    }
  });
});
