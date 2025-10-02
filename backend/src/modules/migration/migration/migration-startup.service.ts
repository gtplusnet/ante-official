import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MigrationService } from './migration.service';

@Injectable()
export class MigrationStartupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MigrationStartupService.name);
  private readonly runOnStartup: boolean;
  private readonly autoMigrate: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly migrationService: MigrationService,
  ) {
    this.runOnStartup =
      this.configService.get<string>('RUN_MIGRATIONS_ON_STARTUP') === 'true';
    this.autoMigrate =
      this.configService.get<string>('AUTO_MIGRATE') === 'true';
  }

  async onApplicationBootstrap() {
    if (!this.runOnStartup) {
      this.logger.log('Migration on startup is disabled');
      return;
    }

    this.logger.log('Checking for pending migrations...');

    try {
      const pendingMigrations =
        await this.migrationService.getPendingMigrations();

      if (pendingMigrations.length === 0) {
        this.logger.log('No pending migrations found');
        return;
      }

      this.logger.log(`Found ${pendingMigrations.length} pending migrations`);
      pendingMigrations.forEach((name) => {
        this.logger.log(`  - ${name}`);
      });

      if (!this.autoMigrate) {
        this.logger.warn(
          'AUTO_MIGRATE is disabled. Migrations will not run automatically.',
        );
        this.logger.warn('To run migrations, use: npm run migration:run');
        return;
      }

      this.logger.log('Running migrations automatically...');

      const result = await this.migrationService.runAllPendingMigrations({
        executedBy: 'startup-service',
        verbose: true,
      });

      if (result.success) {
        this.logger.log('All migrations completed successfully');
      } else {
        this.logger.error('Some migrations failed during startup');
        // Note: We don't throw here to prevent the app from crashing
        // The app should still work with legacy auth until migrations are run
      }
    } catch (error) {
      this.logger.error('Error checking/running migrations:', error);
      // Don't crash the app on migration errors
    }
  }
}
