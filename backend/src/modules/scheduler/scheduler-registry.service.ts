import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import * as cronParser from 'cron-parser';
import { SchedulerMongoService } from './mongodb/scheduler-mongo.service';
import { SchedulerExecutorService } from './scheduler-executor.service';

@Injectable()
export class SchedulerRegistryService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerRegistryService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly schedulerMongoService: SchedulerMongoService,
    private readonly schedulerExecutorService: SchedulerExecutorService,
  ) {}

  async onModuleInit() {
    await this.loadActiveSchedulers();
  }

  async loadActiveSchedulers(): Promise<void> {
    try {
      const activeSchedulers = await this.schedulerMongoService.findActive();

      for (const scheduler of activeSchedulers) {
        await this.registerScheduler(
          scheduler.id,
          scheduler.name,
          scheduler.cronExpression,
        );
      }

      this.logger.log(`Loaded ${activeSchedulers.length} active schedulers`);
    } catch (error) {
      this.logger.error('Failed to load active schedulers', error.stack);
    }
  }

  async registerScheduler(
    schedulerId: string,
    name: string,
    cronExpression: string,
  ): Promise<void> {
    try {
      // Remove existing job if it exists
      if (this.doesJobExist(name)) {
        this.deleteJob(name);
      }

      const job = new CronJob(cronExpression, async () => {
        await this.schedulerExecutorService.executeScheduler(schedulerId);
      });

      this.schedulerRegistry.addCronJob(name, job as any);
      job.start();

      // Calculate next run time
      const nextRunAt = this.getNextRunTime(cronExpression);
      await this.schedulerMongoService.update(schedulerId, { nextRunAt });

      this.logger.log(
        `Registered scheduler: ${name} with expression: ${cronExpression}`,
      );
    } catch (error) {
      this.logger.error(`Failed to register scheduler: ${name}`, error.stack);
      throw error;
    }
  }

  async updateScheduler(
    schedulerId: string,
    name: string,
    cronExpression: string,
  ): Promise<void> {
    await this.registerScheduler(schedulerId, name, cronExpression);
  }

  deleteJob(name: string): void {
    try {
      if (this.doesJobExist(name)) {
        const job = this.schedulerRegistry.getCronJob(name);
        job.stop();
        this.schedulerRegistry.deleteCronJob(name);
        this.logger.log(`Deleted scheduler job: ${name}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete scheduler job: ${name}`, error.stack);
    }
  }

  doesJobExist(name: string): boolean {
    try {
      this.schedulerRegistry.getCronJob(name);
      return true;
    } catch {
      return false;
    }
  }

  async runJobNow(schedulerId: string): Promise<void> {
    await this.schedulerExecutorService.executeScheduler(schedulerId);
  }

  getNextRunTime(cronExpression: string): Date {
    try {
      const interval = cronParser.default.parse(cronExpression);
      return interval.next().toDate();
    } catch (error) {
      this.logger.error(
        `Failed to parse cron expression: ${cronExpression}`,
        error.stack,
      );
      return new Date();
    }
  }

  getAllJobs(): string[] {
    const jobs = this.schedulerRegistry.getCronJobs();
    return Array.from(jobs.keys());
  }
}
