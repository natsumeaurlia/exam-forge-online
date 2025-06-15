import { test, expect } from '@playwright/test';

test.describe('📸 Visual Regression Testing', () => {
  const viewports = [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 },
  ];

  const criticalPages = [
    { path: '/ja', name: 'landing-page' },
    { path: '/ja/plans', name: 'pricing-page' },
    { path: '/ja/auth/signin', name: 'signin-page' },
    { path: '/ja/auth/signup', name: 'signup-page' },
    { path: '/ja/dashboard', name: 'dashboard' },
    { path: '/ja/dashboard/quizzes', name: 'quiz-management' },
    { path: '/ja/help', name: 'help-page' },
  ];

  // Test each page across different viewports
  viewports.forEach(({ name: viewportName, width, height }) => {
    test.describe(`${viewportName} viewport (${width}x${height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height });
      });

      criticalPages.forEach(({ path, name: pageName }) => {
        test(`${pageName} visual consistency`, async ({ page }) => {
          await page.goto(path);
          await page.waitForLoadState('networkidle');

          // Wait for any animations to complete
          await page.waitForTimeout(1000);

          // Hide dynamic content that changes between runs
          await page.addStyleTag({
            content: `
              .animate-spin,
              .animate-pulse,
              [data-testid*="timestamp"],
              .timestamp,
              .live-indicator {
                animation: none !important;
                opacity: 0 !important;
              }
            `,
          });

          // Take full page screenshot
          await expect(page).toHaveScreenshot(
            `${pageName}-${viewportName}-full.png`,
            {
              fullPage: true,
              threshold: 0.2,
              maxDiffPixels: 1000,
            }
          );
        });
      });
    });
  });

  test('Component Visual Testing', async ({ page }) => {
    await page.goto('/ja/dashboard/quizzes');
    await page.waitForLoadState('networkidle');

    // Test quiz card component
    const quizCard = page.locator('[data-testid="quiz-card"]').first();
    if ((await quizCard.count()) > 0) {
      await expect(quizCard).toHaveScreenshot('quiz-card-component.png', {
        threshold: 0.1,
      });
    }

    // Test navigation component
    const navigation = page.locator('nav, [role="navigation"]').first();
    await expect(navigation).toHaveScreenshot('navigation-component.png', {
      threshold: 0.1,
    });

    // Test button variants
    const buttons = page.locator('button').all();
    let buttonIndex = 0;

    for (const button of await buttons.slice(0, 5)) {
      // Test first 5 buttons
      const buttonClass = await button.getAttribute('class');
      if (buttonClass) {
        await expect(button).toHaveScreenshot(
          `button-${buttonIndex}-${viewports[0].name}.png`,
          {
            threshold: 0.05,
          }
        );
        buttonIndex++;
      }
    }
  });

  test('Form Visual States', async ({ page }) => {
    await page.goto('/ja/auth/signup');

    // Test empty form
    await expect(page.locator('form')).toHaveScreenshot(
      'signup-form-empty.png'
    );

    // Test filled form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');

    await expect(page.locator('form')).toHaveScreenshot(
      'signup-form-filled.png'
    );

    // Test validation errors
    await page.fill('input[name="email"]', 'invalid-email');
    await page.blur('input[name="email"]');
    await page.waitForTimeout(500); // Wait for validation

    await expect(page.locator('form')).toHaveScreenshot(
      'signup-form-validation-errors.png'
    );
  });

  test('Modal and Dialog Visual States', async ({ page }) => {
    await page.goto('/ja/dashboard/quizzes');

    // Open create quiz modal if exists
    const createButton = page.locator(
      'button:has-text("作成"), button:has-text("新規")'
    );
    if ((await createButton.count()) > 0) {
      await createButton.first().click();

      // Wait for modal animation
      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"], .modal');
      if ((await modal.count()) > 0) {
        await expect(modal).toHaveScreenshot('create-quiz-modal.png');

        // Test modal with content
        await page.fill('input[name="title"]', 'Test Quiz Title');
        await expect(modal).toHaveScreenshot('create-quiz-modal-filled.png');
      }
    }
  });

  test('Data Visualization Visual Testing', async ({ page }) => {
    await page.goto('/ja/dashboard/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for charts to render
    await page.waitForTimeout(2000);

    // Test chart components
    const charts = page.locator('[data-testid*="chart"], .chart, canvas, svg');
    const chartCount = await charts.count();

    for (let i = 0; i < Math.min(chartCount, 3); i++) {
      const chart = charts.nth(i);
      await expect(chart).toHaveScreenshot(`analytics-chart-${i}.png`, {
        threshold: 0.3, // Charts may have slight rendering differences
      });
    }
  });

  test('Dark Mode Visual Consistency', async ({ page }) => {
    // Enable dark mode if available
    await page.goto('/ja/dashboard');

    // Look for dark mode toggle
    const darkModeToggle = page.locator(
      '[data-testid="dark-mode"], [aria-label*="dark"], button:has-text("Dark")'
    );

    if ((await darkModeToggle.count()) > 0) {
      await darkModeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition

      // Test dashboard in dark mode
      await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
        fullPage: true,
        threshold: 0.2,
      });

      // Test other pages in dark mode
      await page.goto('/ja/dashboard/quizzes');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('quiz-management-dark-mode.png', {
        fullPage: true,
        threshold: 0.2,
      });
    }
  });

  test('Loading States Visual Testing', async ({ page }) => {
    // Intercept API calls to simulate loading states
    await page.route('**/api/**', async route => {
      // Delay API responses to capture loading states
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto('/ja/dashboard/analytics');

    // Capture loading state
    await expect(page).toHaveScreenshot('analytics-loading-state.png', {
      timeout: 1000, // Quick screenshot before data loads
    });

    // Wait for loading to complete
    await page.waitForLoadState('networkidle');

    // Capture loaded state
    await expect(page).toHaveScreenshot('analytics-loaded-state.png');
  });

  test('Responsive Breakpoint Visual Testing', async ({ page }) => {
    const breakpoints = [
      { width: 320, name: 'mobile-small' },
      { width: 375, name: 'mobile-medium' },
      { width: 414, name: 'mobile-large' },
      { width: 768, name: 'tablet' },
      { width: 1024, name: 'desktop-small' },
      { width: 1440, name: 'desktop-large' },
    ];

    for (const { width, name } of breakpoints) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/ja');
      await page.waitForLoadState('networkidle');

      // Test landing page at different breakpoints
      await expect(page).toHaveScreenshot(`landing-${name}-${width}px.png`, {
        fullPage: true,
        threshold: 0.2,
      });
    }
  });

  test('User Flow Visual Journey', async ({ page }) => {
    // Test complete user signup flow visually
    await page.goto('/ja/auth/signup');
    await expect(page).toHaveScreenshot('flow-01-signup-start.png');

    // Fill form
    await page.fill('input[name="name"]', 'Visual Test User');
    await page.fill('input[name="email"]', 'visual@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.check('input[name="terms"]');

    await expect(page).toHaveScreenshot('flow-02-signup-complete.png');

    // Note: We don't actually submit to avoid creating test users
    // In a real test, you would continue the flow

    // Test quiz creation flow
    await page.goto('/ja/dashboard/quizzes');
    await expect(page).toHaveScreenshot('flow-03-quiz-dashboard.png');
  });

  test('Error States Visual Testing', async ({ page }) => {
    // Test 404 page
    await page.goto('/ja/non-existent-page');
    await expect(page).toHaveScreenshot('error-404-page.png');

    // Test form validation errors
    await page.goto('/ja/auth/signin');
    await page.click('button[type="submit"]'); // Submit empty form
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('signin-validation-errors.png');

    // Test network error states
    await page.route('**/api/**', async route => {
      await route.fulfill({
        status: 500,
        body: 'Internal Server Error',
      });
    });

    await page.goto('/ja/dashboard');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('network-error-state.png');
  });

  test('Cross Browser Visual Consistency', async ({ page, browserName }) => {
    // This test will run on different browsers (Chrome, Firefox, Safari)
    await page.goto('/ja');
    await page.waitForLoadState('networkidle');

    // Browser-specific screenshot
    await expect(page).toHaveScreenshot(`landing-${browserName}.png`, {
      fullPage: true,
      threshold: 0.3, // Allow for browser rendering differences
    });

    // Test critical interactive elements
    await page.goto('/ja/dashboard/quizzes');
    await expect(page).toHaveScreenshot(`dashboard-${browserName}.png`, {
      threshold: 0.3,
    });
  });
});
