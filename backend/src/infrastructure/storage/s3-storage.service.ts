import { Injectable, Logger } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuid } from 'uuid';

@Injectable()
export class S3StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly serverName: string;

  constructor() {
    this.s3Client = new S3Client({
      endpoint: process.env.DO_SPACES_ENDPOINT,
      region: process.env.DO_SPACES_REGION || 'sgp1',
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
      },
    });

    this.bucketName = process.env.DO_SPACES_BUCKET;
    this.serverName = process.env.SERVER_NAME || 'default';

    if (!this.bucketName) {
      throw new Error('DO_SPACES_BUCKET environment variable is required');
    }
  }

  /**
   * Upload a buffer to S3 and return the public URL
   */
  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string,
    isPublic = true,
  ): Promise<string> {
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ACL: isPublic ? 'public-read' : 'private',
          ContentType: contentType,
        },
      });

      const result = await upload.done();
      const url = result.Location!;

      this.logger.debug(`Uploaded to S3: ${key} (${buffer.length} bytes)`);
      return url;
    } catch (error) {
      this.logger.error(`Failed to upload ${key} to S3: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a unique S3 key for a media file variant
   */
  generateMediaKey(fileId: number, variant: string, format: string): string {
    return `${this.serverName}/media/${fileId}/${variant}/${uuid()}.${format}`;
  }

  /**
   * Generate a unique S3 key for an original file
   */
  generateOriginalKey(fileId: number, originalName: string): string {
    const extension = originalName.split('.').pop();
    return `${this.serverName}/media/${fileId}/original/${uuid()}.${extension}`;
  }

  /**
   * Generate S3 key for optimized original
   */
  generateOptimizedKey(fileId: number, format: string): string {
    return `${this.serverName}/media/${fileId}/optimized.${format}`;
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      this.logger.debug(`Deleted from S3: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete ${key} from S3: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get the content type for a given format
   */
  getContentType(format: string): string {
    switch (format.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'avif':
        return 'image/avif';
      case 'gif':
        return 'image/gif';
      case 'svg':
        return 'image/svg+xml';
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      default:
        return 'application/octet-stream';
    }
  }
}
