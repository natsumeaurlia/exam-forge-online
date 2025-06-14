import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { monitoringService } from '@/lib/monitoring';
import { z } from 'zod';

const metricsQuerySchema = z.object({
  hours: z.coerce.number().min(1).max(168).default(24), // Max 1 week
  type: z.enum(['system', 'application', 'database']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isAdminUser(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = metricsQuerySchema.parse({
      hours: searchParams.get('hours'),
      type: searchParams.get('type'),
    });

    const metrics = await monitoringService.getMetricsHistory(query.hours);
    const currentMetrics = await monitoringService.collectSystemMetrics();

    let filteredMetrics = metrics;
    if (query.type) {
      // Filter metrics based on type if specified
      filteredMetrics = metrics.map(metric => {
        if (query.type === 'system') {
          return {
            timestamp: metric.timestamp,
            cpu: metric.cpu,
            memory: metric.memory,
            disk: metric.disk,
          };
        } else if (query.type === 'database') {
          return {
            timestamp: metric.timestamp,
            database: metric.database,
          };
        } else if (query.type === 'application') {
          return {
            timestamp: metric.timestamp,
            application: metric.application,
          };
        }
        return metric;
      });
    }

    const response = {
      current: currentMetrics,
      history: filteredMetrics,
      summary: {
        totalDataPoints: filteredMetrics.length,
        timeRange: {
          start: filteredMetrics[filteredMetrics.length - 1]?.timestamp,
          end: filteredMetrics[0]?.timestamp,
        },
        averages: calculateAverages(filteredMetrics),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

function calculateAverages(metrics: any[]) {
  if (metrics.length === 0) return {};

  const sums = metrics.reduce(
    (acc, metric) => {
      if (metric.cpu) {
        acc.cpuUsage = (acc.cpuUsage || 0) + metric.cpu.usage;
      }
      if (metric.memory) {
        acc.memoryPercentage =
          (acc.memoryPercentage || 0) + metric.memory.percentage;
      }
      if (metric.disk) {
        acc.diskPercentage = (acc.diskPercentage || 0) + metric.disk.percentage;
      }
      if (metric.database) {
        acc.dbResponseTime =
          (acc.dbResponseTime || 0) + metric.database.responseTime;
        acc.dbConnections =
          (acc.dbConnections || 0) + metric.database.connections;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const count = metrics.length;

  return {
    cpuUsage: sums.cpuUsage
      ? Math.round((sums.cpuUsage / count) * 100) / 100
      : undefined,
    memoryPercentage: sums.memoryPercentage
      ? Math.round((sums.memoryPercentage / count) * 100) / 100
      : undefined,
    diskPercentage: sums.diskPercentage
      ? Math.round((sums.diskPercentage / count) * 100) / 100
      : undefined,
    dbResponseTime: sums.dbResponseTime
      ? Math.round((sums.dbResponseTime / count) * 100) / 100
      : undefined,
    dbConnections: sums.dbConnections
      ? Math.round(sums.dbConnections / count)
      : undefined,
  };
}

function isAdminUser(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  return adminEmails.includes(email);
}
