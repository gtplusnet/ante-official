import { MigrationStatus } from '@prisma/client';

export interface MigrationContext {
  dryRun: boolean;
  batchSize: number;
  environment: string;
  executedBy?: string;
  verbose?: boolean;
}

export interface MigrationResult {
  success: boolean;
  recordsProcessed?: number;
  error?: string;
  metadata?: any;
}

export interface MigrationRollbackResult {
  success: boolean;
  error?: string;
  metadata?: any;
}

export abstract class Migration {
  abstract name: string;
  abstract version: string;
  abstract description: string;
  abstract rollbackable: boolean;
  logger?: any; // Logger instance for capturing migration output

  abstract up(context: MigrationContext): Promise<MigrationResult>;

  async down?(_context: MigrationContext): Promise<MigrationRollbackResult> {
    if (!this.rollbackable) {
      throw new Error(`Migration ${this.name} is not rollbackable`);
    }
    throw new Error(`Rollback not implemented for migration ${this.name}`);
  }

  async verify?(): Promise<boolean> {
    return true;
  }
}

export interface MigrationRecord {
  id: string;
  name: string;
  version: string;
  description: string;
  status: MigrationStatus;
  executedAt?: Date;
  executedBy?: string;
  environment: string;
  errorMessage?: string;
  metadata?: any;
  rollbackable: boolean;
  rolledBackAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
