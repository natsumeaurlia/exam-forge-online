import { test, expect } from '@playwright/test';

test.describe('🌐 Multilingual Support (i18n)', () => {
  const testRoutes = [
    '/dashboard',
    '/dashboard/quizzes',
    '/dashboard/analytics',
    '/dashboard/team',
    '/dashboard/settings',
    '/plans',
    '/help',
    '/auth/signin',
    '/auth/signup',
  ];

  const languages = [
    { code: 'ja', name: '日本語' },
    { code: 'en', name: 'English' },
  ];

  languages.forEach(({ code, name }) => {
    test.describe(`${name} (${code})`, () => {
      testRoutes.forEach(route => {
        test(`${route} - ${name}翻訳検証`, async ({ page }) => {
          await page.goto(`/${code}${route}`);

          // Verify page loads without translation errors
          await expect(page.locator('body')).toBeVisible();

          // Check for untranslated keys (should not contain translation key patterns)
          const bodyText = await page.textContent('body');
          expect(bodyText).not.toMatch(/\{\{[^}]+\}\}/); // No {{key}} patterns
          expect(bodyText).not.toMatch(/\[missing:/); // No [missing: keys
          expect(bodyText).not.toMatch(/^[a-zA-Z]+\.[a-zA-Z.]+$/); // No raw keys like "common.submit"

          // Language-specific content validation
          if (code === 'ja') {
            // Japanese should contain hiragana/katakana/kanji
            expect(bodyText).toMatch(/[あ-んア-ンー一-龯]/);
          } else if (code === 'en') {
            // English should not contain Japanese characters in main content
            const mainContent = await page
              .locator('main, .main-content, [role="main"]')
              .textContent();
            if (mainContent) {
              expect(mainContent).not.toMatch(/[あ-んア-ンー一-龯]/);
            }
          }
        });
      });

      test(`言語切り替え機能 - ${name}`, async ({ page }) => {
        await page.goto(`/${code}/dashboard`);

        // Find language switcher
        const languageSwitcher = page
          .locator('[data-testid="language-switcher"]')
          .or(
            page
              .locator('button:has-text("言語")')
              .or(page.locator('button:has-text("Language")'))
          );

        if (await languageSwitcher.isVisible()) {
          await languageSwitcher.click();

          // Switch to other language
          const otherLang = code === 'ja' ? 'en' : 'ja';
          const otherLangButton = page.locator(
            `button:has-text("${otherLang === 'ja' ? '日本語' : 'English'}")`
          );

          if (await otherLangButton.isVisible()) {
            await otherLangButton.click();

            // Verify URL changed
            await expect(page).toHaveURL(new RegExp(`/${otherLang}/dashboard`));

            // Verify content changed language
            const newBodyText = await page.textContent('body');
            if (otherLang === 'ja') {
              expect(newBodyText).toMatch(/[あ-んア-ンー一-龯]/);
            }
          }
        }
      });
    });
  });

  test('Date/Number/Currency Localization', async ({ page }) => {
    // Test Japanese locale
    await page.goto('/ja/dashboard/analytics');

    // Look for date formats (should be Japanese format)
    const dateElements = page.locator('[data-testid*="date"], .date, time');
    const count = await dateElements.count();

    if (count > 0) {
      const dateText = await dateElements.first().textContent();
      // Japanese dates often use 年月日 or YYYY/MM/DD format
      expect(dateText).toMatch(/\d{4}[年\/]\d{1,2}[月\/]\d{1,2}[日]?/);
    }

    // Test English locale
    await page.goto('/en/dashboard/analytics');

    if (count > 0) {
      const englishDateText = await dateElements.first().textContent();
      // English dates typically use MM/DD/YYYY or DD/MM/YYYY
      expect(englishDateText).toMatch(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/);
    }
  });

  test('Form Validation Messages i18n', async ({ page }) => {
    // Test Japanese form validation
    await page.goto('/ja/auth/signup');

    // Submit empty form to trigger validation
    await page.click('button[type="submit"]');

    // Check for Japanese error messages
    const errorMessage = page
      .locator('.error, [role="alert"], .text-red-500')
      .first();
    if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent();
      expect(errorText).toMatch(/[あ-んア-ンー一-龯]/); // Should contain Japanese characters
    }

    // Test English form validation
    await page.goto('/en/auth/signup');
    await page.click('button[type="submit"]');

    const englishErrorMessage = page
      .locator('.error, [role="alert"], .text-red-500')
      .first();
    if (await englishErrorMessage.isVisible()) {
      const englishErrorText = await englishErrorMessage.textContent();
      expect(englishErrorText).not.toMatch(/[あ-んア-ンー一-龯]/); // Should not contain Japanese
      expect(englishErrorText).toMatch(/required|invalid|error/i); // Should contain English error terms
    }
  });

  test('RTL/LTR Layout Consistency', async ({ page }) => {
    // Both Japanese and English are LTR, but test for consistent layout
    await page.goto('/ja/dashboard');
    const jaLayout = await page.locator('main').evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        textAlign: styles.textAlign,
        direction: styles.direction,
        marginLeft: styles.marginLeft,
        marginRight: styles.marginRight,
      };
    });

    await page.goto('/en/dashboard');
    const enLayout = await page.locator('main').evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        textAlign: styles.textAlign,
        direction: styles.direction,
        marginLeft: styles.marginLeft,
        marginRight: styles.marginRight,
      };
    });

    // Both should be LTR
    expect(jaLayout.direction).toBe('ltr');
    expect(enLayout.direction).toBe('ltr');
  });

  test('URL Route i18n', async ({ page }) => {
    // Test that routes are properly internationalized
    const routeTests = [
      { ja: '/ja/help', en: '/en/help' },
      { ja: '/ja/plans', en: '/en/plans' },
      { ja: '/ja/auth/signin', en: '/en/auth/signin' },
    ];

    for (const routes of routeTests) {
      // Access Japanese route
      await page.goto(routes.ja);
      await expect(page).toHaveURL(routes.ja);

      // Access English route
      await page.goto(routes.en);
      await expect(page).toHaveURL(routes.en);

      // Verify both routes serve different content
      await page.goto(routes.ja);
      const jaContent = await page.textContent('body');

      await page.goto(routes.en);
      const enContent = await page.textContent('body');

      // Content should be different (different languages)
      expect(jaContent).not.toBe(enContent);
    }
  });

  test('Missing Translation Keys Detection', async ({ page }) => {
    const criticalPages = ['/dashboard', '/quiz/create', '/plans', '/help'];

    for (const route of criticalPages) {
      for (const lang of ['ja', 'en']) {
        await page.goto(`/${lang}${route}`);

        // Check console for translation errors
        const consoleLogs: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error' || msg.type() === 'warn') {
            consoleLogs.push(msg.text());
          }
        });

        await page.waitForLoadState('networkidle');

        // Check for translation-related errors
        const translationErrors = consoleLogs.filter(
          log =>
            log.includes('missing') ||
            log.includes('translation') ||
            log.includes('i18n') ||
            log.includes('locale')
        );

        expect(translationErrors.length).toBe(0);

        // Visual check for obvious missing translations
        const bodyText = await page.textContent('body');
        expect(bodyText).not.toContain('[missing:');
        expect(bodyText).not.toContain('{{');
        expect(bodyText).not.toMatch(/^[a-z]+\.[a-z.]+$/m); // Raw translation keys
      }
    }
  });

  test('Pluralization Rules', async ({ page }) => {
    // Test pluralization in both languages
    await page.goto('/ja/dashboard/quizzes');

    // Look for count-based text that might use pluralization
    const countElements = page.locator(
      '[data-testid*="count"], .count, .total'
    );
    const count = await countElements.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const element = countElements.nth(i);
        const text = await element.textContent();

        // Japanese doesn't have plural forms like English, but should be consistent
        if (text && text.match(/\d+/)) {
          expect(text).not.toContain('undefined');
          expect(text).not.toContain('null');
        }
      }
    }

    // Test English pluralization
    await page.goto('/en/dashboard/quizzes');

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const element = countElements.nth(i);
        const text = await element.textContent();

        if (text && text.match(/\d+/)) {
          // Basic English pluralization checks
          if (text.includes('1 ')) {
            expect(text).not.toMatch(/1 \w+s\b/); // "1 items" should be "1 item"
          }
          expect(text).not.toContain('undefined');
          expect(text).not.toContain('null');
        }
      }
    }
  });
});
