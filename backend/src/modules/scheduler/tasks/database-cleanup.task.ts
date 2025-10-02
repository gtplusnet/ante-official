import { Injectable } from '@nestjs/common';
import { BaseTask } from './base.task';
import { PrismaService } from '@common/prisma.service';

@Injectable()
export class DatabaseCleanupTask extends BaseTask {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  getName(): string {
    return 'database-cleanup';
  }

  getDescription(): string {
    return 'Cleans up old and unnecessary data from the database';
  }

  async execute(config: Record<string, any>): Promise<void> {
    const startTime = Date.now();
    await this.logStart();

    try {
      // Example: Clean up old queue logs
      const daysToKeep = config.queueLogDays || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deleteResult = await this.prisma.queueLogs.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`Deleted ${deleteResult.count} old queue logs`);

      // Add more cleanup operations as needed
      // For example: old notifications, temporary files, etc.

      const duration = Date.now() - startTime;
      await this.logComplete(duration);
    } catch (error) {
      await this.logError(error);
      throw error;
    }
  }
}
