import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';

export interface ImageVariantConfig {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality: number;
  formats: string[];
}

export interface ImageVariant {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
  url?: string;
}

export interface ProcessedImages {
  optimized?: {
    buffer: Buffer;
    size: number;
    width: number;
    height: number;
    format: string;
  };
  variants: Record<string, Record<string, ImageVariant>>;
  blurPlaceholder: string;
  dominantColor: string;
  originalDimensions: { width: number; height: number };
}

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  // Image variant configurations based on best practices
  private readonly IMAGE_VARIANTS: Record<string, ImageVariantConfig> = {
    // Thumbnail for grid views and previews
    thumbnail: {
      width: 150,
      height: 150,
      fit: 'cover', // Crop to square
      quality: 80,
      formats: ['webp', 'jpg'],
    },

    // Small - Mobile screens
    small: {
      width: 320,
      height: undefined, // Maintain aspect ratio
      fit: 'inside',
      quality: 85,
      formats: ['avif', 'webp', 'jpg'],
    },

    // Medium - Tablets
    medium: {
      width: 768,
      height: undefined,
      fit: 'inside',
      quality: 85,
      formats: ['avif', 'webp', 'jpg'],
    },

    // Large - Desktop
    large: {
      width: 1200,
      height: undefined,
      fit: 'inside',
      quality: 90,
      formats: ['avif', 'webp', 'jpg'],
    },

    // Extra Large - High DPI screens
    xlarge: {
      width: 1920,
      height: undefined,
      fit: 'inside',
      quality: 90,
      formats: ['avif', 'webp', 'jpg'],
    },

    // Square - Social media, avatars
    square: {
      width: 800,
      height: 800,
      fit: 'cover',
      quality: 85,
      formats: ['avif', 'webp', 'jpg'],
    },

    // Open Graph - Social media sharing
    og: {
      width: 1200,
      height: 630,
      fit: 'cover',
      quality: 85,
      formats: ['jpg'], // Maximum compatibility
    },

    // Twitter Card
    twitter: {
      width: 1200,
      height: 675,
      fit: 'cover',
      quality: 85,
      formats: ['jpg'],
    },
  };

  async processImage(file: Buffer, mimetype: string): Promise<ProcessedImages> {
    try {
      this.logger.log(
        `Processing image of type ${mimetype}, size: ${file.length} bytes`,
      );

      const sharpInstance = sharp(file);
      const metadata = await sharpInstance.metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Unable to read image dimensions');
      }

      // Check if image has alpha channel (transparency)
      const hasTransparency = metadata.hasAlpha || metadata.channels === 4;

      // Don't store original if larger than 2MB or dimensions > 2500px
      const shouldOptimizeOriginal =
        file.length > 2 * 1024 * 1024 ||
        metadata.width > 2500 ||
        metadata.height > 2500;

      const processed: ProcessedImages = {
        optimized: undefined,
        variants: {},
        blurPlaceholder: '',
        dominantColor: '',
        originalDimensions: { width: metadata.width, height: metadata.height },
      };

      // Create optimized "original" (max 2500px wide, 90% quality)
      if (shouldOptimizeOriginal) {
        this.logger.log('Creating optimized original version');

        // Use PNG for transparent images, JPEG for others
        const optimizeOperation = sharp(file).resize(2500, null, {
          withoutEnlargement: true,
          fit: 'inside',
          background: hasTransparency
            ? { r: 0, g: 0, b: 0, alpha: 0 }
            : { r: 255, g: 255, b: 255, alpha: 1 },
        });

        const optimizedBuffer = hasTransparency
          ? await optimizeOperation
              .png({ quality: 90, compressionLevel: 6 })
              .toBuffer()
          : await optimizeOperation
              .jpeg({ quality: 90, progressive: true, mozjpeg: true })
              .toBuffer();

        const optimizedInfo = await sharp(optimizedBuffer).metadata();
        processed.optimized = {
          buffer: optimizedBuffer,
          size: optimizedBuffer.length,
          width: optimizedInfo.width!,
          height: optimizedInfo.height!,
          format: hasTransparency ? 'png' : 'jpg',
        };
      }

      // Generate all variants
      for (const [name, config] of Object.entries(this.IMAGE_VARIANTS)) {
        this.logger.log(`Creating variant: ${name}`);
        processed.variants[name] = {};

        // Determine formats to use based on transparency
        const formatsToUse = hasTransparency
          ? [
              ...config.formats.filter((f) => f !== 'jpg' && f !== 'jpeg'),
              'png',
            ] // Replace JPEG with PNG for transparent images
          : config.formats;

        for (const format of formatsToUse) {
          try {
            const variant = await this.createVariant(
              file,
              config,
              format,
              hasTransparency,
            );
            processed.variants[name][format] = variant;
          } catch (error) {
            this.logger.error(
              `Failed to create variant ${name}:${format}`,
              error,
            );
            // Continue with other formats
          }
        }
      }

      // Generate blur placeholder (10px wide, base64)
      processed.blurPlaceholder = await this.generateBlurPlaceholder(file);

      // Extract dominant color for skeleton loading
      processed.dominantColor = await this.extractDominantColor(file);

      this.logger.log(
        `Successfully processed image with ${Object.keys(processed.variants).length} variants`,
      );
      return processed;
    } catch (error) {
      this.logger.error('Failed to process image', error);
      throw error;
    }
  }

  private async createVariant(
    buffer: Buffer,
    config: ImageVariantConfig,
    format: string,
    hasTransparency = false,
  ): Promise<ImageVariant> {
    let pipeline = sharp(buffer);

    // Resize with appropriate background handling
    if (config.width || config.height) {
      // For transparent images, use transparent background
      // For opaque images, use white background for consistency
      const background = hasTransparency
        ? { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        : { r: 255, g: 255, b: 255, alpha: 1 }; // White background for non-transparent

      pipeline = pipeline.resize(config.width, config.height, {
        fit: config.fit || 'inside',
        withoutEnlargement: true,
        background,
      });
    }

    // Format conversion with optimization
    switch (format) {
      case 'avif':
        pipeline = pipeline.avif({
          quality: Math.max(config.quality - 5, 50), // AVIF can be more aggressive
          effort: 4, // Balance speed/compression (0-9)
        });
        break;
      case 'webp':
        pipeline = pipeline.webp({
          quality: config.quality,
          effort: 4,
          smartSubsample: true,
        });
        break;
      case 'png':
        pipeline = pipeline.png({
          quality: config.quality,
          compressionLevel: 6, // Balance between size and speed (0-9)
          progressive: true,
        });
        break;
      case 'jpg':
      case 'jpeg':
        pipeline = pipeline.jpeg({
          quality: config.quality,
          progressive: true,
          mozjpeg: true, // Better compression
        });
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    const resultBuffer = await pipeline.toBuffer();
    const info = await sharp(resultBuffer).metadata();

    return {
      buffer: resultBuffer,
      format,
      width: info.width!,
      height: info.height!,
      size: resultBuffer.length,
      url: undefined, // Will be set after upload to S3
    };
  }

  private async generateBlurPlaceholder(buffer: Buffer): Promise<string> {
    try {
      const placeholder = await sharp(buffer)
        .resize(10, null, { fit: 'inside' })
        .blur(0.3)
        .jpeg({ quality: 50 })
        .toBuffer();

      return `data:image/jpeg;base64,${placeholder.toString('base64')}`;
    } catch (error) {
      this.logger.error('Failed to generate blur placeholder', error);
      return '';
    }
  }

  private async extractDominantColor(buffer: Buffer): Promise<string> {
    try {
      const { dominant } = await sharp(buffer).stats();
      const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
      return `#${toHex(dominant.r)}${toHex(dominant.g)}${toHex(dominant.b)}`;
    } catch (error) {
      this.logger.error('Failed to extract dominant color', error);
      return '#cccccc'; // Default gray
    }
  }

  /**
   * Check if the file is a supported image format
   */
  isImageSupported(mimetype: string): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/tiff',
      'image/avif',
      'image/bmp',
    ];

    return supportedTypes.includes(mimetype.toLowerCase());
  }

  /**
   * Get estimated processing time in seconds
   */
  estimateProcessingTime(
    fileSize: number,
    dimensions?: { width: number; height: number },
  ): number {
    // Base time of 2 seconds + 1 second per MB + extra time for large dimensions
    let estimatedTime = 2;
    estimatedTime += Math.ceil(fileSize / (1024 * 1024)); // 1 second per MB

    if (dimensions && (dimensions.width > 4000 || dimensions.height > 4000)) {
      estimatedTime += 5; // Extra time for very large images
    }

    return Math.min(estimatedTime, 30); // Cap at 30 seconds
  }

  /**
   * Get image dimensions from file path or buffer
   */
  async getImageDimensions(
    input: string | Buffer,
  ): Promise<{ width: number; height: number }> {
    try {
      const metadata = await sharp(input).metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Could not determine image dimensions');
      }

      return {
        width: metadata.width,
        height: metadata.height,
      };
    } catch (error) {
      this.logger.error(`Failed to get image dimensions: ${error.message}`);
      throw error;
    }
  }
}
