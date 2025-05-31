import { test, expect } from '@playwright/test';

test.describe('Landing Page Animations', () => {
  test('Hero section animations should be visible', async ({ page }) => {
    await page.goto('/en');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the hero section is visible
    await expect(page.getByTestId('hero-section')).toBeVisible();
    
    // Check that animated content is visible
    await expect(page.getByTestId('hero-content')).toBeVisible();
    await expect(page.getByTestId('hero-illustration')).toBeVisible();
  });

  test('Features section animations should be visible', async ({ page }) => {
    await page.goto('/en');
    
    // Scroll to features section
    await page.getByTestId('features-section').scrollIntoViewIfNeeded();
    
    // Wait for animations to complete
    await page.waitForTimeout(1000);
    
    // Check that feature items are visible
    await expect(page.getByTestId('feature-item-0')).toBeVisible();
    await expect(page.getByTestId('feature-item-1')).toBeVisible();
  });

  test('CTA buttons should have hover effects', async ({ page }) => {
    await page.goto('/en');
    
    // Test hero CTA button hover
    const heroButton = page.getByTestId('hero-start-button');
    await expect(heroButton).toBeVisible();
    
    // Hover over the button
    await heroButton.hover();
    
    // Check if the button has transition classes
    await expect(heroButton).toHaveClass(/transition-all/);
  });

  test('Tab switching should work smoothly', async ({ page }) => {
    await page.goto('/en');
    
    // Scroll to use cases section
    await page.getByTestId('usecases-section').scrollIntoViewIfNeeded();
    
    // Check that tabs are visible
    await expect(page.getByTestId('usecase-tab-education')).toBeVisible();
    await expect(page.getByTestId('usecase-tab-corporate')).toBeVisible();
    await expect(page.getByTestId('usecase-tab-certification')).toBeVisible();
    
    // Click on a different tab
    await page.getByTestId('usecase-tab-corporate').click();
    
    // Check that the content switched
    await expect(page.getByTestId('usecase-content-corporate')).toBeVisible();
  });

  test('Pricing section animations should be visible', async ({ page }) => {
    await page.goto('/en');
    
    // Scroll to pricing section
    await page.getByTestId('pricing-section').scrollIntoViewIfNeeded();
    
    // Wait for animations to complete
    await page.waitForTimeout(1000);
    
    // Check that pricing elements are visible
    await expect(page.getByTestId('pricing-header')).toBeVisible();
    await expect(page.getByTestId('pricing-plans')).toBeVisible();
  });

  test('CTA section animations should be visible', async ({ page }) => {
    await page.goto('/en');
    
    // Scroll to CTA section
    await page.getByTestId('cta-section').scrollIntoViewIfNeeded();
    
    // Wait for animations to complete
    await page.waitForTimeout(1000);
    
    // Check that CTA content is visible
    await expect(page.getByTestId('cta-content')).toBeVisible();
    
    // Test CTA button hover effects
    const ctaButton = page.getByTestId('cta-signup-button');
    await expect(ctaButton).toBeVisible();
    await ctaButton.hover();
    await expect(ctaButton).toHaveClass(/transition-all/);
  });

  test('Page should respect reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/en');
    
    // Even with reduced motion, elements should still be visible
    await expect(page.getByTestId('hero-section')).toBeVisible();
    await expect(page.getByTestId('features-section')).toBeVisible();
  });
});