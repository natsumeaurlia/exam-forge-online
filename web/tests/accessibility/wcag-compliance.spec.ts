import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('♿ WCAG Accessibility Compliance', () => {
  const criticalPages = [
    { path: '/ja', name: 'Landing Page' },
    { path: '/ja/auth/signin', name: 'Sign In' },
    { path: '/ja/auth/signup', name: 'Sign Up' },
    { path: '/ja/dashboard', name: 'Dashboard' },
    { path: '/ja/dashboard/quizzes', name: 'Quiz Management' },
    { path: '/ja/quiz/create', name: 'Quiz Creator' },
    { path: '/ja/plans', name: 'Pricing Plans' },
    { path: '/ja/help', name: 'Help Page' },
  ];

  criticalPages.forEach(({ path, name }) => {
    test(`${name} - WCAG 2.1 AA Compliance`, async ({ page }) => {
      await page.goto(path);

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      // Run axe accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .exclude('#__next') // Exclude Next.js wrapper if it causes false positives
        .analyze();

      // Report violations
      expect(accessibilityScanResults.violations).toEqual([]);

      // Additional manual checks for critical accessibility features

      // Check for skip links
      const skipLinks = page.locator('a[href^="#"], [data-testid="skip-link"]');
      if ((await skipLinks.count()) > 0) {
        expect(await skipLinks.first().isVisible()).toBeTruthy();
      }

      // Check heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      let lastLevel = 0;

      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        const currentLevel = parseInt(tagName[1]);

        if (lastLevel > 0) {
          // Heading levels should not skip (e.g., h1 -> h3)
          expect(currentLevel - lastLevel).toBeLessThanOrEqual(1);
        }
        lastLevel = currentLevel;
      }

      // Check for alt text on images
      const images = await page.locator('img').all();
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const isDecorative = await img.getAttribute('aria-hidden');
        const role = await img.getAttribute('role');

        // Images should have alt text unless they're decorative
        if (isDecorative !== 'true' && role !== 'presentation') {
          expect(alt).not.toBeNull();
          expect(alt).not.toBe('');
        }
      }
    });

    test(`${name} - Keyboard Navigation`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Start keyboard navigation from the beginning
      await page.keyboard.press('Tab');

      // Get all focusable elements
      const focusableElements = await page
        .locator(
          'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
        )
        .all();

      let focusedElementIndex = 0;

      // Test tab navigation through first 10 elements (to avoid infinite loops)
      for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();

        // Check focus indicator is visible
        const focusedElementBox = await focusedElement.boundingBox();
        expect(focusedElementBox).not.toBeNull();

        await page.keyboard.press('Tab');
        focusedElementIndex++;
      }

      // Test reverse tab navigation
      await page.keyboard.press('Shift+Tab');
      const reverseFocusedElement = page.locator(':focus');
      await expect(reverseFocusedElement).toBeVisible();
    });

    test(`${name} - Screen Reader Compatibility`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Check for proper ARIA labels and roles
      const interactiveElements = await page
        .locator('button, a, input, select, textarea')
        .all();

      for (const element of interactiveElements.slice(0, 20)) {
        // Test first 20 elements
        const ariaLabel = await element.getAttribute('aria-label');
        const ariaLabelledby = await element.getAttribute('aria-labelledby');
        const textContent = await element.textContent();
        const placeholder = await element.getAttribute('placeholder');
        const title = await element.getAttribute('title');

        // Interactive elements should have accessible names
        const hasAccessibleName =
          ariaLabel ||
          ariaLabelledby ||
          textContent?.trim() ||
          placeholder ||
          title;
        expect(hasAccessibleName).toBeTruthy();
      }

      // Check for proper form labels
      const inputs = await page.locator('input, textarea, select').all();
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');

        // Inputs should have labels
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = (await label.count()) > 0;
          const hasAriaLabel = ariaLabel || ariaLabelledby;

          expect(hasLabel || hasAriaLabel).toBeTruthy();
        }
      }
    });

    test(`${name} - Color Contrast and Visual Indicators`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Check that focus indicators are visible
      const buttons = await page.locator('button').all();

      for (const button of buttons.slice(0, 5)) {
        // Test first 5 buttons
        await button.focus();

        // Check that focused element has visible focus indicator
        const focusedStyles = await button.evaluate(el => {
          const styles = window.getComputedStyle(el, ':focus');
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            outlineStyle: styles.outlineStyle,
            outlineColor: styles.outlineColor,
            boxShadow: styles.boxShadow,
          };
        });

        // Should have some form of focus indicator
        const hasFocusIndicator =
          focusedStyles.outline !== 'none' ||
          focusedStyles.outlineWidth !== '0px' ||
          focusedStyles.boxShadow !== 'none';

        expect(hasFocusIndicator).toBeTruthy();
      }
    });
  });

  test('Form Accessibility Comprehensive Test', async ({ page }) => {
    await page.goto('/ja/auth/signup');

    // Test form structure
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Test required field indicators
    const requiredFields = await page
      .locator('input[required], input[aria-required="true"]')
      .all();
    for (const field of requiredFields) {
      const fieldId = await field.getAttribute('id');
      const label = page.locator(`label[for="${fieldId}"]`);

      if ((await label.count()) > 0) {
        const labelText = await label.textContent();
        // Check for required indicator (* or text)
        expect(labelText).toMatch(/\*|必須|required/i);
      }
    }

    // Test error message associations
    await page.click('button[type="submit"]'); // Trigger validation

    const errorMessages = await page
      .locator('[role="alert"], .error, .text-red-500')
      .all();
    for (const error of errorMessages) {
      const ariaLive = await error.getAttribute('aria-live');
      const role = await error.getAttribute('role');

      // Error messages should be announced to screen readers
      expect(
        ariaLive === 'polite' || ariaLive === 'assertive' || role === 'alert'
      ).toBeTruthy();
    }
  });

  test('Mobile Accessibility', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/ja/dashboard');

    // Test touch target sizes (minimum 44px)
    const buttons = await page.locator('button, a').all();

    for (const button of buttons.slice(0, 10)) {
      const box = await button.boundingBox();
      if (box) {
        // WCAG recommendation: touch targets should be at least 44x44px
        expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
      }
    }

    // Test mobile menu accessibility if present
    const mobileMenuToggle = page.locator(
      '[aria-label*="menu"], [data-testid="mobile-menu"]'
    );
    if ((await mobileMenuToggle.count()) > 0) {
      const ariaExpanded = await mobileMenuToggle.getAttribute('aria-expanded');
      expect(ariaExpanded).toBeDefined();

      await mobileMenuToggle.click();

      const expandedState =
        await mobileMenuToggle.getAttribute('aria-expanded');
      expect(expandedState).toBe('true');
    }
  });

  test('Dynamic Content Accessibility', async ({ page }) => {
    await page.goto('/ja/dashboard/quizzes');

    // Test loading states
    const loadingElements = page.locator(
      '[aria-busy="true"], .loading, .spinner'
    );
    if ((await loadingElements.count()) > 0) {
      const firstLoader = loadingElements.first();
      const ariaLabel = await firstLoader.getAttribute('aria-label');
      const srText = await firstLoader.locator('.sr-only').textContent();

      // Loading indicators should have screen reader text
      expect(ariaLabel || srText).toBeTruthy();
    }

    // Test modal accessibility
    const modalTrigger = page.locator(
      'button:has-text("新規作成"), [data-testid*="create"]'
    );
    if ((await modalTrigger.count()) > 0) {
      await modalTrigger.first().click();

      const modal = page.locator('[role="dialog"], .modal');
      if ((await modal.count()) > 0) {
        // Modal should trap focus
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        const modalBox = await modal.boundingBox();
        const focusedBox = await focusedElement.boundingBox();

        // Focused element should be within modal bounds
        if (modalBox && focusedBox) {
          expect(focusedBox.x).toBeGreaterThanOrEqual(modalBox.x);
          expect(focusedBox.y).toBeGreaterThanOrEqual(modalBox.y);
        }

        // Test Escape key to close modal
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
    }
  });

  test('Live Region Updates', async ({ page }) => {
    await page.goto('/ja/quiz/create');

    // Test that status updates are announced
    const form = page.locator('form');
    if ((await form.count()) > 0) {
      // Look for live regions
      const liveRegions = page.locator(
        '[aria-live], [role="status"], [role="alert"]'
      );

      if ((await liveRegions.count()) > 0) {
        // Trigger an action that might update live regions
        await page.fill('input[name="title"]', 'Test Quiz');

        // Check that live regions have appropriate aria-live values
        for (const region of await liveRegions.all()) {
          const ariaLive = await region.getAttribute('aria-live');
          const role = await region.getAttribute('role');

          if (ariaLive) {
            expect(['polite', 'assertive', 'off']).toContain(ariaLive);
          }

          if (role) {
            expect(['status', 'alert']).toContain(role);
          }
        }
      }
    }
  });
});
