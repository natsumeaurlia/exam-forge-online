import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { format } from 'date-fns';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

const prisma = new PrismaClient();

interface BackupConfig {
  databaseUrl: string;
  s3Bucket: string;
  s3Region: string;
  localBackupPath: string;
  retainDays: number;
}

interface BackupMetadata {
  id: string;
  timestamp: Date;
  filename: string;
  size: number;
  type: 'full' | 'incremental';
  status: 'success' | 'failed';
  s3Key?: string;
  error?: string;
}

export class DatabaseBackupService {
  private config: BackupConfig;
  private s3Client: S3Client;

  constructor(config: BackupConfig) {
    this.config = config;
    this.s3Client = new S3Client({ region: config.s3Region });
  }

  async createFullBackup(): Promise<BackupMetadata> {
    const timestamp = new Date();
    const filename = `backup_full_${format(timestamp, 'yyyy-MM-dd_HH-mm-ss')}.sql`;
    const localPath = path.join(this.config.localBackupPath, filename);

    try {
      await fs.mkdir(this.config.localBackupPath, { recursive: true });

      const dbUrl = new URL(this.config.databaseUrl);
      const pgDumpCommand = `PGPASSWORD="${dbUrl.password}" pg_dump -h ${dbUrl.hostname} -p ${dbUrl.port || 5432} -U ${dbUrl.username} -d ${dbUrl.pathname.slice(1)} --verbose --clean --no-owner --no-privileges > "${localPath}"`;

      execSync(pgDumpCommand, { stdio: 'pipe' });

      const stats = await fs.stat(localPath);
      const s3Key = `backups/${filename}`;

      await this.uploadToS3(localPath, s3Key);

      const metadata: BackupMetadata = {
        id: `backup_${timestamp.getTime()}`,
        timestamp,
        filename,
        size: stats.size,
        type: 'full',
        status: 'success',
        s3Key,
      };

      await this.saveBackupMetadata(metadata);
      await fs.unlink(localPath);

      return metadata;
    } catch (error) {
      const metadata: BackupMetadata = {
        id: `backup_${timestamp.getTime()}`,
        timestamp,
        filename,
        size: 0,
        type: 'full',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      await this.saveBackupMetadata(metadata);
      throw error;
    }
  }

  async createIncrementalBackup(
    lastBackupTimestamp: Date
  ): Promise<BackupMetadata> {
    const timestamp = new Date();
    const filename = `backup_incremental_${format(timestamp, 'yyyy-MM-dd_HH-mm-ss')}.sql`;
    const localPath = path.join(this.config.localBackupPath, filename);

    try {
      await fs.mkdir(this.config.localBackupPath, { recursive: true });

      const changesSql = await this.generateIncrementalSQL(lastBackupTimestamp);
      await fs.writeFile(localPath, changesSql);

      const stats = await fs.stat(localPath);
      const s3Key = `backups/${filename}`;

      await this.uploadToS3(localPath, s3Key);

      const metadata: BackupMetadata = {
        id: `backup_${timestamp.getTime()}`,
        timestamp,
        filename,
        size: stats.size,
        type: 'incremental',
        status: 'success',
        s3Key,
      };

      await this.saveBackupMetadata(metadata);
      await fs.unlink(localPath);

      return metadata;
    } catch (error) {
      const metadata: BackupMetadata = {
        id: `backup_${timestamp.getTime()}`,
        timestamp,
        filename,
        size: 0,
        type: 'incremental',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      await this.saveBackupMetadata(metadata);
      throw error;
    }
  }

  private async generateIncrementalSQL(since: Date): Promise<string> {
    const tables = [
      'User',
      'Team',
      'TeamMember',
      'Quiz',
      'Question',
      'QuestionOption',
      'QuizResponse',
      'QuestionResponse',
      'Subscription',
      'Plan',
    ];

    let sql = `-- Incremental backup from ${since.toISOString()}\n\n`;

    for (const table of tables) {
      try {
        const lowerTable = table.toLowerCase();
        const records = await prisma.$queryRawUnsafe(
          `SELECT * FROM "${table}" WHERE "updatedAt" > $1 OR "createdAt" > $1`,
          since
        );

        if (Array.isArray(records) && records.length > 0) {
          sql += `-- ${table} changes\n`;
          for (const record of records) {
            const columns = Object.keys(record)
              .map(k => `"${k}"`)
              .join(', ');
            const values = Object.values(record)
              .map(v => {
                if (v === null) return 'NULL';
                if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
                if (v instanceof Date) return `'${v.toISOString()}'`;
                if (typeof v === 'object')
                  return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
                return String(v);
              })
              .join(', ');

            sql += `INSERT INTO "${table}" (${columns}) VALUES (${values}) ON CONFLICT (id) DO UPDATE SET `;
            sql += Object.keys(record)
              .filter(k => k !== 'id')
              .map(k => `"${k}" = EXCLUDED."${k}"`)
              .join(', ');
            sql += ';\n';
          }
          sql += '\n';
        }
      } catch (error) {
        console.warn(`Failed to query ${table}:`, error);
      }
    }

    return sql;
  }

  private async uploadToS3(localPath: string, s3Key: string): Promise<void> {
    const fileContent = await fs.readFile(localPath);

    const command = new PutObjectCommand({
      Bucket: this.config.s3Bucket,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'application/sql',
      Metadata: {
        timestamp: new Date().toISOString(),
        type: 'database-backup',
      },
    });

    await this.s3Client.send(command);
  }

  async downloadFromS3(s3Key: string, localPath: string): Promise<void> {
    const command = new GetObjectCommand({
      Bucket: this.config.s3Bucket,
      Key: s3Key,
    });

    const response = await this.s3Client.send(command);
    if (response.Body) {
      const content = await response.Body.transformToByteArray();
      await fs.writeFile(localPath, content);
    }
  }

  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const result = await prisma.$queryRaw<BackupMetadata[]>`
        SELECT * FROM backup_metadata ORDER BY timestamp DESC
      `;
      return result;
    } catch (error) {
      return [];
    }
  }

