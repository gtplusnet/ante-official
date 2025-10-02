import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { MigrationStatus, SystemMigration } from '@prisma/client';
import {
  MigrationContext,
  MigrationResult,
  MigrationRollbackResult,
} from '../interfaces/migration.interface';
import { MigrationRegistry } from './migration-registry.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);
  private readonly environment: string;
  private readonly logsDirectory: string;
  private currentLogStream: fs.WriteStream | null = null;
  private currentLogFile: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly migrationRegistry: MigrationRegistry,
    private readonly configService: ConfigService,
  ) {
    this.environment = this.configService.get<string>(
      'NODE_ENV',
      'development',
    );
    // Create logs directory for migrations
    this.logsDirectory = path.join(process.cwd(), 'logs', 'migrations');
    this.ensureLogsDirectory();
  }

  private ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDirectory)) {
      fs.mkdirSync(this.logsDirectory, { recursive: true });
      this.logger.log(
        `Created migration logs directory: ${this.logsDirectory}`,
      );
    }
  }

  private createLogFile(migrationName: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFileName = `${migrationName}_${timestamp}.log`;
    const logFilePath = path.join(this.logsDirectory, logFileName);

    // Close any existing stream
    if (this.currentLogStream) {
      this.currentLogStream.end();
    }

    // Create new write stream
    this.currentLogStream = fs.createWriteStream(logFilePath, { flags: 'a' });
    this.currentLogFile = logFilePath;

    // Write header
    this.writeToLog(`===========================================`);
    this.writeToLog(`Migration: ${migrationName}`);
    this.writeToLog(`Started: ${new Date().toISOString()}`);
    this.writeToLog(`Environment: ${this.environment}`);
    this.writeToLog(`===========================================\n`);

    return logFilePath;
  }

  private writeToLog(message: string) {
    if (this.currentLogStream) {
      const timestamp = new Date().toISOString();
      this.currentLogStream.write(`[${timestamp}] ${message}\n`);
    }
    // Also log to console
    this.logger.log(message);
  }

  private closeLogFile() {
    if (this.currentLogStream) {
      this.writeToLog(`\n===========================================`);
      this.writeToLog(`Migration completed at: ${new Date().toISOString()}`);
      this.writeToLog(`===========================================`);
      this.currentLogStream.end();
      this.currentLogStream = null;
    }
  }

  async onModuleInit() {
    // Register all migrations on module initialization
    await this.migrationRegistry.registerMigrations();
  }

  async getAllMigrations(): Promise<SystemMigration[]> {
    return this.prisma.systemMigration.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async getPendingMigrations(): Promise<string[]> {
    const executedMigrations = await this.prisma.systemMigration.findMany({
      where: {
        status: {
          in: [MigrationStatus.COMPLETED, MigrationStatus.SKIPPED],
        },
        environment: this.environment,
      },
      select: { name: true },
    });

    const executedNames = new Set(executedMigrations.map((m) => m.name));
    const allMigrations = this.migrationRegistry.getAllMigrations();

    return allMigrations
      .filter((migration) => !executedNames.has(migration.name))
      .map((m) => m.name);
  }

  async runAllPendingMigrations(
    context?: Partial<MigrationContext>,
  ): Promise<{ success: boolean; migrations: any[] }> {
    const pendingNames = await this.getPendingMigrations();
    const results = [];

    for (const name of pendingNames) {
      const result = await this.runMigration(name, context);
      results.push(result);

      if (!result.success) {
        this.logger.error(`Migration ${name} failed, stopping execution`);
        break;
      }
    }

    return {
      success: results.every((r) => r.success),
      migrations: results,
    };
  }

  async runMigration(
    name: string,
    context?: Partial<MigrationContext>,
  ): Promise<{
    success: boolean;
    migration: SystemMigration;
    error?: string;
    logFile?: string;
  }> {
    const migration = this.migrationRegistry.getMigration(name);
    if (!migration) {
      throw new Error(`Migration ${name} not found`);
    }

    // Create log file for this migration
    const logFilePath = this.createLogFile(name);
    this.writeToLog(`Initializing migration: ${name}`);

    // Check if migration already exists
    let migrationRecord = await this.prisma.systemMigration.findUnique({
      where: { name },
    });

    // Create migration record if it doesn't exist
    if (!migrationRecord) {
      this.writeToLog(`Creating new migration record for: ${name}`);
      migrationRecord = await this.prisma.systemMigration.create({
        data: {
          name: migration.name,
          version: migration.version,
          description: migration.description,
          environment: this.environment,
          rollbackable: migration.rollbackable,
          status: MigrationStatus.PENDING,
        },
      });
    }

    // Check if already completed
    if (migrationRecord.status === MigrationStatus.COMPLETED) {
      this.writeToLog(`Migration ${name} already completed`);
      this.closeLogFile();
      return {
        success: true,
        migration: migrationRecord,
        logFile: logFilePath,
      };
    }

    const fullContext: MigrationContext = {
      dryRun: false,
      batchSize: 100,
      environment: this.environment,
      verbose: true,
      ...context,
    };

    // Only update status to running if not in dry-run mode
    if (!fullContext.dryRun) {
      this.writeToLog(`Updating migration status to RUNNING`);
      migrationRecord = await this.prisma.systemMigration.update({
        where: { id: migrationRecord.id },
        data: {
          status: MigrationStatus.RUNNING,
          executedAt: new Date(),
          executedBy: context?.executedBy || 'system',
        },
      });
    }

    try {
      this.writeToLog(`Starting migration execution: ${name}`);

      if (fullContext.dryRun) {
        this.writeToLog(`DRY RUN MODE - No changes will be made`);
      }

      // Capture migration output
      const originalLog = migration.logger?.log;
      const originalError = migration.logger?.error;
      const originalWarn = migration.logger?.warn;

      if (migration.logger) {
        migration.logger.log = (message: string) => {
          this.writeToLog(`[MIGRATION] ${message}`);
          if (originalLog) originalLog.call(migration.logger, message);
        };
        migration.logger.error = (message: string) => {
          this.writeToLog(`[ERROR] ${message}`);
          if (originalError) originalError.call(migration.logger, message);
        };
        migration.logger.warn = (message: string) => {
          this.writeToLog(`[WARNING] ${message}`);
          if (originalWarn) originalWarn.call(migration.logger, message);
        };
      }

      const result: MigrationResult = await migration.up(fullContext);

      if (result.success) {
        this.writeToLog(`Migration execution completed successfully`);
        this.writeToLog(`Records processed: ${result.recordsProcessed || 0}`);

        if (!fullContext.dryRun) {
          // Verify migration if verification method exists
          let verified = true;
          if (migration.verify) {
            this.writeToLog(`Running migration verification...`);
            verified = await migration.verify();
            this.writeToLog(
              `Verification result: ${verified ? 'PASSED' : 'FAILED'}`,
            );
          }

          // Store log file path in metadata
          const updatedMetadata = {
            ...(result.metadata || {}),
            logFile: logFilePath,
            recordsProcessed: result.recordsProcessed || 0,
          };

          migrationRecord = await this.prisma.systemMigration.update({
            where: { id: migrationRecord.id },
            data: {
              status: verified
                ? MigrationStatus.COMPLETED
                : MigrationStatus.FAILED,
              metadata: updatedMetadata,
              errorMessage: verified ? null : 'Verification failed',
            },
          });

          if (verified) {
            this.writeToLog(`Migration ${name} completed successfully`);
            this.writeToLog(
              `Records processed: ${result.recordsProcessed || 0}`,
            );
          } else {
            this.writeToLog(`[ERROR] Migration ${name} verification failed`);
          }
        } else {
          this.writeToLog(
            `DRY RUN - Migration ${name} would process ${result.recordsProcessed || 0} records`,
          );
          // For dry-run, return a temporary migration record
          this.closeLogFile();
          return {
            success: true,
            migration: {
              ...migrationRecord,
              status: MigrationStatus.PENDING,
              metadata: { ...result.metadata, logFile: logFilePath },
            } as SystemMigration,
            logFile: logFilePath,
          };
        }

        this.closeLogFile();
        return {
          success: true,
          migration: migrationRecord,
          logFile: logFilePath,
        };
      } else {
        throw new Error(result.error || 'Migration failed');
      }
    } catch (error) {
      this.writeToLog(`[ERROR] Migration ${name} failed: ${error.message}`);
      this.writeToLog(`Stack trace: ${error.stack}`);

      if (!fullContext.dryRun) {
        const updatedMetadata = {
          logFile: logFilePath,
          errorDetails: error.stack,
        };

        migrationRecord = await this.prisma.systemMigration.update({
          where: { id: migrationRecord.id },
          data: {
            status: MigrationStatus.FAILED,
            errorMessage: error.message,
            metadata: updatedMetadata,
          },
        });
      } else {
        // For dry-run, just return the error without updating database
        this.closeLogFile();
        return {
          success: false,
          migration: {
            ...migrationRecord,
            status: MigrationStatus.FAILED,
            errorMessage: error.message,
            metadata: { logFile: logFilePath },
          } as SystemMigration,
          error: error.message,
          logFile: logFilePath,
        };
      }

      this.closeLogFile();
      return {
        success: false,
        migration: migrationRecord,
        error: error.message,
        logFile: logFilePath,
      };
    }
  }

  async getMigrationLogs(name: string): Promise<string[]> {
    const logsDir = this.logsDirectory;
    if (!fs.existsSync(logsDir)) {
      return [];
    }

    // Find all log files for this migration
    const files = fs.readdirSync(logsDir);
    const migrationLogs = files.filter((file) => file.startsWith(`${name}_`));

    return migrationLogs.map((file) => path.join(logsDir, file));
  }

  async getLogContent(logFilePath: string): Promise<string> {
    if (!fs.existsSync(logFilePath)) {
      throw new Error(`Log file not found: ${logFilePath}`);
    }

    return fs.readFileSync(logFilePath, 'utf-8');
  }

  async getLatestLogForMigration(name: string): Promise<string | null> {
    const logs = await this.getMigrationLogs(name);
    if (logs.length === 0) {
      return null;
    }

    // Sort by modification time (newest first)
    const sortedLogs = logs.sort((a, b) => {
      const statA = fs.statSync(a);
      const statB = fs.statSync(b);
      return statB.mtime.getTime() - statA.mtime.getTime();
    });

    return await this.getLogContent(sortedLogs[0]);
  }

  async rollbackMigration(
    name: string,
    context?: Partial<MigrationContext>,
  ): Promise<{ success: boolean; migration: SystemMigration; error?: string }> {
    const migration = this.migrationRegistry.getMigration(name);
    if (!migration) {
      throw new Error(`Migration ${name} not found`);
    }

    if (!migration.rollbackable) {
      throw new Error(`Migration ${name} is not rollbackable`);
    }

    const migrationRecord = await this.prisma.systemMigration.findUnique({
      where: { name },
    });

    if (!migrationRecord) {
      throw new Error(`Migration ${name} has not been executed`);
    }

    if (migrationRecord.status !== MigrationStatus.COMPLETED) {
      throw new Error(`Migration ${name} is not in completed state`);
    }

    const fullContext: MigrationContext = {
      dryRun: false,
      batchSize: 100,
      environment: this.environment,
      verbose: true,
      ...context,
    };

    try {
      this.logger.log(`Rolling back migration: ${name}`);

      const result: MigrationRollbackResult = await migration.down(fullContext);

      if (result.success) {
        const updatedRecord = await this.prisma.systemMigration.update({
          where: { id: migrationRecord.id },
          data: {
            status: MigrationStatus.ROLLED_BACK,
            rolledBackAt: new Date(),
            metadata: {
              ...(typeof migrationRecord.metadata === 'object'
                ? migrationRecord.metadata
                : {}),
              rollback: result.metadata,
            },
          },
        });

        this.logger.log(`Migration ${name} rolled back successfully`);
        return { success: true, migration: updatedRecord };
      } else {
        throw new Error(result.error || 'Rollback failed');
      }
    } catch (error) {
      this.logger.error(`Rollback of migration ${name} failed:`, error);
      return {
        success: false,
        migration: migrationRecord,
        error: error.message,
      };
    }
  }

  async getMigrationStatus(name: string): Promise<SystemMigration | null> {
    return this.prisma.systemMigration.findUnique({
      where: { name },
    });
  }

  async verifyMigration(name: string): Promise<boolean> {
    const migration = this.migrationRegistry.getMigration(name);
    if (!migration || !migration.verify) {
      return false;
    }

    try {
      return await migration.verify();
    } catch (error) {
      this.logger.error(`Verification of migration ${name} failed:`, error);
      return false;
    }
  }
}
