import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { MigrationService } from '../migration/migration.service';
import { Table } from 'console-table-printer';

interface MigrationCommandOptions {
  dryRun?: boolean;
  verbose?: boolean;
  name?: string;
  batchSize?: number;
}

@Injectable()
@Command({
  name: 'migration',
  description: 'System migration management',
})
export class MigrationCommand extends CommandRunner {
  constructor(private readonly migrationService: MigrationService) {
    super();
  }

  async run(
    passedParams: string[],
    options?: MigrationCommandOptions,
  ): Promise<void> {
    const subCommand = passedParams[0];

    switch (subCommand) {
      case 'run':
        await this.runMigrations(options);
        break;
      case 'run:one':
        await this.runOneMigration(passedParams[1], options);
        break;
      case 'status':
        await this.showStatus();
        break;
      case 'list':
        await this.listMigrations();
        break;
      case 'verify':
        await this.verifyMigrations(passedParams[1]);
        break;
      case 'dry-run':
        await this.dryRun(options);
        break;
      case 'rollback':
        await this.rollbackMigration(passedParams[1], options);
        break;
      default:
        console.log('Available commands:');
        console.log('  migration run         - Run all pending migrations');
        console.log('  migration run:one     - Run specific migration');
        console.log('  migration status      - Check migration status');
        console.log('  migration list        - List all available migrations');
        console.log('  migration verify      - Verify migrations succeeded');
        console.log('  migration dry-run     - Test without executing');
        console.log(
          '  migration rollback    - Rollback a migration if supported',
        );
    }
  }

  @Option({
    flags: '-d, --dry-run',
    description: 'Run in dry-run mode (no changes will be made)',
  })
  parseDryRun(val: string): boolean {
    return val === 'true';
  }

  @Option({
    flags: '-v, --verbose',
    description: 'Enable verbose logging',
  })
  parseVerbose(val: string): boolean {
    return val === 'true';
  }

  @Option({
    flags: '-b, --batch-size <size>',
    description: 'Batch size for processing',
  })
  parseBatchSize(val: string): number {
    return parseInt(val, 10);
  }

  private async runMigrations(
    options?: MigrationCommandOptions,
  ): Promise<void> {
    console.log('Running all pending migrations...\n');

    const result = await this.migrationService.runAllPendingMigrations({
      dryRun: options?.dryRun || false,
      verbose: options?.verbose || false,
      batchSize: options?.batchSize || 100,
      executedBy: 'cli',
    });

    if (result.success) {
      console.log(`\n✅ All migrations completed successfully`);
      console.log(`Migrations run: ${result.migrations.length}`);
    } else {
      console.error(`\n❌ Some migrations failed`);
      const failed = result.migrations.filter((m) => !m.success);
      failed.forEach((m) => {
        console.error(`  - ${m.migration.name}: ${m.error}`);
      });
      process.exit(1);
    }
  }

  private async runOneMigration(
    name: string,
    options?: MigrationCommandOptions,
  ): Promise<void> {
    if (!name) {
      console.error('Migration name is required');
      process.exit(1);
    }

    console.log(`Running migration: ${name}\n`);

    const result = await this.migrationService.runMigration(name, {
      dryRun: options?.dryRun || false,
      verbose: options?.verbose || true,
      batchSize: options?.batchSize || 100,
      executedBy: 'cli',
    });

    if (result.success) {
      console.log(`\n✅ Migration ${name} completed successfully`);
    } else {
      console.error(`\n❌ Migration ${name} failed: ${result.error}`);
      process.exit(1);
    }
  }

  private async showStatus(): Promise<void> {
    const migrations = await this.migrationService.getAllMigrations();

    if (migrations.length === 0) {
      console.log('No migrations have been executed yet');
      return;
    }

    const table = new Table({
      columns: [
        { name: 'name', title: 'Migration Name', alignment: 'left' },
        { name: 'status', title: 'Status', alignment: 'center' },
        { name: 'executedAt', title: 'Executed At', alignment: 'left' },
        { name: 'environment', title: 'Environment', alignment: 'center' },
      ],
    });

    migrations.forEach((migration) => {
      table.addRow({
        name: migration.name,
        status: this.getStatusEmoji(migration.status) + ' ' + migration.status,
        executedAt: migration.executedAt
          ? new Date(migration.executedAt).toLocaleString()
          : '-',
        environment: migration.environment,
      });
    });

    console.log('\nMigration Status:\n');
    table.printTable();
  }

