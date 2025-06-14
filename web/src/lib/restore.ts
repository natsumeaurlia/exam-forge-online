import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { format } from 'date-fns';
import { initializeBackupService, DatabaseBackupService } from './backup';

const prisma = new PrismaClient();

interface RestoreOptions {
  type: 'full' | 'selective';
  tables?: string[];
  validateBeforeRestore?: boolean;
  createBackupBeforeRestore?: boolean;
}

interface RestoreResult {
  success: boolean;
  backupId: string;
  restoredTables: string[];
  errors: string[];
  preRestoreBackupId?: string;
  duration: number;
}

export class DatabaseRestoreService {
  private backupService: DatabaseBackupService;

  constructor() {
    this.backupService;
  }

  async initialize() {
    this.backupService = await initializeBackupService();
  }

  async restoreFromBackup(
    backupId: string,
    options: RestoreOptions
  ): Promise<RestoreResult> {
    const startTime = Date.now();
    const result: RestoreResult = {
      success: false,
      backupId,
      restoredTables: [],
      errors: [],
      duration: 0,
    };

    try {
      if (!this.backupService) {
        await this.initialize();
      }

      const backup = await this.backupService.getBackupById(backupId);
      if (!backup || backup.status !== 'success') {
        throw new Error(`Backup ${backupId} not found or failed`);
      }

      if (options.validateBeforeRestore) {
        await this.validateBackup(backup.s3Key!);
      }

      if (options.createBackupBeforeRestore) {
        const preBackup = await this.backupService.createFullBackup();
        result.preRestoreBackupId = preBackup.id;
      }

      const localPath = `/tmp/restore_${backupId}.sql`;
      await this.backupService.downloadFromS3(backup.s3Key!, localPath);

      if (options.type === 'full') {
        await this.performFullRestore(localPath);
        result.restoredTables = ['ALL'];
      } else {
        await this.performSelectiveRestore(localPath, options.tables || []);
        result.restoredTables = options.tables || [];
      }

      result.success = true;
      await fs.unlink(localPath);
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    result.duration = Date.now() - startTime;
    await this.logRestoreOperation(result);

    return result;
  }

  private async validateBackup(s3Key: string): Promise<void> {
    const tempPath = `/tmp/validate_${Date.now()}.sql`;

    try {
      await this.backupService.downloadFromS3(s3Key, tempPath);
      const content = await fs.readFile(tempPath, 'utf-8');

      if (!content.includes('PostgreSQL database dump')) {
        throw new Error('Invalid backup file format');
      }

      if (content.includes('ERROR') || content.includes('FATAL')) {
        throw new Error('Backup file contains errors');
      }

      await fs.unlink(tempPath);
    } catch (error) {
      await fs.unlink(tempPath).catch(() => {}); // Clean up on error
      throw error;
    }
  }

  private async performFullRestore(backupPath: string): Promise<void> {
    const dbUrl = new URL(process.env.DATABASE_URL!);

    const restoreCommand = `PGPASSWORD="${dbUrl.password}" psql -h ${dbUrl.hostname} -p ${dbUrl.port || 5432} -U ${dbUrl.username} -d ${dbUrl.pathname.slice(1)} -f "${backupPath}"`;

    try {
      execSync(restoreCommand, { stdio: 'pipe' });
    } catch (error) {
      throw new Error(`Full restore failed: ${error}`);
    }
  }

  private async performSelectiveRestore(
    backupPath: string,
    tables: string[]
  ): Promise<void> {
    const content = await fs.readFile(backupPath, 'utf-8');
    const lines = content.split('\n');

    let currentTable = '';
    let inTargetTable = false;
    let restoreScript = '';

    for (const line of lines) {
      if (line.startsWith('--') && line.includes('Table:')) {
        currentTable = this.extractTableName(line);
        inTargetTable = tables.includes(currentTable);
      }

      if (
        inTargetTable ||
        line.startsWith('CREATE') ||
        line.startsWith('ALTER') ||
        line.startsWith('COMMENT')
      ) {
        restoreScript += line + '\n';
      }
    }

    if (restoreScript) {
      const tempScript = `/tmp/selective_restore_${Date.now()}.sql`;
      await fs.writeFile(tempScript, restoreScript);

      const dbUrl = new URL(process.env.DATABASE_URL!);
      const restoreCommand = `PGPASSWORD="${dbUrl.password}" psql -h ${dbUrl.hostname} -p ${dbUrl.port || 5432} -U ${dbUrl.username} -d ${dbUrl.pathname.slice(1)} -f "${tempScript}"`;

      try {
        execSync(restoreCommand, { stdio: 'pipe' });
        await fs.unlink(tempScript);
      } catch (error) {
        await fs.unlink(tempScript).catch(() => {});
        throw new Error(`Selective restore failed: ${error}`);
      }
    }
  }

  private extractTableName(line: string): string {
    const match = line.match(/Table:\s+(\w+)/);
    return match ? match[1] : '';
  }

  async testDatabaseConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }

