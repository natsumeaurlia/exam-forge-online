/**
 * Global test teardown for E2E tests - Issue #222
 * Handles cleanup of test data and database connections
 */

import { FullConfig } from '@playwright/test';
import {
  resetTestDatabase,
  initTestDatabase,
} from './fixtures/test-data-factory';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');

  try {
    const testPrisma = initTestDatabase();

    // Final cleanup of any remaining test data
    await resetTestDatabase();
    console.log('✅ Test database cleaned up');

    // Close database connection
    await testPrisma.$disconnect();
    console.log('✅ Test database connection closed');

    console.log('🎉 Global test teardown completed successfully');
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;
