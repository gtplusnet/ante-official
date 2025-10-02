import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as fs from 'fs/promises';
import { PrismaService } from '@common/prisma.service';
import { MediaProcessorService } from '../../media-processor/media-processor.service';
import { ImageProcessorService } from '../../media-processor/image-processor.service';
import { VideoProcessorService } from '../../media-processor/video-processor.service';
import { S3StorageService } from '../../storage/s3-storage.service';
import type {
  MediaProcessingJobData,
  VideoTranscodingJobData,
} from '../services/queue.service';
import { ProcessingStatus } from '@prisma/client';

@Processor('media-processing', { concurrency: 2 })
export class MediaProcessorQueue extends WorkerHost {
  private readonly logger = new Logger(MediaProcessorQueue.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mediaProcessorService: MediaProcessorService,
    private readonly imageProcessorService: ImageProcessorService,
    private readonly videoProcessorService: VideoProcessorService,
    private readonly s3StorageService: S3StorageService,
  ) {
    super();
  }

  async process(job: Job<MediaProcessingJobData>): Promise<any> {
    const { fileId, filePath, mimetype, options } = job.data;

    this.logger.log(`Processing media file ${fileId}: ${filePath}`);

    try {
      // Update file status to PROCESSING
      await this.prismaService.files.update({
        where: { id: fileId },
        data: { processingStatus: ProcessingStatus.PROCESSING },
      });

      let result;

      if (mimetype.startsWith('image/')) {
        result = await this.processImage(job);
      } else if (mimetype.startsWith('video/')) {
        result = await this.processVideo(job);
      } else {
        throw new Error(`Unsupported media type: ${mimetype}`);
      }

      // Update file status to COMPLETED with results
      await this.prismaService.files.update({
        where: { id: fileId },
        data: {
          processingStatus: ProcessingStatus.COMPLETED,
          url: result.primaryUrl || null, // Set main URL to primary variant
          variants: result.variants || null,
          blurPlaceholder: result.blurPlaceholder || null,
          dominantColor: result.dominantColor || null,
          width: result.width || null,
          height: result.height || null,
          duration: result.duration || null,
        },
      });

      this.logger.log(`Successfully processed media file ${fileId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process media file ${fileId}: ${error.message}`,
      );

      // Update file status to FAILED
      await this.prismaService.files.update({
        where: { id: fileId },
        data: {
          processingStatus: ProcessingStatus.FAILED,
          processingError: error.message,
        },
      });

      throw error;
    }
  }

  private async processImage(job: Job<MediaProcessingJobData>) {
    const { fileId, filePath, options } = job.data;

    // Update job progress
    await job.updateProgress(10);

    // Read the file from disk
    const fileBuffer = await fs.readFile(filePath);

    // Generate image variants
    const variants = await this.imageProcessorService.processImage(
      fileBuffer,
      job.data.mimetype,
    );

    await job.updateProgress(40);

    // Upload all variants to S3 and get URLs
    const uploadedVariants = await this.uploadVariantsToS3(
      variants.variants,
      fileId,
    );

    await job.updateProgress(80);

    // Get image dimensions from the original or largest variant
    const dimensions =
      await this.imageProcessorService.getImageDimensions(filePath);

    // Select primary variant URL for main url field
    const primaryUrl = this.selectPrimaryVariantUrl(uploadedVariants);

    await job.updateProgress(100);

    return {
      variants: uploadedVariants,
      blurPlaceholder: variants.blurPlaceholder,
      dominantColor: variants.dominantColor,
      width: dimensions.width,
      height: dimensions.height,
      primaryUrl, // Include primary URL for main url field
    };
  }

  private async processVideo(job: Job<MediaProcessingJobData>) {
    const { fileId, filePath, options } = job.data;

    // Update job progress
    await job.updateProgress(10);

    // Get video metadata first
    const metadata =
      await this.videoProcessorService.getVideoMetadata(filePath);

    await job.updateProgress(30);

    // Generate video variants and thumbnails
    const variants = await this.videoProcessorService.processVideo(filePath, {
      generateThumbnails: options.generateThumbnails !== false,
      generateVariants: options.generateVariants !== false,
      resolutions: ['360p', '480p', '720p', '1080p'],
      generateHLS: true,
    });

    await job.updateProgress(90);

    // Generate blur placeholder from thumbnail if available
    const blurPlaceholder: string | null = null;
    const dominantColor: string | null = null;

    if (variants.thumbnail) {
      // For now, skip blur placeholder generation from video thumbnails
      // This would require downloading the thumbnail file and processing it
      this.logger.log(
        'Skipping blur placeholder generation for video thumbnail',
      );
    }

    await job.updateProgress(100);

    return {
      variants: variants.variants,
      blurPlaceholder,
      dominantColor,
      width: metadata.width,
      height: metadata.height,
      duration: metadata.duration,
    };
  }

