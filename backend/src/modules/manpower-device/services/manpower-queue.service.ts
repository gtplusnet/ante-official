import { Injectable, Inject, Logger } from '@nestjs/common';
import { RedisService } from '@infrastructure/redis/redis.service';
import { QueueRedisService } from '@infrastructure/redis/queue-redis.service';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';

export interface ManpowerComputeJob {
  id: string;
  employeeId: string;
  employeeName: string;
  deviceId: string;
  deviceName: string;
  date: string;
  timestamp: Date;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  errorStack?: string;
  completedAt?: Date;
  processingStartedAt?: Date;
  processingTime?: number; // in milliseconds
  createdAt: Date;
}

export interface QueueStats {
  totalToday: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  avgProcessingTime: number;
  successRate: number;
  lastProcessedAt?: Date;
}

@Injectable()
export class ManpowerQueueService {
  private readonly logger = new Logger(ManpowerQueueService.name);
  private readonly QUEUE_KEY = 'manpower:compute:queue';
  private readonly PROCESSING_KEY = 'manpower:compute:processing';
  private readonly COMPLETED_KEY_PREFIX = 'manpower:compute:completed';
  private readonly FAILED_KEY = 'manpower:compute:failed';
  private readonly JOB_KEY_PREFIX = 'manpower:compute:job';
  private readonly STATS_KEY_PREFIX = 'manpower:compute:stats';
  private readonly TTL_24_HOURS = 86400; // 24 hours in seconds
  private readonly TTL_7_DAYS = 604800; // 7 days in seconds

  constructor(
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(QueueRedisService) private readonly queueRedisService: QueueRedisService,
  ) {}

