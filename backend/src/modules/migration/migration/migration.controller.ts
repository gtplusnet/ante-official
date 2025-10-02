import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  BadRequestException,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { MigrationService } from './migration.service';
import { Request } from 'express';

@Controller('migration')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  @Get('status')
  async getStatus(@Req() req: Request) {
    await this.checkDeveloperAccess(req);

    const migrations = await this.migrationService.getAllMigrations();
    const pending = await this.migrationService.getPendingMigrations();

    return {
      total: migrations.length + pending.length,
      executed: migrations.length,
      pending: pending.length,
      migrations: migrations.map((m) => ({
        name: m.name,
        status: m.status,
        executedAt: m.executedAt,
        environment: m.environment,
        errorMessage: m.errorMessage,
      })),
      pendingNames: pending,
    };
  }

  @Get('list')
  async listMigrations(@Req() req: Request) {
    await this.checkDeveloperAccess(req);

    return this.migrationService.getAllMigrations();
  }

  @Get('pending')
  async getPendingMigrations(@Req() req: Request) {
    await this.checkDeveloperAccess(req);

    return this.migrationService.getPendingMigrations();
  }

  @Post('run')
  async runMigrations(
    @Req() req: Request,
    @Query('dryRun') dryRun?: boolean,
    @Query('verbose') verbose?: boolean,
  ) {
    await this.checkDeveloperAccess(req);

    return this.migrationService.runAllPendingMigrations({
      dryRun: dryRun || false,
      verbose: verbose || false,
      executedBy: 'developer-key',
    });
  }

  @Post('run/:name')
  async runOneMigration(
    @Req() req: Request,
    @Param('name') name: string,
    @Query('dryRun') dryRun?: boolean,
    @Query('verbose') verbose?: boolean,
  ) {
    await this.checkDeveloperAccess(req);

    if (!name) {
      throw new BadRequestException('Migration name is required');
    }

    return this.migrationService.runMigration(name, {
      dryRun: dryRun || false,
      verbose: verbose || false,
      executedBy: 'developer-key',
    });
  }

  @Post('verify/:name')
  async verifyMigration(@Req() req: Request, @Param('name') name: string) {
    await this.checkDeveloperAccess(req);

    if (!name) {
      throw new BadRequestException('Migration name is required');
    }

    const isValid = await this.migrationService.verifyMigration(name);

    return {
      name,
      verified: isValid,
      message: isValid
        ? 'Migration verified successfully'
        : 'Migration verification failed',
    };
  }

  @Post('rollback/:name')
  async rollbackMigration(@Req() req: Request, @Param('name') name: string) {
    await this.checkDeveloperAccess(req);

    if (!name) {
      throw new BadRequestException('Migration name is required');
    }

    return this.migrationService.rollbackMigration(name, {
      executedBy: 'developer-key',
    });
  }

  @Get('logs/:name')
  async getMigrationLogs(@Req() req: Request, @Param('name') name: string) {
    await this.checkDeveloperAccess(req);

    if (!name) {
      throw new BadRequestException('Migration name is required');
    }

    const logs = await this.migrationService.getMigrationLogs(name);

    return {
      migration: name,
      logFiles: logs.map((logPath) => ({
        path: logPath,
        filename: logPath.split('/').pop(),
        created: new Date(
          logPath.split('_').pop()?.replace('.log', '').replace(/-/g, ':') ||
            '',
        ),
      })),
      count: logs.length,
    };
  }

  @Get('logs/:name/latest')
  async getLatestLog(@Req() req: Request, @Param('name') name: string) {
    await this.checkDeveloperAccess(req);

    if (!name) {
      throw new BadRequestException('Migration name is required');
    }

    const logContent =
      await this.migrationService.getLatestLogForMigration(name);

    if (!logContent) {
      return {
        migration: name,
        content: null,
        message: 'No logs found for this migration',
      };
    }

    return {
      migration: name,
      content: logContent,
      lines: logContent.split('\n').length,
    };
  }

  @Get('logs/file/:filename')
  async getLogByFilename(
    @Req() req: Request,
    @Param('filename') filename: string,
  ) {
    await this.checkDeveloperAccess(req);

    if (!filename) {
      throw new BadRequestException('Filename is required');
    }

    // Security check: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/')) {
      throw new BadRequestException('Invalid filename');
    }

    const logPath = `${process.cwd()}/logs/migrations/${filename}`;
    const content = await this.migrationService.getLogContent(logPath);

    return {
      filename,
      content,
      lines: content.split('\n').length,
    };
  }

  private async checkDeveloperAccess(req: Request) {
    const devKey = req.headers['developer-key'] as string;

    if (!devKey || devKey !== process.env.DEVELOPER_KEY) {
      throw new ForbiddenException('Invalid developer key');
    }
  }
}
