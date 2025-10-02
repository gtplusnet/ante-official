import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '@common/prisma.service';
import { MigrationService } from './migration/migration.service';
import { MigrationRegistry } from './migration/migration-registry.service';
import { MigrationCommand } from './cli/migration.cli';
import { MigrationController } from './migration/migration.controller';
import { MigrationStartupService } from './migration/migration-startup.service';

@Module({
  imports: [ConfigModule],
  providers: [
    PrismaService,
    MigrationService,
    MigrationRegistry,
    MigrationCommand,
    MigrationStartupService,
  ],
  controllers: [MigrationController],
  exports: [MigrationService],
})
export class MigrationModule {}