  async getBackupById(id: string): Promise<BackupMetadata | null> {
    try {
      const result = await prisma.$queryRaw<BackupMetadata[]>`
        SELECT * FROM backup_metadata WHERE id = ${id}
      `;
      return result[0] || null;
    } catch (error) {
      return null;
    }
  }

  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO backup_metadata (id, timestamp, filename, size, type, status, s3_key, error)
        VALUES (${metadata.id}, ${metadata.timestamp}, ${metadata.filename}, ${metadata.size}, 
                ${metadata.type}, ${metadata.status}, ${metadata.s3Key || null}, ${metadata.error || null})
        ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        s3_key = EXCLUDED.s3_key,
        error = EXCLUDED.error
      `;
    } catch (error) {
      console.error('Failed to save backup metadata:', error);
    }
  }

  async cleanupOldBackups(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retainDays);

    try {
      const oldBackups = await prisma.$queryRaw<BackupMetadata[]>`
        SELECT * FROM backup_metadata WHERE timestamp < ${cutoffDate}
      `;

      for (const backup of oldBackups) {
        if (backup.s3Key) {
          try {
            await this.s3Client.send(
              new PutObjectCommand({
                Bucket: this.config.s3Bucket,
                Key: backup.s3Key + '.deleted',
              })
            );
          } catch (error) {
            console.warn(`Failed to delete S3 object ${backup.s3Key}:`, error);
          }
        }
      }

      await prisma.$executeRaw`
        DELETE FROM backup_metadata WHERE timestamp < ${cutoffDate}
      `;
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  async scheduleBackup(
    type: 'full' | 'incremental' = 'full'
  ): Promise<BackupMetadata> {
    if (type === 'full') {
      return await this.createFullBackup();
    } else {
      const lastBackup = await prisma.$queryRaw<BackupMetadata[]>`
        SELECT * FROM backup_metadata WHERE status = 'success' ORDER BY timestamp DESC LIMIT 1
      `;
      const lastTimestamp = lastBackup[0]?.timestamp || new Date(0);
      return await this.createIncrementalBackup(lastTimestamp);
    }
  }
}

export async function initializeBackupService(): Promise<DatabaseBackupService> {
  const config: BackupConfig = {
    databaseUrl: process.env.DATABASE_URL!,
    s3Bucket: process.env.BACKUP_S3_BUCKET || 'exam-forge-backups',
    s3Region: process.env.AWS_REGION || 'ap-northeast-1',
    localBackupPath: process.env.LOCAL_BACKUP_PATH || '/tmp/backups',
    retainDays: parseInt(process.env.BACKUP_RETAIN_DAYS || '30'),
  };

  return new DatabaseBackupService(config);
}
