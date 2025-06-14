import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  services: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    sentry: {
      status: 'configured' | 'not_configured';
      dsn_configured: boolean;
    };
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

const startTime = Date.now();

export async function GET(request: NextRequest): Promise<NextResponse> {
  const healthCheck: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: {
        status: 'down',
      },
      sentry: {
        status: 'not_configured',
        dsn_configured: false,
      },
    },
    uptime: Date.now() - startTime,
    memory: {
      used: 0,
      total: 0,
      percentage: 0,
    },
  };

  // Check database connection
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStart;

    healthCheck.services.database = {
      status: 'up',
      responseTime: dbResponseTime,
    };

    Sentry.addBreadcrumb({
      message: 'Database health check passed',
      category: 'health',
      level: 'info',
      data: { responseTime: dbResponseTime },
    });
  } catch (error) {
    healthCheck.services.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
    healthCheck.status = 'unhealthy';

    Sentry.captureException(error, {
      tags: {
        component: 'health_check',
        service: 'database',
      },
    });
  }

  // Check Sentry configuration
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  healthCheck.services.sentry = {
    status: sentryDsn ? 'configured' : 'not_configured',
    dsn_configured: !!sentryDsn,
  };

  // Memory usage
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memUsage = process.memoryUsage();
    healthCheck.memory = {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    };
  }

  // Determine overall status
  if (healthCheck.services.database.status === 'down') {
    healthCheck.status = 'unhealthy';
  } else if (!healthCheck.services.sentry.dsn_configured) {
    healthCheck.status = 'degraded';
  }

  const statusCode =
    healthCheck.status === 'healthy'
      ? 200
      : healthCheck.status === 'degraded'
        ? 200
        : 503;

  return NextResponse.json(healthCheck, { status: statusCode });
}

// Detailed health check for monitoring systems
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { service } = body;

    switch (service) {
      case 'database':
        return await checkDatabaseHealth();
      case 'sentry':
        return await checkSentryHealth();
      default:
        return NextResponse.json(
          { error: 'Invalid service specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

async function checkDatabaseHealth(): Promise<NextResponse> {
  try {
    // Test basic connectivity
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const basicResponseTime = Date.now() - start;

    // Test table access
    const tableStart = Date.now();
    const userCount = await prisma.user.count();
    const tableResponseTime = Date.now() - tableStart;

    // Test write capability (non-destructive)
    const writeStart = Date.now();
    await prisma.$executeRaw`SELECT COUNT(*) FROM "User"`;
    const writeResponseTime = Date.now() - writeStart;

    return NextResponse.json({
      status: 'healthy',
      metrics: {
        basic_connectivity: basicResponseTime,
        table_access: tableResponseTime,
        write_test: writeResponseTime,
        user_count: userCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'database_health_check' },
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

async function checkSentryHealth(): Promise<NextResponse> {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const org = process.env.SENTRY_ORG;
  const project = process.env.SENTRY_PROJECT;

  try {
    // Test Sentry integration
    Sentry.addBreadcrumb({
      message: 'Sentry health check performed',
      category: 'health',
      level: 'info',
    });

    return NextResponse.json({
      status: 'healthy',
      configuration: {
        dsn_configured: !!dsn,
        org_configured: !!org,
        project_configured: !!project,
        environment: process.env.NODE_ENV,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'degraded',
        error: 'Sentry integration test failed',
        configuration: {
          dsn_configured: !!dsn,
          org_configured: !!org,
          project_configured: !!project,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
