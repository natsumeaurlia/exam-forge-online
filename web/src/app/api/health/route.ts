import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '@/lib/monitoring';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const healthChecks = await monitoringService.performHealthChecks();
    const overallStatus = monitoringService.getHealthStatus();

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: healthChecks.reduce(
        (acc, check) => {
          acc[check.service] = {
            status: check.status,
            responseTime: check.responseTime,
            details: check.details,
            error: check.error,
          };
          return acc;
        },
        {} as Record<string, any>
      ),
    };

    const statusCode =
      overallStatus === 'healthy'
        ? 200
        : overallStatus === 'degraded'
          ? 207
          : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check system failure',
        checks: {},
      },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service } = body;

    if (service) {
      // Trigger specific service health check
      const healthChecks = await monitoringService.performHealthChecks();
      const specificCheck = healthChecks.find(
        check => check.service === service
      );

      if (specificCheck) {
        return NextResponse.json({
          service: specificCheck.service,
          status: specificCheck.status,
          responseTime: specificCheck.responseTime,
          timestamp: specificCheck.timestamp,
          details: specificCheck.details,
          error: specificCheck.error,
        });
      }

      return NextResponse.json(
        { error: `Service ${service} not found` },
        { status: 404 }
      );
    }

    // Trigger full health check
    const healthChecks = await monitoringService.performHealthChecks();
    const overallStatus = monitoringService.getHealthStatus();

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: healthChecks,
    });
  } catch (error) {
    console.error('Health check trigger failed:', error);
    return NextResponse.json(
      { error: 'Failed to trigger health check' },
      { status: 500 }
    );
  }
}