  /**
   * Select the best variant URL to use as the primary URL
   */
  private selectPrimaryVariantUrl(
    variants: Record<string, any>,
  ): string | null {
    // Priority order for variant sizes
    const sizePreference = [
      'medium',
      'small',
      'large',
      'thumbnail',
      'xlarge',
      'square',
      'og',
      'twitter',
    ];

    // Priority order for formats (jpg is most compatible)
    const formatPreference = ['jpg', 'jpeg', 'webp', 'avif', 'png'];

    for (const size of sizePreference) {
      if (variants[size]) {
        for (const format of formatPreference) {
          if (variants[size][format] && variants[size][format].url) {
            this.logger.debug(
              `Selected primary URL: ${size}:${format} - ${variants[size][format].url}`,
            );
            return variants[size][format].url;
          }
        }
      }
    }

    // If no preferred variants found, try any available variant
    for (const [size, formats] of Object.entries(variants)) {
      for (const [format, data] of Object.entries(formats)) {
        if (
          data &&
          typeof data === 'object' &&
          'url' in data &&
          data.url &&
          typeof data.url === 'string'
        ) {
          this.logger.debug(
            `Fallback primary URL: ${size}:${format} - ${data.url}`,
          );
          return data.url;
        }
      }
    }

    this.logger.warn('No suitable primary variant URL found');
    return null;
  }

  /**
   * Upload image variants to S3 and return URLs instead of buffers
   */
  private async uploadVariantsToS3(
    variants: Record<string, Record<string, any>>,
    fileId: number,
  ): Promise<Record<string, any>> {
    const uploadedVariants: Record<string, any> = {};

    try {
      // Process each variant size (thumbnail, small, medium, etc.)
      for (const [variantName, variantFormats] of Object.entries(variants)) {
        uploadedVariants[variantName] = {};

        // Process each format (jpg, webp, avif)
        for (const [format, variantData] of Object.entries(variantFormats)) {
          if (!variantData.buffer) {
            this.logger.warn(`No buffer found for ${variantName}:${format}`);
            continue;
          }

          // Generate S3 key and upload
          const key = this.s3StorageService.generateMediaKey(
            fileId,
            variantName,
            format,
          );
          const contentType = this.s3StorageService.getContentType(format);

          try {
            const url = await this.s3StorageService.uploadBuffer(
              variantData.buffer,
              key,
              contentType,
            );

            // Store only metadata and URL (no buffer)
            uploadedVariants[variantName][format] = {
              url,
              width: variantData.width,
              height: variantData.height,
              size: variantData.size,
              format: variantData.format || format,
            };

            this.logger.debug(
              `Uploaded ${variantName}:${format} to S3: ${url}`,
            );
          } catch (uploadError) {
            this.logger.error(
              `Failed to upload ${variantName}:${format}: ${uploadError.message}`,
            );
            // Continue with other variants even if one fails
          }
        }
      }

      return uploadedVariants;
    } catch (error) {
      this.logger.error(`Failed to upload variants to S3: ${error.message}`);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);

    // Only update database if this is the final failure (no more attempts left)
    const { fileId } = job.data;
    if (fileId && job.attemptsMade >= job.opts.attempts) {
      try {
        await this.prismaService.files.update({
          where: { id: fileId },
          data: {
            processingStatus: ProcessingStatus.FAILED,
            processingError:
              error.message || 'Processing failed after all retry attempts',
          },
        });
        this.logger.log(
          `Updated file ${fileId} status to FAILED in database after ${job.attemptsMade} attempts`,
        );
      } catch (dbError) {
        this.logger.error(
          `Failed to update file ${fileId} status in database: ${dbError.message}`,
        );
      }
    } else if (fileId) {
      this.logger.log(
        `Job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts}), will retry`,
      );
    }
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number) {
    this.logger.debug(`Job ${job.id} progress: ${progress}%`);
  }
}

