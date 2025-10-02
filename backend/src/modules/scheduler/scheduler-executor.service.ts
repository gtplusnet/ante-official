import { Injectable, Logger, Inject } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { SchedulerMongoService } from './mongodb/scheduler-mongo.service';
import { SchedulerExecutionMongoService } from './mongodb/scheduler-execution-mongo.service';
import {
  SchedulerStatus,
  SchedulerLastStatus,
} from './mongodb/scheduler-mongo.schema';
import { ExecutionStatus } from './mongodb/scheduler-execution-mongo.schema';
import { SchedulerTask } from './scheduler.interface';
import { DatabaseCleanupTask } from './tasks/database-cleanup.task';
import { ReportGenerationTask } from './tasks/report-generation.task';
import { LogCleanupTask } from './tasks/log-cleanup.task';
import { TimekeepingDailyProcessingTask } from './tasks/timekeeping-daily-processing.task';
import { HrisAccountCheckTask } from './tasks/hris-account-check.task';
import { CutoffDateRangeGenerationTask } from './tasks/cutoff-date-range-generation.task';
import { UtilityService } from '@common/utility.service';
import * as cronParser from 'cron-parser';

@Injectable()
export class SchedulerExecutorService {
  private readonly logger = new Logger(SchedulerExecutorService.name);
  private taskMap: Map<string, SchedulerTask> = new Map();

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly schedulerMongoService: SchedulerMongoService,
    private readonly executionMongoService: SchedulerExecutionMongoService,
    @Inject() private readonly utilityService: UtilityService,
  ) {}

  async onModuleInit() {
    // Register available tasks
    await this.registerTask(DatabaseCleanupTask);
    await this.registerTask(ReportGenerationTask);
    await this.registerTask(LogCleanupTask);
    await this.registerTask(TimekeepingDailyProcessingTask);
    await this.registerTask(HrisAccountCheckTask);
    await this.registerTask(CutoffDateRangeGenerationTask);
  }

  private async registerTask(TaskClass: any): Promise<void> {
    try {
      const task = await this.moduleRef.get(TaskClass, { strict: false });
      this.taskMap.set(task.getName(), task);
      this.logger.log(`Registered task: ${task.getName()}`);
    } catch (error) {
      this.logger.error(
        `Failed to register task: ${TaskClass.name}`,
        error.stack,
      );
    }
  }

  async executeScheduler(schedulerId: string): Promise<void> {
    const scheduler = await this.schedulerMongoService.findById(schedulerId);

    if (!scheduler) {
      this.logger.error(`Scheduler not found: ${schedulerId}`);
      return;
    }

    if (!scheduler.isActive) {
      this.logger.warn(`Scheduler is not active: ${scheduler.name}`);
      return;
    }

    if (scheduler.status === SchedulerStatus.RUNNING) {
      this.logger.warn(`Scheduler is already running: ${scheduler.name}`);
      return;
    }

    // Create execution record
    const execution = await this.executionMongoService.create({
      schedulerId: scheduler.id,
      schedulerName: scheduler.name,
      status: ExecutionStatus.RUNNING,
      startedAt: new Date(),
    });

    // Update scheduler status
    await this.schedulerMongoService.updateStatus(
      schedulerId,
      SchedulerStatus.RUNNING,
    );

    try {
      this.logger.log(`Executing scheduler: ${scheduler.name}`);

      // IMPORTANT: Clear any user context from utility service
      // Schedulers should run without company restrictions
      this.utilityService.clearContext();

      const task = this.taskMap.get(scheduler.taskType);

      if (!task) {
        throw new Error(`Task type not found: ${scheduler.taskType}`);
      }

      // Execute the task
      const taskOutput = await task.execute(scheduler.taskConfig);

      // Update execution record with output
      await this.executionMongoService.completeExecution(
        execution.id,
        ExecutionStatus.SUCCESS,
        taskOutput || 'Task completed successfully',
      );

      // Update scheduler with last run info
      const nextRunTime = this.calculateNextRunTime(scheduler.cronExpression);
      await this.schedulerMongoService.updateLastRun(schedulerId, {
        lastRunAt: new Date(),
        lastStatus: SchedulerLastStatus.SUCCESS,
        lastDuration: Date.now() - execution.startedAt.getTime(),
        nextRunAt: nextRunTime,
      });

      this.logger.log(`Scheduler completed successfully: ${scheduler.name}`);
    } catch (error) {
      this.logger.error(
        `Scheduler execution failed: ${scheduler.name}`,
        error.stack,
      );

      // Update execution record with error
      await this.executionMongoService.completeExecution(
        execution.id,
        ExecutionStatus.FAILED,
        null,
        error.message,
      );

      // Update scheduler with failure info
      await this.schedulerMongoService.updateLastRun(schedulerId, {
        lastRunAt: new Date(),
        lastStatus: SchedulerLastStatus.FAILED,
        lastDuration: Date.now() - execution.startedAt.getTime(),
      });
    } finally {
      // Reset scheduler status to IDLE
      await this.schedulerMongoService.updateStatus(
        schedulerId,
        SchedulerStatus.IDLE,
      );
    }
  }

  private calculateNextRunTime(cronExpression: string): Date {
    try {
      const interval = cronParser.default.parse(cronExpression);
      return interval.next().toDate();
    } catch (error) {
      this.logger.error(
        `Failed to parse cron expression: ${cronExpression}`,
        error.stack,
      );
      // Return a date 1 hour from now as fallback
      const fallbackDate = new Date();
      fallbackDate.setHours(fallbackDate.getHours() + 1);
      return fallbackDate;
    }
  }

  getAvailableTasks(): Array<{ name: string; description: string }> {
    return Array.from(this.taskMap.values()).map((task) => ({
      name: task.getName(),
      description: task.getDescription(),
    }));
  }
}
