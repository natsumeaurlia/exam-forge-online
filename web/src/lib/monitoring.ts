import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';
import os from 'os';
import { promises as fs } from 'fs';

const prisma = new PrismaClient();

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  timestamp: Date;
  details?: Record<string, any>;
  error?: string;
}

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  database: {
    connections: number;
    activeQueries: number;
    responseTime: number;
  };
  application: {
    uptime: number;
    requests: number;
    errors: number;
  };
}

export interface AlertConfig {
  id: string;
  name: string;
  type: 'threshold' | 'availability' | 'error_rate';
  metric: string;
  threshold: number;
  comparison: '>' | '<' | '=' | '>=' | '<=';
  duration: number; // seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: ('email' | 'slack' | 'webhook')[];
  enabled: boolean;
}

class MonitoringService {
  private metricsHistory: SystemMetrics[] = [];
  private healthChecks: Map<string, HealthCheckResult> = new Map();
  private alertConfigs: AlertConfig[] = [];
  private lastAlertTimes: Map<string, Date> = new Map();

  async initialize(): Promise<void> {
    await this.loadAlertConfigs();
    await this.setupMetricsCollection();
    await this.setupHealthChecks();
  }

  async performHealthChecks(): Promise<HealthCheckResult[]> {
    const checks = [
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
      this.checkS3Health(),
      this.checkStripeHealth(),
      this.checkApplicationHealth(),
    ];

    const results = await Promise.allSettled(checks);
    const healthResults: HealthCheckResult[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        healthResults.push(result.value);
        this.healthChecks.set(result.value.service, result.value);
      } else {
        const failedCheck: HealthCheckResult = {
          service: ['database', 'redis', 's3', 'stripe', 'application'][index],
          status: 'unhealthy',
          responseTime: 0,
          timestamp: new Date(),
          error: result.reason?.message || 'Unknown error',
        };
        healthResults.push(failedCheck);
        this.healthChecks.set(failedCheck.service, failedCheck);
      }
    });

    await this.checkAlerts(healthResults);
    return healthResults;
  }

  private async checkDatabaseHealth(): Promise<HealthCheckResult> {
    const start = performance.now();

    try {
      await prisma.$queryRaw`SELECT 1`;

      const [connectionCount] = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
      `;

      const [dbSize] = await prisma.$queryRaw<[{ size: string }]>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;

      const responseTime = performance.now() - start;

      return {
        service: 'database',
        status:
          responseTime < 100
            ? 'healthy'
            : responseTime < 500
              ? 'degraded'
              : 'unhealthy',
        responseTime,
        timestamp: new Date(),
        details: {
          activeConnections: Number(connectionCount.count),
          databaseSize: dbSize.size,
        },
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: performance.now() - start,
        timestamp: new Date(),
        error:
          error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }

  private async checkRedisHealth(): Promise<HealthCheckResult> {
    const start = performance.now();

    try {
      // Mock Redis check - replace with actual Redis client
      await new Promise(resolve => setTimeout(resolve, 10));

      return {
        service: 'redis',
        status: 'healthy',
        responseTime: performance.now() - start,
        timestamp: new Date(),
        details: {
          connected: true,
        },
      };
    } catch (error) {
      return {
        service: 'redis',
        status: 'unhealthy',
        responseTime: performance.now() - start,
        timestamp: new Date(),
        error:
          error instanceof Error ? error.message : 'Redis connection failed',
      };
    }
  }

  private async checkS3Health(): Promise<HealthCheckResult> {
    const start = performance.now();

    try {
      // Mock S3 check - replace with actual S3 client
      await new Promise(resolve => setTimeout(resolve, 50));

      return {
        service: 's3',
        status: 'healthy',
        responseTime: performance.now() - start,
        timestamp: new Date(),
        details: {
          available: true,
        },
      };
    } catch (error) {
      return {
        service: 's3',
        status: 'unhealthy',
        responseTime: performance.now() - start,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'S3 connection failed',
      };
    }
  }

  private async checkStripeHealth(): Promise<HealthCheckResult> {
    const start = performance.now();

    try {
      // Mock Stripe check - replace with actual Stripe client
      await new Promise(resolve => setTimeout(resolve, 30));

      return {
        service: 'stripe',
        status: 'healthy',
        responseTime: performance.now() - start,
        timestamp: new Date(),
        details: {
          apiAvailable: true,
        },
      };
    } catch (error) {
      return {
        service: 'stripe',
        status: 'unhealthy',
        responseTime: performance.now() - start,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Stripe API failed',
      };
    }
  }

  private async checkApplicationHealth(): Promise<HealthCheckResult> {
    const start = performance.now();

    try {
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();

      return {
        service: 'application',
        status: uptime > 60 ? 'healthy' : 'degraded',
        responseTime: performance.now() - start,
        timestamp: new Date(),
        details: {
          uptime,
          memoryUsage: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024),
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          },
        },
      };
    } catch (error) {
      return {
        service: 'application',
        status: 'unhealthy',
        responseTime: performance.now() - start,
        timestamp: new Date(),
        error:
          error instanceof Error ? error.message : 'Application check failed',
      };
    }
  }

  async collectSystemMetrics(): Promise<SystemMetrics> {
    const timestamp = new Date();

    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    let diskStats = { total: 0, used: 0, free: 0 };
    try {
      const stats = await fs.stat('/');
      diskStats = {
        total: 100 * 1024 * 1024 * 1024, // Mock 100GB
        used: 50 * 1024 * 1024 * 1024, // Mock 50GB used
        free: 50 * 1024 * 1024 * 1024, // Mock 50GB free
      };
    } catch (error) {
      console.warn('Failed to get disk stats:', error);
    }

    const dbStart = performance.now();
    let dbConnections = 0;
    let dbResponseTime = 0;

    try {
      const [result] = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT count(*) as count FROM pg_stat_activity
      `;
      dbConnections = Number(result.count);
      dbResponseTime = performance.now() - dbStart;
    } catch (error) {
      dbResponseTime = performance.now() - dbStart;
    }

    const metrics: SystemMetrics = {
      timestamp,
      cpu: {
        usage: this.calculateCpuUsage(cpus),
        loadAverage: os.loadavg(),
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percentage: (usedMem / totalMem) * 100,
      },
      disk: {
        total: diskStats.total,
        used: diskStats.used,
        free: diskStats.free,
        percentage: (diskStats.used / diskStats.total) * 100,
      },
      database: {
        connections: dbConnections,
        activeQueries: 0, // Would need query to pg_stat_activity
        responseTime: dbResponseTime,
      },
      application: {
        uptime: process.uptime(),
        requests: 0, // Would track in middleware
        errors: 0, // Would track in error handler
      },
    };

    this.metricsHistory.push(metrics);

    // Keep only last 1000 metrics (about 16 hours at 1min intervals)
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory.shift();
    }

    await this.saveMetrics(metrics);
    return metrics;
  }

  private calculateCpuUsage(cpus: os.CpuInfo[]): number {
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    }

    return 100 - ~~((100 * totalIdle) / totalTick);
  }

  private async saveMetrics(metrics: SystemMetrics): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO system_metrics (
          timestamp, cpu_usage, memory_percentage, disk_percentage,
          db_connections, db_response_time, uptime
        ) VALUES (
          ${metrics.timestamp},
          ${metrics.cpu.usage},
          ${metrics.memory.percentage},
          ${metrics.disk.percentage},
          ${metrics.database.connections},
          ${metrics.database.responseTime},
          ${metrics.application.uptime}
        )
      `;
    } catch (error) {
      console.error('Failed to save metrics:', error);
    }
  }

  async getMetricsHistory(hours: number = 24): Promise<SystemMetrics[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    try {
      const results = await prisma.$queryRaw<any[]>`
        SELECT * FROM system_metrics 
        WHERE timestamp >= ${since}
        ORDER BY timestamp DESC
      `;

      return results.map(row => ({
        timestamp: row.timestamp,
        cpu: { usage: row.cpu_usage, loadAverage: [0, 0, 0] },
        memory: {
          total: 0,
          used: 0,
          free: 0,
          percentage: row.memory_percentage,
        },
        disk: {
          total: 0,
          used: 0,
          free: 0,
          percentage: row.disk_percentage,
        },
        database: {
          connections: row.db_connections,
          activeQueries: 0,
          responseTime: row.db_response_time,
        },
        application: {
          uptime: row.uptime,
          requests: 0,
          errors: 0,
        },
      }));
    } catch (error) {
      return this.metricsHistory.filter(m => m.timestamp >= since);
    }
  }

  private async loadAlertConfigs(): Promise<void> {
    // Load from database or config file
    this.alertConfigs = [
      {
        id: 'high-cpu',
        name: 'High CPU Usage',
        type: 'threshold',
        metric: 'cpu.usage',
        threshold: 80,
        comparison: '>',
        duration: 300,
        severity: 'high',
        channels: ['email', 'slack'],
        enabled: true,
      },
      {
        id: 'high-memory',
        name: 'High Memory Usage',
        type: 'threshold',
        metric: 'memory.percentage',
        threshold: 85,
        comparison: '>',
        duration: 180,
        severity: 'high',
        channels: ['email'],
        enabled: true,
      },
      {
        id: 'database-down',
        name: 'Database Unavailable',
        type: 'availability',
        metric: 'database.status',
        threshold: 0,
        comparison: '=',
        duration: 60,
        severity: 'critical',
        channels: ['email', 'slack'],
        enabled: true,
      },
    ];
  }

  private async setupMetricsCollection(): Promise<void> {
    // Collect metrics every minute
    setInterval(async () => {
      try {
        await this.collectSystemMetrics();
      } catch (error) {
        console.error('Metrics collection failed:', error);
      }
    }, 60000);
  }

  private async setupHealthChecks(): Promise<void> {
    // Perform health checks every 30 seconds
    setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 30000);
  }

  private async checkAlerts(healthResults: HealthCheckResult[]): Promise<void> {
    for (const config of this.alertConfigs) {
      if (!config.enabled) continue;

      const shouldAlert = await this.evaluateAlert(config, healthResults);
      if (shouldAlert) {
        await this.sendAlert(config, healthResults);
      }
    }
  }

  private async evaluateAlert(
    config: AlertConfig,
    healthResults: HealthCheckResult[]
  ): Promise<boolean> {
    // Simplified alert evaluation
    const lastAlert = this.lastAlertTimes.get(config.id);
    const now = new Date();

    // Don't spam alerts - minimum 5 minutes between same alerts
    if (lastAlert && now.getTime() - lastAlert.getTime() < 300000) {
      return false;
    }

    // Check health-based alerts
    if (config.type === 'availability') {
      const relevantCheck = healthResults.find(
        r => r.service === config.metric.split('.')[0]
      );
      if (relevantCheck && relevantCheck.status === 'unhealthy') {
        return true;
      }
    }

    return false;
  }

  private async sendAlert(
    config: AlertConfig,
    healthResults: HealthCheckResult[]
  ): Promise<void> {
    this.lastAlertTimes.set(config.id, new Date());

    const alertData = {
      config,
      timestamp: new Date(),
      healthResults: healthResults.filter(r => r.status !== 'healthy'),
    };

    console.error('ALERT:', config.name, alertData);

    // Here you would integrate with actual notification services
    // - Send email via Resend
    // - Send Slack notification
    // - Call webhook
  }

  getHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    const checks = Array.from(this.healthChecks.values());

    if (checks.some(c => c.status === 'unhealthy')) {
      return 'unhealthy';
    }

    if (checks.some(c => c.status === 'degraded')) {
      return 'degraded';
    }

    return 'healthy';
  }
}

export const monitoringService = new MonitoringService();
export default monitoringService;
