import {
  Controller,
  Get,
  Delete,
  Post,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ManpowerQueueService, ManpowerComputeJob, QueueStats } from '../services/manpower-queue.service';
import { ManpowerQueueProcessorService } from '../services/manpower-queue-processor.service';
import { UtilityService } from '@common/utility.service';

@Controller('api/manpower-queue')
export class ManpowerQueueController {
  constructor(
    @Inject(ManpowerQueueService) private readonly queueService: ManpowerQueueService,
    @Inject(ManpowerQueueProcessorService) private readonly processorService: ManpowerQueueProcessorService,
    @Inject(UtilityService) private readonly utilityService: UtilityService,
  ) {}

  /**
   * Get queue statistics
   * GET /api/manpower-queue/stats
   */
  @Get('stats')
  async getStats(@Query('date') date?: string): Promise<QueueStats> {
    return this.queueService.getStats(date);
  }

  /**
   * Get jobs by status
   * GET /api/manpower-queue/jobs?status=pending|processing|completed|failed
   */
  @Get('jobs')
  async getJobs(
    @Query('status') status: 'pending' | 'processing' | 'completed' | 'failed',
    @Query('date') date?: string,
    @Query('limit') limit?: string,
  ): Promise<ManpowerComputeJob[]> {
    if (!status) {
      throw new BadRequestException('Status parameter is required');
    }

    const parsedLimit = limit ? parseInt(limit) : 100;
    return this.queueService.getJobsByStatus(status, date, parsedLimit);
  }

  /**
   * Get specific job details
   * GET /api/manpower-queue/job/:id
   */
  @Get('job/:id')
  async getJob(@Param('id') id: string): Promise<ManpowerComputeJob | null> {
    const job = await this.queueService.getJob(id);
    if (!job) {
      throw new BadRequestException('Job not found');
    }
    return job;
  }

  /**
   * Delete a failed job
   * DELETE /api/manpower-queue/failed/:id
   */
  @Delete('failed/:id')
  @HttpCode(HttpStatus.OK)
  async deleteFailedJob(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    const deleted = await this.queueService.deleteFailedJob(id);

    if (!deleted) {
      throw new BadRequestException('Failed job not found or could not be deleted');
    }

    return {
      success: true,
      message: `Failed job ${id} has been deleted`,
    };
  }

  /**
   * Retry a failed job
   * POST /api/manpower-queue/retry/:id
   */
  @Post('retry/:id')
  @HttpCode(HttpStatus.OK)
  async retryFailedJob(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    const retried = await this.queueService.retryFailedJob(id);

    if (!retried) {
      throw new BadRequestException('Failed job not found or could not be retried');
    }

    return {
      success: true,
      message: `Failed job ${id} has been queued for retry`,
    };
  }

  /**
   * Clear all failed jobs (requires confirmation)
   * DELETE /api/manpower-queue/failed/all
   */
  @Delete('failed/all')
  @HttpCode(HttpStatus.OK)
  async clearAllFailedJobs(
    @Query('confirm') confirm?: string,
  ): Promise<{ success: boolean; message: string; count: number }> {
    if (confirm !== 'yes') {
      throw new BadRequestException('Confirmation required. Add ?confirm=yes to the request');
    }

    const count = await this.queueService.clearAllFailedJobs();

    return {
      success: true,
      message: `Cleared ${count} failed jobs`,
      count,
    };
  }

  /**
   * Get processor status
   * GET /api/manpower-queue/processor/status
   */
  @Get('processor/status')
  async getProcessorStatus(): Promise<{
    isProcessing: boolean;
    shouldStop: boolean;
    healthy: boolean;
  }> {
    const status = this.processorService.getStatus();

    return {
      ...status,
      healthy: !status.shouldStop,
    };
  }

  /**
   * Manually trigger processing (for testing)
   * POST /api/manpower-queue/processor/trigger
   */
  @Post('processor/trigger')
  @HttpCode(HttpStatus.OK)
  async triggerProcessing(): Promise<{ success: boolean; message: string }> {
    await this.processorService.triggerProcessing();

    return {
      success: true,
      message: 'Queue processing has been triggered',
    };
  }

  /**
   * Get queue health summary
   * GET /api/manpower-queue/health
   */
  @Get('health')
  async getHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    stats: QueueStats;
    processor: any;
    recommendations?: string[];
  }> {
    const stats = await this.queueService.getStats();
    const processorStatus = this.processorService.getStatus();

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const recommendations: string[] = [];

    // Determine health status
    if (processorStatus.shouldStop || !processorStatus.isProcessing) {
      status = 'critical';
      recommendations.push('Queue processor is not running. Restart the service.');
    } else if (stats.failed > 10) {
      status = 'critical';
      recommendations.push(`High number of failed jobs (${stats.failed}). Check error logs.`);
    } else if (stats.pending > 50) {
      status = 'warning';
      recommendations.push(`Queue backlog is growing (${stats.pending} pending). Monitor processing rate.`);
    } else if (stats.successRate < 90 && stats.totalToday > 10) {
      status = 'warning';
      recommendations.push(`Low success rate (${stats.successRate.toFixed(1)}%). Investigate failures.`);
    }

    return {
      status,
      stats,
      processor: processorStatus,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  /**
   * Get failed jobs with error details
   * GET /api/manpower-queue/failed-details
   */
  @Get('failed-details')
  async getFailedJobsWithDetails(
    @Query('limit') limit?: string,
  ): Promise<{
    total: number;
    jobs: Array<{
      job: ManpowerComputeJob;
      canRetry: boolean;
      timeSinceFailed: string;
    }>;
  }> {
    const parsedLimit = limit ? parseInt(limit) : 50;
    const failedJobs = await this.queueService.getJobsByStatus('failed', undefined, parsedLimit);

    const jobsWithDetails = failedJobs.map(job => {
      const timeSinceFailed = job.completedAt
        ? this.getRelativeTime(new Date(job.completedAt))
        : 'Unknown';

      return {
        job,
        canRetry: true, // All failed jobs can be retried
        timeSinceFailed,
      };
    });

    return {
      total: failedJobs.length,
      jobs: jobsWithDetails,
    };
  }

  private getRelativeTime(date: Date): string {
    const now = Date.now();
    const diff = now - date.getTime();

    if (diff < 1000) return 'just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }
}