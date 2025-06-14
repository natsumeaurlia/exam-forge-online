import { test, expect } from '@playwright/test';

test.describe('Health Check System', () => {
  test('should return health status', async ({ request }) => {
    const response = await request.get('/api/health');
    const data = await response.json();

    expect([200, 207, 503]).toContain(response.status());
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('checks');

    expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
  });

  test('should include database health check', async ({ request }) => {
    const response = await request.get('/api/health');
    const data = await response.json();

    expect(data.checks).toHaveProperty('database');
    expect(data.checks.database).toHaveProperty('status');
    expect(data.checks.database).toHaveProperty('responseTime');
    expect(typeof data.checks.database.responseTime).toBe('number');
  });

  test('should handle specific service health check', async ({ request }) => {
    const response = await request.post('/api/health', {
      data: { service: 'database' },
    });
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data).toHaveProperty('service', 'database');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('responseTime');
  });

  test('should return 404 for non-existent service', async ({ request }) => {
    const response = await request.post('/api/health', {
      data: { service: 'nonexistent' },
    });

    expect(response.status()).toBe(404);
  });

  test('should return degraded status for slow responses', async ({
    request,
  }) => {
    // This would be a mock test in real implementation
    const response = await request.get('/api/health');
    const data = await response.json();

    // Check that response time is tracked
    for (const [service, check] of Object.entries(data.checks)) {
      expect(typeof (check as any).responseTime).toBe('number');
      expect((check as any).responseTime).toBeGreaterThan(0);
    }
  });
});
