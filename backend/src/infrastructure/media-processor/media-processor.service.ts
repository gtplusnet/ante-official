import { Injectable, Logger } from '@nestjs/common';
import {
  ImageProcessorService,
  ProcessedImages,
} from './image-processor.service';
import {
  VideoProcessorService,
  ProcessedVideo,
} from './video-processor.service';
import {
  DocumentProcessorService,
  ProcessedDocument,
} from './document-processor.service';

export interface MediaProcessingResult {
  type: 'image' | 'video' | 'document';
  success: boolean;
  data?: ProcessedImages | ProcessedVideo | ProcessedDocument;
  error?: string;
  estimatedTime: number;
  actualTime: number;
}

export interface MediaUploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class MediaProcessorService {
  private readonly logger = new Logger(MediaProcessorService.name);

  constructor(
    private readonly imageProcessor: ImageProcessorService,
    private readonly videoProcessor: VideoProcessorService,
    private readonly documentProcessor: DocumentProcessorService,
  ) {}

  /**
   * Main processing method that handles images, videos, and documents
   */
  async processMedia(file: MediaUploadFile): Promise<MediaProcessingResult> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Processing media file: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`,
      );

      let result: MediaProcessingResult;

      if (this.isImage(file.mimetype)) {
        const estimatedTime = this.imageProcessor.estimateProcessingTime(
          file.size,
        );
        const data = await this.imageProcessor.processImage(
          file.buffer,
          file.mimetype,
        );

        result = {
          type: 'image',
          success: true,
          data,
          estimatedTime,
          actualTime: (Date.now() - startTime) / 1000,
        };
      } else if (this.isVideo(file.mimetype)) {
        const estimatedTime = this.videoProcessor.estimateProcessingTime(
          file.size,
        );
        const data = await this.videoProcessor.processVideo(
          file.buffer,
          file.originalname,
          file.mimetype,
        );

        result = {
          type: 'video',
          success: true,
          data,
          estimatedTime,
          actualTime: (Date.now() - startTime) / 1000,
        };
      } else if (this.isDocument(file.mimetype)) {
        const estimatedTime = this.documentProcessor.estimateProcessingTime(
          file.size,
        );
        const data = await this.documentProcessor.processDocument(
          file.buffer,
          file.mimetype,
          file.originalname,
        );

        result = {
          type: 'document',
          success: true,
          data,
          estimatedTime,
          actualTime: (Date.now() - startTime) / 1000,
        };
      } else {
        throw new Error(`Unsupported media type: ${file.mimetype}`);
      }

      this.logger.log(
        `Successfully processed ${result.type} in ${result.actualTime.toFixed(2)}s ` +
          `(estimated: ${result.estimatedTime}s)`,
      );

      return result;
    } catch (error) {
      const actualTime = (Date.now() - startTime) / 1000;

      this.logger.error(
        `Failed to process media file: ${file.originalname}`,
        error,
      );

      return {
        type: this.isImage(file.mimetype)
          ? 'image'
          : this.isVideo(file.mimetype)
            ? 'video'
            : 'document',
        success: false,
        error: error.message || 'Unknown processing error',
        estimatedTime: 0,
        actualTime,
      };
    }
  }

  /**
   * Check if file should be processed as media (image, video, or document)
   */
  isMediaFile(mimetype: string): boolean {
    return (
      this.isImage(mimetype) ||
      this.isVideo(mimetype) ||
      this.isDocument(mimetype)
    );
  }

  /**
   * Check if file is an image
   */
  isImage(mimetype: string): boolean {
    return this.imageProcessor.isImageSupported(mimetype);
  }

  /**
   * Check if file is a video
   */
  isVideo(mimetype: string): boolean {
    return this.videoProcessor.isVideoSupported(mimetype);
  }

  /**
   * Check if file is a document
   */
  isDocument(mimetype: string): boolean {
    return this.documentProcessor.isDocumentSupported(mimetype);
  }

  /**
   * Get estimated processing time for a file
   */
  estimateProcessingTime(file: MediaUploadFile): number {
    if (this.isImage(file.mimetype)) {
      return this.imageProcessor.estimateProcessingTime(file.size);
    } else if (this.isVideo(file.mimetype)) {
      return this.videoProcessor.estimateProcessingTime(file.size);
    }
    return 0;
  }

  /**
   * Get supported MIME types
   */
  getSupportedMimeTypes(): { images: string[]; videos: string[] } {
    return {
      images: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/tiff',
        'image/avif',
        'image/bmp',
      ],
      videos: [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo', // AVI
        'video/x-ms-wmv', // WMV
        'video/webm',
        'video/ogg',
        'video/3gpp',
        'video/x-flv', // FLV
        'video/x-matroska', // MKV
      ],
    };
  }

  /**
   * Validate file before processing
   */
  validateMediaFile(file: MediaUploadFile): { valid: boolean; error?: string } {
    // Check file size (max 100MB for images, 500MB for videos)
    const maxImageSize = 100 * 1024 * 1024; // 100MB
    const maxVideoSize = 500 * 1024 * 1024; // 500MB

    if (this.isImage(file.mimetype) && file.size > maxImageSize) {
      return { valid: false, error: 'Image file too large (max 100MB)' };
    }

    if (this.isVideo(file.mimetype) && file.size > maxVideoSize) {
      return { valid: false, error: 'Video file too large (max 500MB)' };
    }

    // Check if supported
    if (!this.isMediaFile(file.mimetype)) {
      return { valid: false, error: `Unsupported file type: ${file.mimetype}` };
    }

    // Check minimum file size (1KB)
    if (file.size < 1024) {
      return { valid: false, error: 'File too small (minimum 1KB)' };
    }

    return { valid: true };
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    supportedImageFormats: number;
    supportedVideoFormats: number;
    imageVariants: number;
    videoResolutions: number;
  } {
    const mimeTypes = this.getSupportedMimeTypes();

    return {
      supportedImageFormats: mimeTypes.images.length,
      supportedVideoFormats: mimeTypes.videos.length,
      imageVariants: 8, // thumbnail, small, medium, large, xlarge, square, og, twitter
      videoResolutions: 4, // 360p, 480p, 720p, 1080p
    };
  }

  /**
   * Reprocess a file (stub for queue processor)
   */
  async reprocessFile(fileId: number): Promise<void> {
    this.logger.log(
      `Reprocessing file ${fileId} - this is handled by FileUploadService`,
    );
    // This method is called by the queue processor but actual logic is in FileUploadService
  }
}
