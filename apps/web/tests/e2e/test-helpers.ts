/**
 * E2E Test Helper Utilities
 * Reusable functions for common test operations
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * Wait for and click an element
 * Supports both CSS selectors and Playwright selectors (:has-text, etc)
 */
export async function clickElement(page: Page, selector: string | Locator, timeout = 5000) {
  if (typeof selector === 'string') {
    const locator = page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    await locator.click();
  } else {
    await selector.click({ timeout });
  }
}

/**
 * Wait for and fill an input field
 */
export async function fillInput(page: Page, selector: string, value: string, timeout = 5000) {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'visible', timeout });
  await locator.fill(value);
}

/**
 * Wait for and get text content
 */
export async function getText(page: Page, selector: string, timeout = 5000): Promise<string> {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'visible', timeout });
  const text = await locator.textContent();
  return text || '';
}

/**
 * Fill form with multiple fields
 */
export async function fillForm(
  page: Page,
  fields: Record<string, string>,
  timeout = 5000
) {
  for (const [selector, value] of Object.entries(fields)) {
    await fillInput(page, selector, value, timeout);
  }
}

/**
 * Wait for and check element visibility
 */
export async function isVisible(page: Page, selector: string, timeout = 5000): Promise<boolean> {
  try {
    const locator = page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    return await locator.isVisible();
  } catch {
    return false;
  }
}

/**
 * Wait for navigation (useful after form submissions)
 */
export async function waitForNavigation(page: Page, action: () => Promise<void>, timeout = 30000) {
  await Promise.all([page.waitForNavigation({ timeout }), action()]);
}

/**
 * Check if element contains specific text (string or RegExp)
 */
export async function expectTextContent(
  page: Page,
  selector: string,
  expectedText: string | RegExp,
  timeout = 5000
) {
  const element = page.locator(selector);
  if (typeof expectedText === 'string') {
    await expect(element).toContainText(expectedText, { timeout });
  } else {
    await expect(element).toContainText(expectedText, { timeout });
  }
}

/**
 * Wait for API response
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  action: () => Promise<void>,
  timeout = 30000
) {
  const responsePromise = page.waitForResponse(
    (response) => {
      if (typeof urlPattern === 'string') {
        return response.url().includes(urlPattern);
      }
      return urlPattern.test(response.url());
    },
    { timeout }
  );

  await action();
  return responsePromise;
}

/**
 * Upload file to input
 */
export async function uploadFile(page: Page, selector: string, filePath: string) {
  const input = await page.$(selector);
  if (!input) throw new Error(`Element "${selector}" not found`);
  await input.setInputFiles(filePath);
}

/**
 * Clear and fill input (useful for clearing placeholders)
 */
export async function clearAndFill(page: Page, selector: string, value: string) {
  await page.locator(selector).clear();
  await page.locator(selector).fill(value);
}

/**
 * Get table data as structured array
 */
export async function getTableData(page: Page, tableSelector: string) {
  const rows = await page.locator(`${tableSelector} tbody tr`).count();
  const data = [];

  for (let i = 0; i < rows; i++) {
    const cells = await page
      .locator(`${tableSelector} tbody tr:nth-child(${i + 1}) td`)
      .allTextContents();
    data.push(cells);
  }

  return data;
}

/**
 * Intercept and mock API endpoint
 */
export async function mockAPIEndpoint(
  page: Page,
  urlPattern: string | RegExp,
  responseData: any
) {
  await page.route(urlPattern, (route) => {
    route.abort('blockedbyclient');
    route.continue();
  });

  // For mocking, use resourceType instead
  await page.route('**/*', (route) => {
    if (typeof urlPattern === 'string') {
      if (route.request().url().includes(urlPattern)) {
        route.abort('blockedbyclient');
      } else {
        route.continue();
      }
    } else if (urlPattern.test(route.request().url())) {
      route.abort('blockedbyclient');
    } else {
      route.continue();
    }
  });
}

/**
 * Handle browser dialogs
 */
export async function handleDialog(page: Page, callback: () => Promise<void>) {
  let dismissed = false;

  page.on('dialog', async (dialog) => {
    console.log(`Dialog [${dialog.type()}]: ${dialog.message()}`);
    await dialog.accept();
    dismissed = true;
  });

  await callback();
  return dismissed;
}

/**
 * Check console errors
 */
export async function getConsoleErrors(page: Page, action: () => Promise<void>): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await action();
  return errors;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Check for network errors
 */
export async function checkNetworkErrors(page: Page, action: () => Promise<void>): Promise<Array<{ url: string; status: number }>> {
  const failedRequests: Array<{ url: string; status: number }> = [];

  page.on('response', (response) => {
    if (!response.ok()) {
      failedRequests.push({
        url: response.url(),
        status: response.status(),
      });
    }
  });

  await action();
  return failedRequests;
}

/**
 * Validate form errors
 */
export async function validateFormErrors(
  page: Page,
  expectedErrors: Record<string, string>
): Promise<boolean> {
  for (const [fieldSelector, errorMessage] of Object.entries(expectedErrors)) {
    const errorElement = page.locator(`${fieldSelector} + .error-message`);
    await expect(errorElement).toContainText(errorMessage);
  }
  return true;
}

/**
 * Wait for element to be removed from DOM
 */
export async function waitForElementRemoval(page: Page, selector: string, timeout = 10000) {
  await page.waitForSelector(selector, { state: 'hidden', timeout });
}

/**
 * Press keyboard keys
 */
export async function pressKeys(page: Page, keys: string | string[]) {
  const keyArray = Array.isArray(keys) ? keys : [keys];
  for (const key of keyArray) {
    await page.keyboard.press(key);
  }
}

/**
 * Check if an element is focused
 */
export async function isFocused(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((sel: string) => {
    const element = document.querySelector(sel);
    return document.activeElement === element;
  }, selector);
}

/**
 * Generate test data
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `test-${timestamp}-${random}@example.com`;
}

export function generateTestPassword(): string {
  // Must have: 8+ chars, uppercase, lowercase, number
  const random = Math.random().toString(36).substring(2, 8);
  return `TestPass${Math.floor(Math.random() * 1000)}`;
}

/**
 * Assert HTTP status
 */
export async function assertHTTPStatus(
  page: Page,
  urlPattern: string | RegExp,
  expectedStatus: number,
  action: () => Promise<void>
) {
  const response = await waitForAPIResponse(page, urlPattern, action);
  expect(response.status()).toBe(expectedStatus);
}