@Processor('media-optimization', { concurrency: 1 })
export class MediaOptimizationQueue extends WorkerHost {
  private readonly logger = new Logger(MediaOptimizationQueue.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mediaProcessorService: MediaProcessorService,
  ) {
    super();
  }

  async process(
    job: Job<{ fileIds: number[]; companyId?: number }>,
  ): Promise<any> {
    const { fileIds, companyId } = job.data;

    this.logger.log(
      `Batch optimizing ${fileIds.length} files for company ${companyId}`,
    );

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as Array<{ fileId: number; error: string }>,
    };

    for (let i = 0; i < fileIds.length; i++) {
      const fileId = fileIds[i];

      try {
        // Get file information
        const file = await this.prismaService.files.findUnique({
          where: { id: fileId },
        });

        if (!file || file.processingStatus === ProcessingStatus.COMPLETED) {
          continue;
        }

        // Trigger reprocessing
        await this.mediaProcessorService.reprocessFile(fileId);
        results.processed++;
      } catch (error) {
        this.logger.error(
          `Failed to optimize file ${fileId}: ${error.message}`,
        );
        results.failed++;
        results.errors.push({ fileId, error: error.message });
      }

      // Update progress
      const progress = Math.round(((i + 1) / fileIds.length) * 100);
      await job.updateProgress(progress);
    }

    this.logger.log(
      `Batch optimization completed: ${results.processed} processed, ${results.failed} failed`,
    );
    return results;
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Batch optimization job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Batch optimization job ${job.id} failed: ${error.message}`,
    );
  }
}

@Processor('video-transcoding', { concurrency: 1 })
export class VideoTranscodingQueue extends WorkerHost {
  private readonly logger = new Logger(VideoTranscodingQueue.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly videoProcessorService: VideoProcessorService,
  ) {
    super();
  }

  async process(job: Job<VideoTranscodingJobData>): Promise<any> {
    const { fileId, filePath, options } = job.data;

    this.logger.log(`Transcoding video file ${fileId}: ${filePath}`);

    try {
      // Update file status to PROCESSING
      await this.prismaService.files.update({
        where: { id: fileId },
        data: { processingStatus: ProcessingStatus.PROCESSING },
      });

      // Process video with advanced options
      const result = await this.videoProcessorService.processVideo(filePath, {
        generateThumbnails: options.generateThumbnail !== false,
        generateVariants: true,
        resolutions: options.resolutions || ['360p', '480p', '720p', '1080p'],
        generateHLS: options.generateHLS !== false,
        generateDASH: options.generateDASH || false,
      });

      // Get video metadata
      const metadata = options.extractMetadata
        ? await this.videoProcessorService.getVideoMetadata(filePath)
        : null;

      // Update file with results
      await this.prismaService.files.update({
        where: { id: fileId },
        data: {
          processingStatus: ProcessingStatus.COMPLETED,
          variants: result.variants || null,
          width: metadata?.width || null,
          height: metadata?.height || null,
          duration: metadata?.duration || null,
        },
      });

      this.logger.log(`Successfully transcoded video file ${fileId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to transcode video file ${fileId}: ${error.message}`,
      );

      // Update file status to FAILED
      await this.prismaService.files.update({
        where: { id: fileId },
        data: {
          processingStatus: ProcessingStatus.FAILED,
          processingError: error.message,
        },
      });

      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Video transcoding job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    this.logger.error(
      `Video transcoding job ${job.id} failed: ${error.message}`,
    );

    // Only update database if this is the final failure (no more attempts left)
    const { fileId } = job.data;
    if (fileId && job.attemptsMade >= job.opts.attempts) {
      try {
        await this.prismaService.files.update({
          where: { id: fileId },
          data: {
            processingStatus: ProcessingStatus.FAILED,
            processingError:
              error.message ||
              'Video transcoding failed after all retry attempts',
          },
        });
        this.logger.log(
          `Updated file ${fileId} status to FAILED in database after ${job.attemptsMade} attempts`,
        );
      } catch (dbError) {
        this.logger.error(
          `Failed to update file ${fileId} status in database: ${dbError.message}`,
        );
      }
    } else if (fileId) {
      this.logger.log(
        `Video transcoding job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts}), will retry`,
      );
    }
  }
}

// Export all processors for the module
export const MediaQueueProcessor = [
  MediaProcessorQueue,
  MediaOptimizationQueue,
  VideoTranscodingQueue,
];
