import { Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import { MulterFile } from '../../../types/multer';

@Injectable()
export class UploadPhotoService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    // Check if DO Spaces configuration is available
    const hasDoSpacesConfig =
      process.env.DO_SPACES_ENDPOINT &&
      process.env.DO_SPACES_KEY &&
      process.env.DO_SPACES_SECRET &&
      process.env.DO_SPACES_BUCKET;

    if (hasDoSpacesConfig) {
      this.s3Client = new S3Client({
        endpoint: process.env.DO_SPACES_ENDPOINT,
        region: 'sgp1', // or your region
        credentials: {
          accessKeyId: process.env.DO_SPACES_KEY,
          secretAccessKey: process.env.DO_SPACES_SECRET,
        },
      });
      this.bucketName = process.env.DO_SPACES_BUCKET;
    } else {
      console.warn(
        'UploadPhotoService: Digital Ocean Spaces configuration not found. ' +
          'File upload functionality will be disabled. ' +
          'Set DO_SPACES_ENDPOINT, DO_SPACES_KEY, DO_SPACES_SECRET, and DO_SPACES_BUCKET to enable.',
      );
      this.s3Client = null;
      this.bucketName = null;
    }
  }

  async uploadPhoto(file: MulterFile): Promise<string> {
    // Check if service is configured
    if (!this.s3Client || !this.bucketName) {
      throw new Error(
        'Digital Ocean Spaces is not configured. Unable to upload photo. ' +
          'Please set DO_SPACES_ENDPOINT, DO_SPACES_KEY, DO_SPACES_SECRET, and DO_SPACES_BUCKET.',
      );
    }

    const fileKey = `${uuidv4()}-${file.originalname}`;
    const uploadParams = {
      Bucket: this.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ACL: 'public-read' as const,
    };

    try {
      const upload = new Upload({
        client: this.s3Client,
        params: uploadParams,
      });

      const response = await upload.done();

      return response.Location;
    } catch (error) {
      console.error('Failed to upload photo to Digital Ocean Spaces:', error);
      throw new Error(`Failed to upload photo: ${error.message}`);
    }
  }
}
