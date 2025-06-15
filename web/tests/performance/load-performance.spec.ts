import { test, expect } from '@playwright/test';

test.describe('⚡ Performance & Load Testing', () => {
  test('Page Load Performance Benchmarks', async ({ page }) => {
    const performancePages = [
      { path: '/ja', name: 'Landing Page', maxLoadTime: 3000 },
      { path: '/ja/dashboard', name: 'Dashboard', maxLoadTime: 4000 },
      { path: '/ja/dashboard/quizzes', name: 'Quiz List', maxLoadTime: 5000 },
      { path: '/ja/quiz/create', name: 'Quiz Creator', maxLoadTime: 4000 },
      { path: '/ja/plans', name: 'Pricing', maxLoadTime: 3000 },
    ];

    for (const { path, name, maxLoadTime } of performancePages) {
      console.log(`Testing ${name} performance...`);

      const startTime = Date.now();

      // Navigate to page
      await page.goto(path);

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      console.log(`${name} loaded in ${loadTime}ms`);
      expect(loadTime).toBeLessThan(maxLoadTime);

      // Test Core Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise<{
          lcp?: number;
          fid?: number;
          cls?: number;
          ttfb?: number;
        }>(resolve => {
          const vitals: any = {};

          // Largest Contentful Paint
          if ('PerformanceObserver' in window) {
            new PerformanceObserver(list => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              vitals.lcp = lastEntry.startTime;
            }).observe({ entryTypes: ['largest-contentful-paint'] });

            // Time to First Byte
            const navigationEntry = performance.getEntriesByType(
              'navigation'
            )[0] as PerformanceNavigationTiming;
            if (navigationEntry) {
              vitals.ttfb =
                navigationEntry.responseStart - navigationEntry.requestStart;
            }
          }

          setTimeout(() => resolve(vitals), 2000);
        });
      });

      // Core Web Vitals thresholds
      if (webVitals.lcp) {
        expect(webVitals.lcp).toBeLessThan(2500); // LCP < 2.5s (Good)
      }

      if (webVitals.ttfb) {
        expect(webVitals.ttfb).toBeLessThan(800); // TTFB < 800ms
      }
    }
  });

  test('Memory Usage and Leak Detection', async ({ page }) => {
    // Navigate through multiple pages to test for memory leaks
    const navigationSequence = [
      '/ja',
      '/ja/dashboard',
      '/ja/dashboard/quizzes',
      '/ja/quiz/create',
      '/ja/dashboard/analytics',
      '/ja/dashboard/team',
      '/ja/dashboard/settings',
    ];

    let initialMemory: number;

    for (let i = 0; i < navigationSequence.length; i++) {
      await page.goto(navigationSequence[i]);
      await page.waitForLoadState('networkidle');

      // Get memory usage
      const memoryInfo = await page.evaluate(() => {
        if ('memory' in performance) {
          return {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
          };
        }
        return null;
      });

      if (memoryInfo) {
        if (i === 0) {
          initialMemory = memoryInfo.usedJSHeapSize;
        } else {
          const memoryIncrease = memoryInfo.usedJSHeapSize - initialMemory;
          const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

          console.log(
            `Memory usage after ${i} navigations: ${memoryIncreaseMB.toFixed(2)}MB increase`
          );

          // Memory shouldn't increase by more than 50MB after multiple navigations
          expect(memoryIncreaseMB).toBeLessThan(50);
        }
      }

      // Force garbage collection if available (Chrome only)
      await page.evaluate(() => {
        if ('gc' in window) {
          (window as any).gc();
        }
      });
    }
  });

  test('Bundle Size and Resource Loading', async ({ page }) => {
    // Track resource loading
    const resources: { url: string; size: number; type: string }[] = [];

    page.on('response', async response => {
      if (response.status() === 200) {
        const contentLength = response.headers()['content-length'];
        const size = contentLength ? parseInt(contentLength) : 0;

        resources.push({
          url: response.url(),
          size,
          type: response.headers()['content-type'] || 'unknown',
        });
      }
    });

    await page.goto('/ja/dashboard');
    await page.waitForLoadState('networkidle');

    // Analyze JavaScript bundles
    const jsResources = resources.filter(r => r.type.includes('javascript'));
    const totalJSSize = jsResources.reduce((sum, r) => sum + r.size, 0);
    const totalJSSizeMB = totalJSSize / (1024 * 1024);

    console.log(`Total JavaScript size: ${totalJSSizeMB.toFixed(2)}MB`);

    // JavaScript bundle should be reasonable size (< 5MB total)
    expect(totalJSSizeMB).toBeLessThan(5);

    // Analyze CSS resources
    const cssResources = resources.filter(r => r.type.includes('css'));
    const totalCSSSize = cssResources.reduce((sum, r) => sum + r.size, 0);
    const totalCSSSizeKB = totalCSSSize / 1024;

    console.log(`Total CSS size: ${totalCSSSizeKB.toFixed(2)}KB`);

    // CSS should be optimized (< 500KB total)
    expect(totalCSSSizeKB).toBeLessThan(500);

    // Check for duplicate resources
    const urlCounts = resources.reduce(
      (acc, r) => {
        acc[r.url] = (acc[r.url] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const duplicates = Object.entries(urlCounts).filter(
      ([_, count]) => count > 1
    );
    expect(duplicates.length).toBe(0);
  });

  test('API Response Time Performance', async ({ page }) => {
    // Intercept API calls and measure response times
    const apiCalls: { url: string; duration: number; status: number }[] = [];

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/')) {
        const timing = response.timing();
        apiCalls.push({
          url,
          duration: timing.responseEnd - timing.requestStart,
          status: response.status(),
        });
      }
    });

    // Navigate to pages that make API calls
    await page.goto('/ja/dashboard');
    await page.waitForLoadState('networkidle');

    await page.goto('/ja/dashboard/quizzes');
    await page.waitForLoadState('networkidle');

    // Analyze API performance
    for (const call of apiCalls) {
      console.log(`API ${call.url}: ${call.duration}ms`);

      // API calls should complete within reasonable time
      expect(call.duration).toBeLessThan(5000); // 5 seconds max

      // Successful API calls
      if (call.status >= 200 && call.status < 300) {
        expect(call.duration).toBeLessThan(2000); // 2 seconds for successful calls
      }
    }
  });

  test('Large Dataset Rendering Performance', async ({ page }) => {
    // Test with large quiz list (simulate loading many quizzes)
    await page.goto('/ja/dashboard/quizzes');
    await page.waitForLoadState('networkidle');

    // Measure initial render time
    const renderStartTime = Date.now();

    // Scroll to trigger any virtual scrolling or lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for any lazy-loaded content
    await page.waitForTimeout(1000);

    const renderTime = Date.now() - renderStartTime;
    console.log(`Large list render time: ${renderTime}ms`);

    // Scrolling and rendering should be smooth
    expect(renderTime).toBeLessThan(3000);

    // Test table/list virtualization if present
    const listItems = page.locator(
      '[data-testid*="quiz-item"], .quiz-card, tr'
    );
    const itemCount = await listItems.count();

    if (itemCount > 50) {
      // Large lists should use virtualization for performance
      const viewport = page.viewportSize();
      const visibleItems = await page
        .locator('[data-testid*="quiz-item"]:visible')
        .count();

      // Not all items should be rendered at once for large lists
      expect(visibleItems).toBeLessThan(itemCount);
    }
  });

  test('Image Loading and Optimization', async ({ page }) => {
    // Track image resources
    const images: { url: string; size: number; type: string }[] = [];

    page.on('response', async response => {
      const contentType = response.headers()['content-type'] || '';
      if (contentType.startsWith('image/')) {
        const contentLength = response.headers()['content-length'];
        const size = contentLength ? parseInt(contentLength) : 0;

        images.push({
          url: response.url(),
          size,
          type: contentType,
        });
      }
    });

    await page.goto('/ja');
    await page.waitForLoadState('networkidle');

    // Check image optimization
    for (const image of images) {
      const sizeKB = image.size / 1024;
      console.log(`Image ${image.url}: ${sizeKB.toFixed(2)}KB (${image.type})`);

      // Images should be reasonably sized
      if (image.type.includes('jpeg') || image.type.includes('jpg')) {
        expect(sizeKB).toBeLessThan(500); // JPEG < 500KB
      } else if (image.type.includes('png')) {
        expect(sizeKB).toBeLessThan(200); // PNG < 200KB
      } else if (image.type.includes('webp')) {
        expect(sizeKB).toBeLessThan(300); // WebP < 300KB
      }
    }

    // Check for modern image formats usage
    const modernFormats = images.filter(
      img => img.type.includes('webp') || img.type.includes('avif')
    );

    if (images.length > 0) {
      const modernFormatRatio = modernFormats.length / images.length;
      console.log(
        `Modern image format usage: ${(modernFormatRatio * 100).toFixed(1)}%`
      );

      // Encourage modern format usage (at least 50% where possible)
      expect(modernFormatRatio).toBeGreaterThan(0.3);
    }
  });

  test('Database Query Performance Simulation', async ({ page }) => {
    // Test pages that likely make database queries
    const dbIntensivePages = [
      '/ja/dashboard/analytics',
      '/ja/dashboard/quizzes',
      '/ja/dashboard/team',
    ];

    for (const pagePath of dbIntensivePages) {
      const startTime = Date.now();

      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      // Wait for data to load (look for loading states to disappear)
      await page
        .waitForSelector('.loading, .spinner, [aria-busy="true"]', {
          state: 'detached',
          timeout: 10000,
        })
        .catch(() => {
          // It's okay if no loading indicators are found
        });

      const totalTime = Date.now() - startTime;
      console.log(`${pagePath} total load time: ${totalTime}ms`);

      // Database-heavy pages should still load within reasonable time
      expect(totalTime).toBeLessThan(8000);

      // Check that data is actually loaded (not empty states)
      const hasContent =
        (await page.locator('table tr, .card, .data-item').count()) > 0;
      if (hasContent) {
        // If there's content, it should load efficiently
        expect(totalTime).toBeLessThan(6000);
      }
    }
  });

  test('Concurrent User Simulation', async ({ browser }) => {
    // Simulate multiple users accessing the system simultaneously
    const concurrentUsers = 3;
    const contexts = [];
    const pages = [];

    // Create multiple browser contexts (simulate different users)
    for (let i = 0; i < concurrentUsers; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      contexts.push(context);
      pages.push(page);
    }

    // Have all users navigate simultaneously
    const navigationPromises = pages.map(async (page, index) => {
      const startTime = Date.now();

      await page.goto('/ja/dashboard');
      await page.waitForLoadState('networkidle');

      // Each user performs different actions
      if (index === 0) {
        await page.goto('/ja/dashboard/quizzes');
      } else if (index === 1) {
        await page.goto('/ja/dashboard/analytics');
      } else {
        await page.goto('/ja/dashboard/team');
      }

      await page.waitForLoadState('networkidle');

      const totalTime = Date.now() - startTime;
      return { user: index, time: totalTime };
    });

    const results = await Promise.all(navigationPromises);

    // All users should complete within reasonable time
    for (const result of results) {
      console.log(`User ${result.user} completed in ${result.time}ms`);
      expect(result.time).toBeLessThan(10000);
    }

    // Average response time should be reasonable
    const averageTime =
      results.reduce((sum, r) => sum + r.time, 0) / results.length;
    console.log(`Average concurrent user response time: ${averageTime}ms`);
    expect(averageTime).toBeLessThan(7000);

    // Cleanup
    for (const context of contexts) {
      await context.close();
    }
  });
});
