import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ManpowerQueueService, ManpowerComputeJob } from './manpower-queue.service';
import { EmployeeTimekeepingService } from '@modules/hr/timekeeping/employee-timekeeping/employee-timekeeping.service';
import { RecomputeTimekeepingDTO } from '@modules/hr/timekeeping/employee-timekeeping/employee-timekeeping.interface';
import { UtilityService } from '@common/utility.service';

@Injectable()
export class ManpowerQueueProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ManpowerQueueProcessorService.name);
  private isProcessing = false;
  private shouldStop = false;
  private processingInterval: NodeJS.Timeout;

  constructor(
    @Inject(ManpowerQueueService) private readonly queueService: ManpowerQueueService,
    private readonly moduleRef: ModuleRef,
    @Inject(UtilityService) private readonly utilityService: UtilityService,
    @Inject(EmployeeTimekeepingService) private readonly employeeTimekeepingService: EmployeeTimekeepingService,
  ) {}

  async onModuleInit() {
    this.logger.log('Manpower Queue Processor starting...');
    this.startProcessing();
  }

  async onModuleDestroy() {
    this.logger.log('Manpower Queue Processor stopping...');
    await this.stopProcessing();
  }

  /**
   * Start processing queue
   */
  private startProcessing() {
    // Process jobs continuously
    this.processQueue();

    // Also set up interval to ensure processing continues if it stops
    this.processingInterval = setInterval(() => {
      if (!this.isProcessing && !this.shouldStop) {
        this.logger.log('Restarting queue processing...');
        this.processQueue();
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Stop processing queue
   */
  private async stopProcessing(): Promise<void> {
    this.shouldStop = true;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Wait for current processing to complete
    const maxWait = 30000; // 30 seconds max wait
    const startTime = Date.now();

    while (this.isProcessing && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.isProcessing) {
      this.logger.warn('Force stopping queue processor after timeout');
    }
  }

  /**
   * Main queue processing loop
   */
  private async processQueue() {
    if (this.shouldStop) {
      return;
    }

    this.isProcessing = true;

    try {
      while (!this.shouldStop) {
        // Get next job from queue (blocking for 5 seconds)
        const job = await this.queueService.getNextJob(5);

        if (!job) {
          // No jobs available, continue waiting
          continue;
        }

        // Process the job
        await this.processJob(job);
      }
    } catch (error) {
      this.logger.error(`Queue processing error: ${error.message}`, error.stack);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: ManpowerComputeJob): Promise<void> {
    this.logger.log(`Processing job ${job.id} for employee ${job.employeeName} on ${job.date}`);

    try {
      // Prepare recompute DTO
      const recomputeDto: RecomputeTimekeepingDTO = {
        employeeAccountId: job.employeeId,
        date: job.date,
      };

      // Call recompute service
      this.logger.log(`Calling recompute for employee ${job.employeeId} on date ${job.date}`);
      await this.employeeTimekeepingService.recompute(recomputeDto);

      // Mark job as completed
      await this.queueService.markJobCompleted(job.id);

      this.logger.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(
        `Job ${job.id} failed: ${error.message}`,
        error.stack,
      );

      // Mark job as failed
      await this.queueService.markJobFailed(
        job.id,
        error.message || 'Unknown error during computation',
        error.stack,
      );
    }
  }

  /**
   * Get processor status
   */
  getStatus(): { isProcessing: boolean; shouldStop: boolean } {
    return {
      isProcessing: this.isProcessing,
      shouldStop: this.shouldStop,
    };
  }

  /**
   * Manually trigger processing (for testing)
   */
  async triggerProcessing(): Promise<void> {
    if (!this.isProcessing && !this.shouldStop) {
      this.logger.log('Manually triggering queue processing');
      this.processQueue();
    }
  }
}