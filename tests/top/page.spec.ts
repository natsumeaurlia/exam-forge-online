import { test, expect } from '@playwright/test';

test.describe('ランディングページ', () => {
  test('基本的なページ表示テスト', async ({ page }) => {
    // ランディングページにアクセス
    await page.goto('/ja');

    // ページタイトルが正しく表示されているか確認
    await expect(page).toHaveTitle(/ExamForge/i);

    // ナビゲーションが表示されているか確認
    const navbar = page.locator('[data-testid="navbar"]');
    await expect(navbar).toBeVisible();

    // メインのヒーローセクションが表示されているか確認
    const hero = page.locator('[data-testid="hero-section"]');
    await expect(hero).toBeVisible();

    // フィーチャーセクションが表示されているか確認
    const features = page.locator('[data-testid="features-section"]');
    await expect(features).toBeVisible();

    // プライシングセクションが表示されているか確認
    const pricing = page.locator('[data-testid="pricing-section"]');
    await expect(pricing).toBeVisible();

    // CTAセクションが表示されているか確認
    const cta = page.locator('[data-testid="cta-section"]');
    await expect(cta).toBeVisible();

    // フッターが表示されているか確認
    const footer = page.locator('[data-testid="footer"]');
    await expect(footer).toBeVisible();

    // スクリーンショットを撮影
    await page.screenshot({
      path: 'tests/top/screenshot/landing-page.png',
      fullPage: true,
    });
  });

  test('ヒーローセクションの詳細テスト', async ({ page }) => {
    await page.goto('/ja');

    // ヒーローセクションの要素を確認
    const heroTagline = page.locator('[data-testid="hero-tagline"]');
    await expect(heroTagline).toBeVisible();

    const heroTitle = page.locator('[data-testid="hero-title"]');
    await expect(heroTitle).toBeVisible();

    const heroDescription = page.locator('[data-testid="hero-description"]');
    await expect(heroDescription).toBeVisible();

    const heroCtaButtons = page.locator('[data-testid="hero-cta-buttons"]');
    await expect(heroCtaButtons).toBeVisible();

    const heroStartButton = page.locator('[data-testid="hero-start-button"]');
    await expect(heroStartButton).toBeVisible();

    const heroDemoButton = page.locator('[data-testid="hero-demo-button"]');
    await expect(heroDemoButton).toBeVisible();

    const heroBenefits = page.locator('[data-testid="hero-benefits"]');
    await expect(heroBenefits).toBeVisible();

    const heroQuizExample = page.locator('[data-testid="hero-quiz-example"]');
    await expect(heroQuizExample).toBeVisible();
  });

  test('フィーチャーセクションの詳細テスト', async ({ page }) => {
    await page.goto('/ja');

    // フィーチャーセクションの要素を確認
    const featuresHeader = page.locator('[data-testid="features-header"]');
    await expect(featuresHeader).toBeVisible();

    const featuresTitle = page.locator('[data-testid="features-title"]');
    await expect(featuresTitle).toBeVisible();

    const featuresDescription = page.locator(
      '[data-testid="features-description"]'
    );
    await expect(featuresDescription).toBeVisible();

    const featuresGrid = page.locator('[data-testid="features-grid"]');
    await expect(featuresGrid).toBeVisible();

    // 各フィーチャーアイテムが表示されているか確認（4つの主要機能のみ）
    for (let i = 0; i < 4; i++) {
      const featureItem = page.locator(`[data-testid="feature-item-${i}"]`);
      await expect(featureItem).toBeVisible();
    }
  });

  test('改善されたフィーチャーセクションの詳細テスト', async ({ page }) => {
    await page.goto('/ja');

    // 4つの主要機能が表示されることを確認
    const expectedFeatures = [
      'シンプルなクイズ作成',
      '多彩な問題タイプ',
      '詳細な分析',
      '証明書'
    ];

    for (let i = 0; i < 4; i++) {
      const featureItem = page.locator(`[data-testid="feature-item-${i}"]`);
      const featureIcon = page.locator(`[data-testid="feature-icon-${i}"]`);
      const featureTitle = page.locator(`[data-testid="feature-title-${i}"]`);
      const featureDescription = page.locator(`[data-testid="feature-description-${i}"]`);

      // 要素が表示されることを確認
      await expect(featureItem).toBeVisible();
      await expect(featureIcon).toBeVisible();
      await expect(featureTitle).toBeVisible();
      await expect(featureDescription).toBeVisible();

      // ホバーエフェクトをテスト
      await featureItem.hover();
      
      // アニメーションが適用されているかを確認（影の変化やトランスフォーム）
      const hasHoverEffect = await featureItem.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.transform || styles.boxShadow;
      });
      expect(hasHoverEffect).toBeTruthy();
    }

    // レスポンシブグリッドレイアウトをテスト
    const featuresGrid = page.locator('[data-testid="features-grid"]');
    
    // デスクトップ表示（4列）
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(featuresGrid).toHaveClass(/lg:grid-cols-4/);
    
    // タブレット表示（2列）
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(featuresGrid).toHaveClass(/md:grid-cols-2/);
    
    // モバイル表示（1列）
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(featuresGrid).toHaveClass(/grid-cols-1/);
  });

  test('プライシングセクションの詳細テスト', async ({ page }) => {
    await page.goto('/ja');

    // プライシングセクションの要素を確認
    const pricingHeader = page.locator('[data-testid="pricing-header"]');
    await expect(pricingHeader).toBeVisible();

    const pricingTitle = page.locator('[data-testid="pricing-title"]');
    await expect(pricingTitle).toBeVisible();

    const pricingDescription = page.locator(
      '[data-testid="pricing-description"]'
    );
    await expect(pricingDescription).toBeVisible();

    const pricingPlans = page.locator('[data-testid="pricing-plans"]');
    await expect(pricingPlans).toBeVisible();

    // 各プランが表示されているか確認
    for (let i = 0; i < 3; i++) {
      const plan = page.locator(`[data-testid="pricing-plan-${i}"]`);
      await expect(plan).toBeVisible();

      const planHeader = page.locator(`[data-testid="plan-header-${i}"]`);
      await expect(planHeader).toBeVisible();

      const planName = page.locator(`[data-testid="plan-name-${i}"]`);
      await expect(planName).toBeVisible();

      const planPrice = page.locator(`[data-testid="plan-price-${i}"]`);
      await expect(planPrice).toBeVisible();

      const planCta = page.locator(`[data-testid="plan-cta-${i}"]`);
      await expect(planCta).toBeVisible();
    }

    // 人気バッジが表示されているか確認
    const popularBadge = page.locator('[data-testid="popular-badge"]');
    await expect(popularBadge).toBeVisible();
  });

  test('CTAセクションの詳細テスト', async ({ page }) => {
    await page.goto('/ja');

    // CTAセクションの要素を確認
    const ctaContainer = page.locator('[data-testid="cta-container"]');
    await expect(ctaContainer).toBeVisible();

    const ctaContent = page.locator('[data-testid="cta-content"]');
    await expect(ctaContent).toBeVisible();

    const ctaTitle = page.locator('[data-testid="cta-title"]');
    await expect(ctaTitle).toBeVisible();

    const ctaDescription = page.locator('[data-testid="cta-description"]');
    await expect(ctaDescription).toBeVisible();

    const ctaButtons = page.locator('[data-testid="cta-buttons"]');
    await expect(ctaButtons).toBeVisible();

    const ctaDemoButton = page.locator('[data-testid="cta-demo-button"]');
    await expect(ctaDemoButton).toBeVisible();

    const ctaSignupButton = page.locator('[data-testid="cta-signup-button"]');
    await expect(ctaSignupButton).toBeVisible();
  });

  test('フッターの詳細テスト', async ({ page }) => {
    await page.goto('/ja');

    // フッターの要素を確認
    const footerContainer = page.locator('[data-testid="footer-container"]');
    await expect(footerContainer).toBeVisible();

    const footerBrand = page.locator('[data-testid="footer-brand"]');
    await expect(footerBrand).toBeVisible();

    const footerLogo = page.locator('[data-testid="footer-logo"]');
    await expect(footerLogo).toBeVisible();

    const footerDescription = page.locator(
      '[data-testid="footer-description"]'
    );
    await expect(footerDescription).toBeVisible();

    const footerLinks = page.locator('[data-testid="footer-links"]');
    await expect(footerLinks).toBeVisible();

    const footerProducts = page.locator('[data-testid="footer-products"]');
    await expect(footerProducts).toBeVisible();

    const footerCompany = page.locator('[data-testid="footer-company"]');
    await expect(footerCompany).toBeVisible();

    const footerResources = page.locator('[data-testid="footer-resources"]');
    await expect(footerResources).toBeVisible();

    const footerBottom = page.locator('[data-testid="footer-bottom"]');
    await expect(footerBottom).toBeVisible();

    const footerCopyright = page.locator('[data-testid="footer-copyright"]');
    await expect(footerCopyright).toBeVisible();

    const footerLegalLinks = page.locator('[data-testid="footer-legal-links"]');
    await expect(footerLegalLinks).toBeVisible();
  });

  test('言語切り替え機能', async ({ page }) => {
    await page.goto('/ja');

    // 言語切り替えボタンを探す（デスクトップ版を優先）
    const languageSwitcher = page
      .locator(
        '[data-testid="navbar-desktop-actions"] [data-testid="language-switcher-button"]'
      )
      .first();
    await expect(languageSwitcher).toBeVisible();

    // 言語切り替えメニューを開く
    await languageSwitcher.click();

    // 言語切り替えメニューが表示されているか確認
    const languageMenu = page.locator('[data-testid="language-switcher-menu"]');
    await expect(languageMenu).toBeVisible();

    // 英語オプションをクリック
    const englishOption = page.locator('[data-testid="language-option-en"]');
    if (await englishOption.isVisible()) {
      await englishOption.click();
      // URLが英語版に変わることを確認
      await expect(page).toHaveURL(/\/en/);
    }
  });

  test('ナビゲーションリンクのテスト', async ({ page }) => {
    await page.goto('/ja');

    // ナビゲーションリンクが表示されているか確認
    const navFeatures = page.locator('[data-testid="nav-features"]');
    await expect(navFeatures).toBeVisible();

    const navPricing = page.locator('[data-testid="nav-pricing"]');
    await expect(navPricing).toBeVisible();

    const navFaq = page.locator('[data-testid="nav-faq"]');
    await expect(navFaq).toBeVisible();

    // ナビゲーションロゴが表示されているか確認
    const navbarLogo = page.locator('[data-testid="navbar-logo"]');
    await expect(navbarLogo).toBeVisible();
  });

  test('レスポンシブデザインテスト', async ({ page }) => {
    await page.goto('/ja');

    // モバイルサイズでテスト
    await page.setViewportSize({ width: 375, height: 812 });

    // ナビゲーションが適切に表示されているか確認
    const navbar = page.locator('[data-testid="navbar"]');
    await expect(navbar).toBeVisible();

    // モバイルアクションが表示されているか確認
    const mobileActions = page.locator('[data-testid="navbar-mobile-actions"]');
    await expect(mobileActions).toBeVisible();

    // ヒーローセクションが適切に表示されているか確認
    const hero = page.locator('[data-testid="hero-section"]');
    await expect(hero).toBeVisible();

    // モバイルでのスクリーンショット
    await page.screenshot({
      path: 'tests/top/screenshot/landing-page-mobile.png',
      fullPage: true,
    });

    // タブレットサイズでテスト
    await page.setViewportSize({ width: 768, height: 1024 });

    // タブレットでのスクリーンショット
    await page.screenshot({
      path: 'tests/top/screenshot/landing-page-tablet.png',
      fullPage: true,
    });

    // デスクトップサイズに戻す
    await page.setViewportSize({ width: 1280, height: 720 });

    // デスクトップアクションが表示されているか確認
    const desktopActions = page.locator(
      '[data-testid="navbar-desktop-actions"]'
    );
    await expect(desktopActions).toBeVisible();

    // デスクトップでのスクリーンショット
    await page.screenshot({
      path: 'tests/top/screenshot/landing-page-desktop.png',
      fullPage: true,
    });
  });

  test('スクロールテスト', async ({ page }) => {
    await page.goto('/ja');

    // ページの各セクションにスクロールして確認
    await page
      .locator('[data-testid="features-section"]')
      .scrollIntoViewIfNeeded();
    await expect(
      page.locator('[data-testid="features-section"]')
    ).toBeVisible();

    await page
      .locator('[data-testid="pricing-section"]')
      .scrollIntoViewIfNeeded();
    await expect(page.locator('[data-testid="pricing-section"]')).toBeVisible();

    await page.locator('[data-testid="cta-section"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-testid="cta-section"]')).toBeVisible();

    await page.locator('[data-testid="footer"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-testid="footer"]')).toBeVisible();

    // ページの最上部に戻る
    await page.locator('[data-testid="hero-section"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();

    // スクロール後のスクリーンショット
    await page.screenshot({
      path: 'tests/top/screenshot/landing-page-scrolled.png',
      fullPage: true,
    });
  });
});