  private async listMigrations(): Promise<void> {
    const pending = await this.migrationService.getPendingMigrations();
    const executed = await this.migrationService.getAllMigrations();

    console.log('\n📋 Available Migrations:\n');

    const table = new Table({
      columns: [
        { name: 'name', title: 'Migration Name', alignment: 'left' },
        { name: 'status', title: 'Status', alignment: 'center' },
        { name: 'description', title: 'Description', alignment: 'left' },
      ],
    });

    // Add executed migrations
    executed.forEach((migration) => {
      table.addRow({
        name: migration.name,
        status: this.getStatusEmoji(migration.status) + ' ' + migration.status,
        description: migration.description,
      });
    });

    // Add pending migrations
    pending.forEach((name) => {
      table.addRow({
        name,
        status: '⏳ PENDING',
        description: 'Not yet executed',
      });
    });

    table.printTable();

    console.log(
      `\nTotal: ${executed.length} executed, ${pending.length} pending`,
    );
  }

  private async verifyMigrations(name?: string): Promise<void> {
    if (name) {
      console.log(`Verifying migration: ${name}\n`);
      const isValid = await this.migrationService.verifyMigration(name);

      if (isValid) {
        console.log(`✅ Migration ${name} verification passed`);
      } else {
        console.error(`❌ Migration ${name} verification failed`);
        process.exit(1);
      }
    } else {
      console.log('Verifying all completed migrations...\n');
      const migrations = await this.migrationService.getAllMigrations();
      const completed = migrations.filter((m) => m.status === 'COMPLETED');

      let allValid = true;
      for (const migration of completed) {
        const isValid = await this.migrationService.verifyMigration(
          migration.name,
        );
        if (isValid) {
          console.log(`✅ ${migration.name}: Verified`);
        } else {
          console.error(`❌ ${migration.name}: Verification failed`);
          allValid = false;
        }
      }

      if (!allValid) {
        process.exit(1);
      }
    }
  }

  private async dryRun(options?: MigrationCommandOptions): Promise<void> {
    console.log('🔍 Running migrations in DRY RUN mode...\n');
    console.log('No changes will be made to the database.\n');

    const result = await this.migrationService.runAllPendingMigrations({
      dryRun: true,
      verbose: options?.verbose || true,
      batchSize: options?.batchSize || 100,
      executedBy: 'cli-dry-run',
    });

    console.log('\n🔍 DRY RUN completed');
    console.log(`Would execute ${result.migrations.length} migrations`);
  }

  private async rollbackMigration(
    name: string,
    options?: MigrationCommandOptions,
  ): Promise<void> {
    if (!name) {
      console.error('Migration name is required for rollback');
      process.exit(1);
    }

    console.log(`⚠️  Rolling back migration: ${name}\n`);
    console.log(
      'This action may result in data loss. Please ensure you have a backup.\n',
    );

    const result = await this.migrationService.rollbackMigration(name, {
      dryRun: options?.dryRun || false,
      verbose: options?.verbose || true,
      executedBy: 'cli-rollback',
    });

    if (result.success) {
      console.log(`\n✅ Migration ${name} rolled back successfully`);
    } else {
      console.error(`\n❌ Rollback failed: ${result.error}`);
      process.exit(1);
    }
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return '✅';
      case 'FAILED':
        return '❌';
      case 'RUNNING':
        return '🔄';
      case 'ROLLED_BACK':
        return '↩️';
      case 'SKIPPED':
        return '⏭️';
      case 'PENDING':
        return '⏳';
      default:
        return '❓';
    }
  }
}
