import { test, expect } from '@playwright/test';

test.describe('FAQ Accordion Component', () => {
  test('FAQ accordion basic functionality test', async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/ja');

    // Verify FAQ section is visible
    const faqSection = page.locator('[data-testid="faq-section"]');
    await expect(faqSection).toBeVisible();

    // Verify FAQ title is displayed
    const faqTitle = page.locator('[data-testid="faq-title"]');
    await expect(faqTitle).toBeVisible();
    await expect(faqTitle).toContainText('よくあるご質問');

    // Verify accordion is present
    const faqAccordion = page.locator('[data-testid="faq-accordion"]');
    await expect(faqAccordion).toBeVisible();

    // Check first FAQ item interaction
    const firstItem = page.locator('[data-testid="faq-item-0"]');
    const firstQuestion = page.locator('[data-testid="faq-question-0"]');
    const firstAnswer = page.locator('[data-testid="faq-answer-0"]');

    await expect(firstItem).toBeVisible();
    await expect(firstQuestion).toBeVisible();

    // Initially answer should not be visible
    await expect(firstAnswer).not.toBeVisible();

    // Click to expand
    await firstQuestion.click();
    await expect(firstAnswer).toBeVisible();

    // Click to collapse
    await firstQuestion.click();
    await expect(firstAnswer).not.toBeVisible();

    // Test multiple accordion expansion
    await firstQuestion.click();
    const secondQuestion = page.locator('[data-testid="faq-question-1"]');
    const secondAnswer = page.locator('[data-testid="faq-answer-1"]');
    
    await secondQuestion.click();
    
    // Both should be visible (multiple accordion feature)
    await expect(firstAnswer).toBeVisible();
    await expect(secondAnswer).toBeVisible();

    console.log('FAQ Accordion test completed successfully');
  });

  test('FAQ accordion English language test', async ({ page }) => {
    // Navigate to English version
    await page.goto('/en');

    // Verify FAQ section is visible
    const faqSection = page.locator('[data-testid="faq-section"]');
    await expect(faqSection).toBeVisible();

    // Verify FAQ title is in English
    const faqTitle = page.locator('[data-testid="faq-title"]');
    await expect(faqTitle).toBeVisible();
    await expect(faqTitle).toContainText('Frequently Asked Questions');

    // Test first question content in English
    const firstQuestion = page.locator('[data-testid="faq-question-0"]');
    await expect(firstQuestion).toContainText('What can I do with the free plan?');

    console.log('FAQ Accordion English test completed successfully');
  });
});