  /**
   * Add a new job to the queue
   */
  async addJob(params: {
    employeeId: string;
    employeeName: string;
    deviceId: string;
    deviceName: string;
    date: string;
  }): Promise<ManpowerComputeJob> {
    const job: ManpowerComputeJob = {
      id: uuidv4(),
      ...params,
      timestamp: new Date(),
      attempts: 0,
      maxAttempts: 3,
      status: 'pending',
      createdAt: new Date(),
    };

    try {
      // Store job details in hash
      const jobKey = `${this.JOB_KEY_PREFIX}:${job.id}`;
      await this.redisService.hsetMultiple(jobKey, this.serializeJob(job));

      // Set TTL for job details (24 hours)
      await this.redisService.expire(jobKey, this.TTL_24_HOURS);

      // Add job ID to queue
      await this.redisService.lpush(this.QUEUE_KEY, job.id);

      // Update daily stats
      const statsKey = this.getStatsKey(job.date);
      await this.redisService.hincrby(statsKey, 'totalToday', 1);
      await this.redisService.hincrby(statsKey, 'pending', 1);
      await this.redisService.expire(statsKey, this.TTL_7_DAYS);

      this.logger.log(`Job ${job.id} added to queue for employee ${job.employeeName} on ${job.date}`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to add job to queue: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get next job from queue (for processor)
   */
  async getNextJob(timeout = 5): Promise<ManpowerComputeJob | null> {
    try {
      // Blocking pop from queue using dedicated QueueRedisService
      // This prevents blocking operations from affecting cache operations
      const result = await this.queueRedisService.brpop(this.QUEUE_KEY, timeout);

      if (!result) {
        return null;
      }

      const jobId = result.element;
      const job = await this.getJob(jobId);

      if (!job) {
        this.logger.warn(`Job ${jobId} not found in storage`);
        return null;
      }

      // Move to processing queue
      await this.redisService.lpush(this.PROCESSING_KEY, jobId);

      // Update job status
      job.status = 'processing';
      job.processingStartedAt = new Date();
      await this.updateJob(job);

      // Update stats
      const statsKey = this.getStatsKey(job.date);
      await this.redisService.hincrby(statsKey, 'pending', -1);
      await this.redisService.hincrby(statsKey, 'processing', 1);

      this.logger.log(`Job ${job.id} picked for processing`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to get next job: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Mark job as completed
   */
  async markJobCompleted(jobId: string): Promise<void> {
    try {
      const job = await this.getJob(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Calculate processing time
      const processingTime = job.processingStartedAt
        ? new Date().getTime() - new Date(job.processingStartedAt).getTime()
        : 0;

      // Update job
      job.status = 'completed';
      job.completedAt = new Date();
      job.processingTime = processingTime;
      await this.updateJob(job);

      // Remove from processing queue
      await this.redisService.lrem(this.PROCESSING_KEY, 1, jobId);

      // Add to completed queue for the day
      const completedKey = `${this.COMPLETED_KEY_PREFIX}:${job.date}`;
      await this.redisService.lpush(completedKey, jobId);
      await this.redisService.expire(completedKey, this.TTL_24_HOURS);

      // Update stats
      const statsKey = this.getStatsKey(job.date);
      await this.redisService.hincrby(statsKey, 'processing', -1);
      await this.redisService.hincrby(statsKey, 'completed', 1);

      // Update average processing time
      if (processingTime > 0) {
        await this.redisService.hincrby(statsKey, 'totalProcessingTime', processingTime);
        await this.redisService.hset(statsKey, 'lastProcessedAt', new Date().toISOString());
      }

      this.logger.log(`Job ${jobId} completed in ${processingTime}ms`);
    } catch (error) {
      this.logger.error(`Failed to mark job as completed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mark job as failed
   */
  async markJobFailed(jobId: string, error: string, errorStack?: string): Promise<void> {
    try {
      const job = await this.getJob(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Remove from processing queue
      await this.redisService.lrem(this.PROCESSING_KEY, 1, jobId);

      job.attempts++;

      if (job.attempts < job.maxAttempts) {
        // Retry: put back in queue
        job.status = 'pending';
        await this.updateJob(job);
        await this.redisService.lpush(this.QUEUE_KEY, jobId);

        // Update stats
        const statsKey = this.getStatsKey(job.date);
        await this.redisService.hincrby(statsKey, 'processing', -1);
        await this.redisService.hincrby(statsKey, 'pending', 1);

        this.logger.log(`Job ${jobId} failed (attempt ${job.attempts}/${job.maxAttempts}), retrying...`);
      } else {
        // Max attempts reached, move to failed queue
        job.status = 'failed';
        job.error = error;
        job.errorStack = errorStack;
        job.completedAt = new Date();

        // Calculate processing time
        const processingTime = job.processingStartedAt
          ? new Date().getTime() - new Date(job.processingStartedAt).getTime()
          : 0;
        job.processingTime = processingTime;

        await this.updateJob(job);

        // Add to failed queue (no TTL - permanent until manual deletion)
        await this.redisService.lpush(this.FAILED_KEY, jobId);

        // Remove TTL from job details for failed jobs
        const jobKey = `${this.JOB_KEY_PREFIX}:${jobId}`;
        await this.redisService.expire(jobKey, -1); // Remove TTL

        // Update stats
        const statsKey = this.getStatsKey(job.date);
        await this.redisService.hincrby(statsKey, 'processing', -1);
        await this.redisService.hincrby(statsKey, 'failed', 1);

        this.logger.error(`Job ${jobId} failed permanently after ${job.attempts} attempts: ${error}`);
      }
    } catch (err) {
      this.logger.error(`Failed to mark job as failed: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Get job details
   */
  async getJob(jobId: string): Promise<ManpowerComputeJob | null> {
    try {
      const jobKey = `${this.JOB_KEY_PREFIX}:${jobId}`;
      const jobData = await this.redisService.hgetall(jobKey);

      if (!jobData || Object.keys(jobData).length === 0) {
        return null;
      }

      return this.deserializeJob(jobData);
    } catch (error) {
      this.logger.error(`Failed to get job ${jobId}: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Update job details
   */
  private async updateJob(job: ManpowerComputeJob): Promise<void> {
    const jobKey = `${this.JOB_KEY_PREFIX}:${job.id}`;
    await this.redisService.hsetMultiple(jobKey, this.serializeJob(job));
  }

  /**
   * Get queue statistics
   */
  async getStats(date?: string): Promise<QueueStats> {
    const targetDate = date || moment().format('YYYY-MM-DD');
    const statsKey = this.getStatsKey(targetDate);

    try {
      const stats = await this.redisService.hgetall(statsKey);

      const totalToday = parseInt(stats.totalToday || '0');
      const completed = parseInt(stats.completed || '0');
      const failed = parseInt(stats.failed || '0');
      const pending = await this.redisService.llen(this.QUEUE_KEY);
      const processing = await this.redisService.llen(this.PROCESSING_KEY);

      const totalProcessingTime = parseInt(stats.totalProcessingTime || '0');
      const avgProcessingTime = completed > 0 ? totalProcessingTime / completed : 0;

      const successRate = totalToday > 0 ? (completed / totalToday) * 100 : 0;

      return {
        totalToday,
        completed,
        failed,
        pending,
        processing,
        avgProcessingTime,
        successRate,
        lastProcessedAt: stats.lastProcessedAt ? new Date(stats.lastProcessedAt) : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error.message}`, error.stack);
      return {
        totalToday: 0,
        completed: 0,
        failed: 0,
        pending: 0,
        processing: 0,
        avgProcessingTime: 0,
        successRate: 0,
      };
    }
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(
    status: 'pending' | 'processing' | 'completed' | 'failed',
    date?: string,
    limit = 100,
  ): Promise<ManpowerComputeJob[]> {
    try {
      let jobIds: string[] = [];

      switch (status) {
        case 'pending':
          jobIds = await this.redisService.lrange(this.QUEUE_KEY, 0, limit - 1);
          break;
        case 'processing':
          jobIds = await this.redisService.lrange(this.PROCESSING_KEY, 0, limit - 1);
          break;
        case 'completed':
          const targetDate = date || moment().format('YYYY-MM-DD');
          const completedKey = `${this.COMPLETED_KEY_PREFIX}:${targetDate}`;
          jobIds = await this.redisService.lrange(completedKey, 0, limit - 1);
          break;
        case 'failed':
          jobIds = await this.redisService.lrange(this.FAILED_KEY, 0, limit - 1);
          break;
      }

      const jobs = await Promise.all(
        jobIds.map(id => this.getJob(id))
      );

      return jobs.filter(job => job !== null) as ManpowerComputeJob[];
    } catch (error) {
      this.logger.error(`Failed to get jobs by status: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Delete a failed job
   */
  async deleteFailedJob(jobId: string): Promise<boolean> {
    try {
      // Remove from failed queue
      const removed = await this.redisService.lrem(this.FAILED_KEY, 1, jobId);

      if (removed > 0) {
        // Delete job details
        const jobKey = `${this.JOB_KEY_PREFIX}:${jobId}`;
        await this.redisService.del(jobKey);

        this.logger.log(`Failed job ${jobId} deleted`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to delete job ${jobId}: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Retry a failed job
   */
  async retryFailedJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.getJob(jobId);
      if (!job || job.status !== 'failed') {
        return false;
      }

      // Remove from failed queue
      await this.redisService.lrem(this.FAILED_KEY, 1, jobId);

      // Reset job
      job.status = 'pending';
      job.attempts = 0;
      job.error = undefined;
      job.errorStack = undefined;
      job.completedAt = undefined;
      job.processingStartedAt = undefined;
      job.processingTime = undefined;

      await this.updateJob(job);

      // Add back to pending queue
      await this.redisService.lpush(this.QUEUE_KEY, jobId);

      // Update stats
      const statsKey = this.getStatsKey(job.date);
      await this.redisService.hincrby(statsKey, 'failed', -1);
      await this.redisService.hincrby(statsKey, 'pending', 1);

      this.logger.log(`Failed job ${jobId} queued for retry`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to retry job ${jobId}: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Clear all failed jobs
   */
  async clearAllFailedJobs(): Promise<number> {
    try {
      const failedJobIds = await this.redisService.lrange(this.FAILED_KEY, 0, -1);

      // Delete all job details
      await Promise.all(
        failedJobIds.map(jobId => {
          const jobKey = `${this.JOB_KEY_PREFIX}:${jobId}`;
          return this.redisService.del(jobKey);
        })
      );

      // Clear the failed queue
      await this.redisService.del(this.FAILED_KEY);

      this.logger.log(`Cleared ${failedJobIds.length} failed jobs`);
      return failedJobIds.length;
    } catch (error) {
      this.logger.error(`Failed to clear failed jobs: ${error.message}`, error.stack);
      return 0;
    }
  }

  /**
   * Get queue position for a job
   */
  async getQueuePosition(jobId: string): Promise<number> {
    try {
      const queueJobs = await this.redisService.lrange(this.QUEUE_KEY, 0, -1);
      const position = queueJobs.findIndex(id => id === jobId);
      return position + 1; // 1-based position, 0 if not found
    } catch (error) {
      this.logger.error(`Failed to get queue position: ${error.message}`, error.stack);
      return 0;
    }
  }

  private getStatsKey(date: string): string {
    return `${this.STATS_KEY_PREFIX}:${date}`;
  }

  private serializeJob(job: ManpowerComputeJob): Record<string, string> {
    const serialized: Record<string, string> = {};

    Object.keys(job).forEach(key => {
      const value = job[key];
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          serialized[key] = value.toISOString();
        } else if (typeof value === 'object') {
          serialized[key] = JSON.stringify(value);
        } else {
          serialized[key] = String(value);
        }
      }
    });

    return serialized;
  }

  private deserializeJob(data: Record<string, string>): ManpowerComputeJob {
    return {
      id: data.id,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      deviceId: data.deviceId,
      deviceName: data.deviceName,
      date: data.date,
      timestamp: new Date(data.timestamp),
      attempts: parseInt(data.attempts || '0'),
      maxAttempts: parseInt(data.maxAttempts || '3'),
      status: data.status as any,
      error: data.error,
      errorStack: data.errorStack,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      processingStartedAt: data.processingStartedAt ? new Date(data.processingStartedAt) : undefined,
      processingTime: data.processingTime ? parseInt(data.processingTime) : undefined,
      createdAt: new Date(data.createdAt),
    };
  }
}