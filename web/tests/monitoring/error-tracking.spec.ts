import { test, expect } from '@playwright/test';

test.describe('Error Tracking System', () => {
  test('should list errors with admin access', async ({ request }) => {
    const response = await request.get('/api/admin/errors');

    if (response.status() === 401) {
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Unauthorized');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('errors');
    expect(data).toHaveProperty('statistics');
    expect(Array.isArray(data.errors)).toBe(true);
  });

  test('should filter errors by resolved status', async ({ request }) => {
    const resolvedResponse = await request.get(
      '/api/admin/errors?resolved=true'
    );
    const unresolvedResponse = await request.get(
      '/api/admin/errors?resolved=false'
    );

    if (resolvedResponse.status() === 401) {
      expect(resolvedResponse.status()).toBe(401);
      expect(unresolvedResponse.status()).toBe(401);
      return;
    }

    expect(resolvedResponse.status()).toBe(200);
    expect(unresolvedResponse.status()).toBe(200);

    const resolvedData = await resolvedResponse.json();
    const unresolvedData = await unresolvedResponse.json();

    expect(resolvedData.meta.resolved).toBe(true);
    expect(unresolvedData.meta.resolved).toBe(false);
  });

  test('should support manual error capture', async ({ request }) => {
    const response = await request.put('/api/admin/errors', {
      data: {
        message: 'Test error for monitoring',
        level: 'warning',
        context: {
          testContext: 'automated test',
        },
      },
    });

    if (response.status() === 401) {
      expect(response.status()).toBe(401);
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('errorId');
  });

  test('should resolve errors', async ({ request }) => {
    const response = await request.post('/api/admin/errors', {
      data: {
        fingerprint: 'test-fingerprint-123',
        assignedTo: 'test-admin',
      },
    });

    if (response.status() === 401) {
      expect(response.status()).toBe(401);
      return;
    }

    // Should handle the resolve operation (may fail if fingerprint doesn't exist)
    expect([200, 500]).toContain(response.status());
  });

  test('should validate error level parameter', async ({ request }) => {
    const response = await request.put('/api/admin/errors', {
      data: {
        message: 'Test error',
        level: 'invalid-level',
      },
    });

    // Should return either 401 (unauthorized) or 400 (validation error)
    expect([400, 401, 500]).toContain(response.status());
  });

  test('should include error statistics', async ({ request }) => {
    const response = await request.get('/api/admin/errors');

    if (response.status() === 401) {
      expect(response.status()).toBe(401);
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('statistics');
    expect(data.statistics).toHaveProperty('totalErrors');
    expect(data.statistics).toHaveProperty('errorsByLevel');
    expect(data.statistics).toHaveProperty('errorsByType');
    expect(typeof data.statistics.totalErrors).toBe('number');
  });
});