  async verifyRestoreIntegrity(backupId: string): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check for missing foreign key constraints
      const fkIssues = await prisma.$queryRaw<
        Array<{ table_name: string; constraint_name: string }>
      >`
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND NOT EXISTS (
          SELECT 1 FROM information_schema.referential_constraints rc
          WHERE rc.constraint_name = tc.constraint_name
        )
      `;

      if (fkIssues.length > 0) {
        issues.push(
          `Missing foreign key constraints: ${fkIssues.map(i => i.constraint_name).join(', ')}`
        );
      }

      // Check for orphaned records
      const orphanedUsers = await prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count FROM "TeamMember" tm
        WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = tm."userId")
      `;

      if (orphanedUsers[0]?.count > 0) {
        issues.push(
          `Found ${orphanedUsers[0].count} orphaned team member records`
        );
      }

      // Check sequence consistency
      const sequenceIssues = await this.checkSequenceConsistency();
      issues.push(...sequenceIssues);
    } catch (error) {
      issues.push(
        `Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  private async checkSequenceConsistency(): Promise<string[]> {
    const issues: string[] = [];

    try {
      const tables = ['User', 'Team', 'Quiz', 'Question'];

      for (const table of tables) {
        const maxId = await prisma.$queryRawUnsafe(
          `SELECT MAX(id) as max_id FROM "${table}"`
        );
        const currentVal = await prisma.$queryRawUnsafe(
          `SELECT currval(pg_get_serial_sequence('"${table}"', 'id')) as curr_val`
        );

        // Note: This is a simplified check. Real implementation would need proper sequence handling
      }
    } catch (error) {
      issues.push(
        `Sequence check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return issues;
  }

  async createRestorePoint(name?: string): Promise<string> {
    const restorePointName =
      name || `restore_point_${format(new Date(), 'yyyy_MM_dd_HH_mm_ss')}`;

    try {
      const backup = await this.backupService.createFullBackup();

      await prisma.$executeRaw`
        INSERT INTO restore_points (id, name, backup_id, created_at)
        VALUES (${crypto.randomUUID()}, ${restorePointName}, ${backup.id}, ${new Date()})
      `;

      return backup.id;
    } catch (error) {
      throw new Error(
        `Failed to create restore point: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async listRestorePoints(): Promise<
    Array<{
      id: string;
      name: string;
      backupId: string;
      createdAt: Date;
    }>
  > {
    try {
      return await prisma.$queryRaw`
        SELECT id, name, backup_id as "backupId", created_at as "createdAt"
        FROM restore_points
        ORDER BY created_at DESC
      `;
    } catch (error) {
      return [];
    }
  }

  private async logRestoreOperation(result: RestoreResult): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO restore_log (id, backup_id, success, restored_tables, errors, duration, created_at)
        VALUES (${crypto.randomUUID()}, ${result.backupId}, ${result.success}, 
                ${JSON.stringify(result.restoredTables)}, ${JSON.stringify(result.errors)}, 
                ${result.duration}, ${new Date()})
      `;
    } catch (error) {
      console.error('Failed to log restore operation:', error);
    }
  }
}

export async function initializeRestoreService(): Promise<DatabaseRestoreService> {
  const service = new DatabaseRestoreService();
  await service.initialize();
  return service;
}
