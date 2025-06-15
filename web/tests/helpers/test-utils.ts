/**
 * Common test utilities for E2E tests
 * Provides reusable functions to improve test stability and reduce duplication
 */

import { Page, expect } from '@playwright/test';

/**
 * Wait for element to be visible with custom timeout
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options: {
    timeout?: number;
    state?: 'visible' | 'hidden' | 'attached' | 'detached';
  } = {}
) {
  const { timeout = 10000, state = 'visible' } = options;
  return page.waitForSelector(selector, { timeout, state });
}

/**
 * Wait for navigation with better error handling
 */
export async function waitForNavigation(
  page: Page,
  urlPattern: string | RegExp,
  options: { timeout?: number } = {}
) {
  const { timeout = 30000 } = options;
  try {
    await page.waitForURL(urlPattern, { timeout });
  } catch (error) {
    console.error(
      `Navigation timeout: Expected URL pattern ${urlPattern}, current URL: ${page.url()}`
    );
    throw error;
  }
}

/**
 * Fill form field with retry logic
 */
export async function fillField(
  page: Page,
  selector: string,
  value: string,
  options: { timeout?: number; retries?: number } = {}
) {
  const { timeout = 10000, retries = 3 } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await page.waitForSelector(selector, { timeout });
      await page.fill(selector, value);

      // Verify the value was set
      const actualValue = await page.inputValue(selector);
      if (actualValue === value) {
        return;
      }

      if (attempt === retries) {
        throw new Error(
          `Failed to fill field ${selector} with value "${value}" after ${retries} attempts`
        );
      }
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await page.waitForTimeout(1000); // Wait before retry
    }
  }
}

/**
 * Click element with retry logic
 */
export async function clickElement(
  page: Page,
  selector: string,
  options: { timeout?: number; retries?: number } = {}
) {
  const { timeout = 10000, retries = 3 } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await page.waitForSelector(selector, { timeout, state: 'visible' });
      await page.click(selector);
      return;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await page.waitForTimeout(1000); // Wait before retry
    }
  }
}

/**
 * Wait for toast notification and verify message
 */
export async function waitForToast(
  page: Page,
  expectedMessage?: string,
  options: { timeout?: number; type?: 'success' | 'error' | 'info' } = {}
) {
  const { timeout = 10000, type } = options;

  // Wait for toast container to appear
  const toastSelector = '[data-testid="toast"], .toast, [role="alert"]';
  await page.waitForSelector(toastSelector, { timeout });

  if (expectedMessage) {
    await expect(page.locator(toastSelector)).toContainText(expectedMessage, {
      timeout,
    });
  }

  if (type) {
    // Check for type-specific classes or attributes
    const typeSelectors = {
      success: '.toast-success, [data-type="success"]',
      error: '.toast-error, [data-type="error"]',
      info: '.toast-info, [data-type="info"]',
    };

    if (typeSelectors[type]) {
      await expect(page.locator(typeSelectors[type])).toBeVisible({ timeout });
    }
  }
}

/**
 * Wait for page load with better error handling
 */
export async function waitForPageLoad(
  page: Page,
  options: {
    timeout?: number;
    waitUntil?: 'load' | 'networkidle' | 'domcontentloaded';
  } = {}
) {
  const { timeout = 30000, waitUntil = 'networkidle' } = options;

  try {
    await page.waitForLoadState(waitUntil, { timeout });
  } catch (error) {
    console.error(`Page load timeout: Current URL: ${page.url()}`);
    throw error;
  }
}

/**
 * Take screenshot for debugging
 */
export async function takeDebugScreenshot(
  page: Page,
  name: string,
  options: { fullPage?: boolean } = {}
) {
  const { fullPage = true } = options;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `debug-${name}-${timestamp}.png`;

  try {
    await page.screenshot({
      path: `test-results/screenshots/${filename}`,
      fullPage,
    });
    console.log(`Debug screenshot saved: ${filename}`);
  } catch (error) {
    console.error(`Failed to take debug screenshot: ${error}`);
  }
}

/**
 * Wait for API response with specific status
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  options: { status?: number; timeout?: number } = {}
) {
  const { status = 200, timeout = 15000 } = options;

  return page.waitForResponse(
    response => {
      const matchesUrl =
        typeof urlPattern === 'string'
          ? response.url().includes(urlPattern)
          : urlPattern.test(response.url());

      return matchesUrl && response.status() === status;
    },
    { timeout }
  );
}

/**
 * Clear and fill input field
 */
export async function clearAndFill(
  page: Page,
  selector: string,
  value: string,
  options: { timeout?: number } = {}
) {
  const { timeout = 10000 } = options;

  await page.waitForSelector(selector, { timeout });
  await page.fill(selector, ''); // Clear first
  await page.fill(selector, value);

  // Verify the value was set correctly
  const actualValue = await page.inputValue(selector);
  expect(actualValue).toBe(value);
}

/**
 * Wait for element to contain specific text
 */
export async function waitForText(
  page: Page,
  selector: string,
  expectedText: string,
  options: { timeout?: number } = {}
) {
  const { timeout = 10000 } = options;

  await expect(page.locator(selector)).toContainText(expectedText, { timeout });
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(
  page: Page,
  selector: string,
  options: { timeout?: number } = {}
) {
  const { timeout = 10000 } = options;

  await page.waitForSelector(selector, { timeout });
  await page.locator(selector).scrollIntoViewIfNeeded();
}
