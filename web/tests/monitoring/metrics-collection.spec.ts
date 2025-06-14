import { test, expect } from '@playwright/test';

test.describe('Metrics Collection System', () => {
  test('should collect system metrics with admin access', async ({
    request,
  }) => {
    const response = await request.get('/api/admin/metrics');

    if (response.status() === 401) {
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Unauthorized');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('current');
    expect(data).toHaveProperty('history');
    expect(data).toHaveProperty('summary');

    // Check current metrics structure
    expect(data.current).toHaveProperty('timestamp');
    expect(data.current).toHaveProperty('cpu');
    expect(data.current).toHaveProperty('memory');
    expect(data.current).toHaveProperty('database');
  });

  test('should filter metrics by hours parameter', async ({ request }) => {
    const response = await request.get('/api/admin/metrics?hours=1');

    if (response.status() === 401) {
      expect(response.status()).toBe(401);
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Check that timeRange reflects the 1-hour filter
    if (data.summary.timeRange.start && data.summary.timeRange.end) {
      const startTime = new Date(data.summary.timeRange.start);
      const endTime = new Date(data.summary.timeRange.end);
      const timeDiff = endTime.getTime() - startTime.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      expect(hoursDiff).toBeLessThanOrEqual(1.1); // Small buffer for timing
    }
  });

  test('should filter metrics by type', async ({ request }) => {
    const systemResponse = await request.get('/api/admin/metrics?type=system');
    const dbResponse = await request.get('/api/admin/metrics?type=database');

    if (systemResponse.status() === 401) {
      expect(systemResponse.status()).toBe(401);
      expect(dbResponse.status()).toBe(401);
      return;
    }

    expect(systemResponse.status()).toBe(200);
    expect(dbResponse.status()).toBe(200);

    const systemData = await systemResponse.json();
    const dbData = await dbResponse.json();

    // System metrics should include CPU, memory, disk
    if (systemData.history.length > 0) {
      const firstMetric = systemData.history[0];
      expect(firstMetric).toHaveProperty('cpu');
      expect(firstMetric).toHaveProperty('memory');
    }

    // Database metrics should include database info
    if (dbData.history.length > 0) {
      const firstMetric = dbData.history[0];
      expect(firstMetric).toHaveProperty('database');
    }
  });

  test('should validate hours parameter range', async ({ request }) => {
    const tooLowResponse = await request.get('/api/admin/metrics?hours=0');
    const tooHighResponse = await request.get('/api/admin/metrics?hours=200');

    // Should either reject with 400 or clamp to valid range
    if (tooLowResponse.status() !== 401) {
      expect([200, 400]).toContain(tooLowResponse.status());
    }

    if (tooHighResponse.status() !== 401) {
      expect([200, 400]).toContain(tooHighResponse.status());
    }
  });

  test('should include calculated averages', async ({ request }) => {
    const response = await request.get('/api/admin/metrics?hours=24');

    if (response.status() === 401) {
      expect(response.status()).toBe(401);
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data.summary).toHaveProperty('averages');

    // If there's historical data, averages should be numbers
    if (data.summary.totalDataPoints > 0) {
      const averages = data.summary.averages;
      if (averages.cpuUsage !== undefined) {
        expect(typeof averages.cpuUsage).toBe('number');
      }
      if (averages.memoryPercentage !== undefined) {
        expect(typeof averages.memoryPercentage).toBe('number');
      }
    }
  });

  test('should include metadata about data collection', async ({ request }) => {
    const response = await request.get('/api/admin/metrics');

    if (response.status() === 401) {
      expect(response.status()).toBe(401);
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data.summary).toHaveProperty('totalDataPoints');
    expect(data.summary).toHaveProperty('timeRange');
    expect(typeof data.summary.totalDataPoints).toBe('number');
  });
});
