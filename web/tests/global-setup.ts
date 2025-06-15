/**
 * Global test setup for E2E tests - Issue #222
 * Handles database initialization and global test data preparation
 */

import { chromium, FullConfig } from '@playwright/test';
import {
  resetTestDatabase,
  initTestDatabase,
} from './fixtures/test-data-factory';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  try {
    // Initialize test database connection
    const testPrisma = initTestDatabase();

    // Ensure database is connected
    await testPrisma.$connect();
    console.log('✅ Test database connected');

    // Reset database to clean state
    await resetTestDatabase();
    console.log('✅ Test database reset to clean state');

    // Run basic database health check
    const userCount = await testPrisma.user.count();
    console.log(`✅ Database health check passed (${userCount} users)`);

    console.log('🎉 Global test setup completed successfully');
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  }
}

export default globalSetup;
