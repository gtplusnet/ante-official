import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface MediaProcessingJobData {
  fileId: number;
  filePath: string;
  originalName: string;
  mimetype: string;
  size: number;
  companyId?: number;
  options: {
    generateThumbnails?: boolean;
    generateBlurPlaceholder?: boolean;
    extractDominantColor?: boolean;
    generateVariants?: boolean;
    optimizeForWeb?: boolean;
  };
}

export interface VideoTranscodingJobData {
  fileId: number;
  filePath: string;
  originalName: string;
  outputPath: string;
  companyId?: number;
  options: {
    resolutions?: string[];
    generateHLS?: boolean;
    generateDASH?: boolean;
    generateThumbnail?: boolean;
    extractMetadata?: boolean;
  };
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('media-processing') private mediaProcessingQueue: Queue,
    @InjectQueue('media-optimization') private mediaOptimizationQueue: Queue,
    @InjectQueue('video-transcoding') private videoTranscodingQueue: Queue,
  ) {}

  // Add image processing job
  async addImageProcessingJob(
    data: MediaProcessingJobData,
    priority = 0,
  ): Promise<void> {
    try {
      await this.mediaProcessingQueue.add('process-image', data, {
        priority,
        delay: 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      this.logger.log(`Added image processing job for file ${data.fileId}`);
    } catch (error) {
      this.logger.error(`Failed to add image processing job: ${error.message}`);
      throw error;
    }
  }

  // Add video transcoding job
  async addVideoTranscodingJob(
    data: VideoTranscodingJobData,
    priority = 0,
  ): Promise<void> {
    try {
      await this.videoTranscodingQueue.add('transcode-video', data, {
        priority,
        delay: 0,
        attempts: 2, // Less attempts for video as it's more resource intensive
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      });

      this.logger.log(`Added video transcoding job for file ${data.fileId}`);
    } catch (error) {
      this.logger.error(
        `Failed to add video transcoding job: ${error.message}`,
      );
      throw error;
    }
  }

  // Add media optimization job (for bulk operations)
  async addMediaOptimizationJob(
    fileIds: number[],
    companyId?: number,
    priority = 0,
  ): Promise<void> {
    try {
      await this.mediaOptimizationQueue.add(
        'optimize-media-batch',
        {
          fileIds,
          companyId,
          timestamp: new Date().toISOString(),
        },
        {
          priority,
          delay: 0,
          attempts: 2,
        },
      );

      this.logger.log(
        `Added batch optimization job for ${fileIds.length} files`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to add batch optimization job: ${error.message}`,
      );
      throw error;
    }
  }

  // Get queue statistics
  async getQueueStats() {
    try {
      const [
        mediaProcessingStats,
        mediaOptimizationStats,
        videoTranscodingStats,
      ] = await Promise.all([
        this.getQueueCounts(this.mediaProcessingQueue),
        this.getQueueCounts(this.mediaOptimizationQueue),
        this.getQueueCounts(this.videoTranscodingQueue),
      ]);

      return {
        mediaProcessing: mediaProcessingStats,
        mediaOptimization: mediaOptimizationStats,
        videoTranscoding: videoTranscodingStats,
        totalActive:
          mediaProcessingStats.active +
          mediaOptimizationStats.active +
          videoTranscodingStats.active,
        totalWaiting:
          mediaProcessingStats.waiting +
          mediaOptimizationStats.waiting +
          videoTranscodingStats.waiting,
      };
    } catch (error) {
      this.logger.error(`Failed to get queue stats: ${error.message}`);
      throw error;
    }
  }

  // Get job status by ID
  async getJobStatus(queueName: string, jobId: string) {
    try {
      let queue: Queue;

      switch (queueName) {
        case 'media-processing':
          queue = this.mediaProcessingQueue;
          break;
        case 'media-optimization':
          queue = this.mediaOptimizationQueue;
          break;
        case 'video-transcoding':
          queue = this.videoTranscodingQueue;
          break;
        default:
          throw new Error(`Unknown queue: ${queueName}`);
      }

      const job = await queue.getJob(jobId);

      if (!job) {
        return null;
      }

      return {
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        returnvalue: job.returnvalue,
        attemptsMade: job.attemptsMade,
      };
    } catch (error) {
      this.logger.error(`Failed to get job status: ${error.message}`);
      throw error;
    }
  }

  // Retry failed jobs
  async retryFailedJobs(queueName: string, limit = 10): Promise<number> {
    try {
      let queue: Queue;

      switch (queueName) {
        case 'media-processing':
          queue = this.mediaProcessingQueue;
          break;
        case 'media-optimization':
          queue = this.mediaOptimizationQueue;
          break;
        case 'video-transcoding':
          queue = this.videoTranscodingQueue;
          break;
        default:
          throw new Error(`Unknown queue: ${queueName}`);
      }

      const failedJobs = await queue.getFailed(0, limit - 1);
      let retriedCount = 0;

      for (const job of failedJobs) {
        try {
          await job.retry();
          retriedCount++;
        } catch (error) {
          this.logger.warn(`Failed to retry job ${job.id}: ${error.message}`);
        }
      }

      this.logger.log(`Retried ${retriedCount} failed jobs from ${queueName}`);
      return retriedCount;
    } catch (error) {
      this.logger.error(`Failed to retry failed jobs: ${error.message}`);
      throw error;
    }
  }

  // Clean completed jobs
  async cleanCompletedJobs(
    queueName: string,
    olderThan = 86400000,
  ): Promise<number> {
    try {
      let queue: Queue;

      switch (queueName) {
        case 'media-processing':
          queue = this.mediaProcessingQueue;
          break;
        case 'media-optimization':
          queue = this.mediaOptimizationQueue;
          break;
        case 'video-transcoding':
          queue = this.videoTranscodingQueue;
          break;
        default:
          throw new Error(`Unknown queue: ${queueName}`);
      }

      const cleanedJobs = await queue.clean(olderThan, 100, 'completed');
      const cleanedCount = Array.isArray(cleanedJobs) ? cleanedJobs.length : 0;

      this.logger.log(
        `Cleaned ${cleanedCount} completed jobs from ${queueName}`,
      );
      return cleanedCount;
    } catch (error) {
      this.logger.error(`Failed to clean completed jobs: ${error.message}`);
      throw error;
    }
  }

  private async getQueueCounts(queue: Queue) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(0, 0),
      queue.getFailed(0, 0),
      queue.getDelayed(0, 0),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }
}
