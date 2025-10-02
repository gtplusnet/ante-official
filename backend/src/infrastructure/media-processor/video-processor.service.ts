import { Injectable, Logger } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { promisify } from 'util';

export interface VideoResolutionConfig {
  name: string;
  width: number;
  height: number;
  bitrate: string;
  audioBitrate: string;
}

export interface VideoVariant {
  path: string;
  resolution: string;
  width: number;
  height: number;
  bitrate: string;
  size: number;
  format: string;
  duration: number;
}

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  fps: number;
  codec: string;
  bitrate: string;
  hasAudio: boolean;
  format: string;
}

export interface HLSOutput {
  masterPlaylist: string;
  variantPlaylists: string[];
  segmentFiles: string[];
}

export interface ProcessedVideo {
  thumbnail: string;
  poster: string;
  preview?: string; // Animated preview (GIF/WebP)
  variants: Record<string, VideoVariant>;
  hls?: HLSOutput;
  metadata: VideoMetadata;
  originalSize: number;
}

@Injectable()
export class VideoProcessorService {
  private readonly logger = new Logger(VideoProcessorService.name);

  // Video processing configurations based on best practices
  private readonly VIDEO_RESOLUTIONS: VideoResolutionConfig[] = [
    {
      name: '360p',
      width: 640,
      height: 360,
      bitrate: '800k',
      audioBitrate: '96k',
    },
    {
      name: '480p',
      width: 854,
      height: 480,
      bitrate: '1400k',
      audioBitrate: '128k',
    },
    {
      name: '720p',
      width: 1280,
      height: 720,
      bitrate: '2800k',
      audioBitrate: '128k',
    },
    {
      name: '1080p',
      width: 1920,
      height: 1080,
      bitrate: '5000k',
      audioBitrate: '192k',
    },
  ];

  private readonly ENCODING_SETTINGS = {
    codec: 'libx264', // H.264 for compatibility
    preset: 'medium', // Balance speed/quality
    crf: 23, // Quality factor (18-28 recommended)
    audioCodec: 'aac',
    pixelFormat: 'yuv420p', // Compatibility
  };

  // Overload for queue processor
  async processVideo(
    inputPath: string,
    options: {
      generateThumbnails?: boolean;
      generateVariants?: boolean;
      resolutions?: string[];
      generateHLS?: boolean;
      generateDASH?: boolean;
    },
  ): Promise<{ variants: any; thumbnail?: { url: string } }>;

  // Original implementation
  async processVideo(
    inputBuffer: Buffer,
    originalFilename: string,
    mimetype: string,
  ): Promise<ProcessedVideo>;

  async processVideo(
    input: string | Buffer,
    optionsOrFilename?: any,
    mimetype?: string,
  ): Promise<ProcessedVideo | { variants: any; thumbnail?: { url: string } }> {
    // Handle string input (file path) - for queue processor
    if (typeof input === 'string') {
      const inputPath = input;
      const options = optionsOrFilename;

      try {
        // Get metadata
        const metadata = await this.getVideoMetadata(inputPath);
        const tempDir = path.dirname(inputPath);

        const result: { variants: any; thumbnail?: { url: string } } = {
          variants: {},
        };

        // Generate thumbnail if requested
        if (options.generateThumbnails) {
          const thumbnailPath = await this.generateThumbnail(
            inputPath,
            tempDir,
            metadata.duration / 2,
          );
          result.thumbnail = { url: thumbnailPath };
        }

        return result;
      } catch (error) {
        this.logger.error(
          `Failed to process video from path: ${error.message}`,
        );
        throw error;
      }
    }

    // Original buffer-based implementation
    const inputBuffer = input as Buffer;
    const originalFilename = optionsOrFilename;

    return this.processVideoFromBuffer(
      inputBuffer,
      originalFilename,
      mimetype!,
    );
  }

  private async processVideoFromBuffer(
    inputBuffer: Buffer,
    originalFilename: string,
    mimetype: string,
  ): Promise<ProcessedVideo> {
    const tempDir = path.join(process.cwd(), 'temp', uuid());
    const inputPath = path.join(
      tempDir,
      'input' + path.extname(originalFilename),
    );

    try {
      this.logger.log(
        `Processing video: ${originalFilename}, size: ${inputBuffer.length} bytes`,
      );

      // Create temp directory and save input file
      await fs.ensureDir(tempDir);
      await fs.writeFile(inputPath, inputBuffer);

      // Extract video metadata
      const metadata = await this.getVideoMetadata(inputPath);
      this.logger.log(
        `Video metadata: ${metadata.width}x${metadata.height}, ${metadata.duration}s, ${metadata.codec}`,
      );

      const processed: ProcessedVideo = {
        thumbnail: '',
        poster: '',
        preview: undefined,
        variants: {},
        hls: undefined,
        metadata,
        originalSize: inputBuffer.length,
      };

      // Generate thumbnail (1 second in)
      processed.thumbnail = await this.generateThumbnail(
        inputPath,
        tempDir,
        Math.min(1, metadata.duration * 0.1),
      );

      // Generate poster (middle frame)
      processed.poster = await this.generatePoster(
        inputPath,
        tempDir,
        metadata.duration / 2,
      );

      // Generate animated preview only for short videos (< 30 seconds)
      if (metadata.duration < 30) {
        try {
          processed.preview = await this.generatePreview(inputPath, tempDir);
        } catch (error) {
          this.logger.warn('Failed to generate preview, skipping', error);
        }
      }

      // Process resolution variants
      for (const resolution of this.VIDEO_RESOLUTIONS) {
        // Skip if source is lower resolution
        if (metadata.width < resolution.width) {
          this.logger.log(
            `Skipping ${resolution.name} (source is ${metadata.width}x${metadata.height})`,
          );
          continue;
        }

        try {
          this.logger.log(`Creating ${resolution.name} variant`);
          const variant = await this.createVideoVariant(
            inputPath,
            tempDir,
            resolution,
            metadata,
          );
          processed.variants[resolution.name] = variant;
        } catch (error) {
          this.logger.error(
            `Failed to create ${resolution.name} variant`,
            error,
          );
          // Continue with other variants
        }
      }

      // Generate HLS playlist for adaptive streaming (if we have multiple variants)
      if (Object.keys(processed.variants).length > 1) {
        try {
          this.logger.log('Generating HLS streams');
          processed.hls = await this.generateHLS(tempDir, processed.variants);
        } catch (error) {
          this.logger.error('Failed to generate HLS', error);
        }
      }

      this.logger.log(
        `Successfully processed video with ${Object.keys(processed.variants).length} variants`,
      );
      return processed;
    } catch (error) {
      this.logger.error('Failed to process video', error);
      throw error;
    } finally {
      // Cleanup temp directory
      try {
        await fs.remove(tempDir);
      } catch (error) {
        this.logger.warn('Failed to cleanup temp directory', error);
      }
    }
  }

  async getVideoMetadata(inputPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(
          (s) => s.codec_type === 'video',
        );
        const audioStream = metadata.streams.find(
          (s) => s.codec_type === 'audio',
        );

        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        resolve({
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          duration: parseFloat(String(metadata.format.duration || '0')),
          fps: eval(videoStream.r_frame_rate || '0') || 30,
          codec: videoStream.codec_name || 'unknown',
          bitrate: String(metadata.format.bit_rate || '0'),
          hasAudio: !!audioStream,
          format: metadata.format.format_name || 'unknown',
        });
      });
    });
  }

  private async createVideoVariant(
    inputPath: string,
    outputDir: string,
    resolution: VideoResolutionConfig,
    metadata: VideoMetadata,
  ): Promise<VideoVariant> {
    const outputPath = path.join(outputDir, `video_${resolution.name}.mp4`);

    return new Promise((resolve, reject) => {
      // Calculate height maintaining aspect ratio
      const aspectRatio = metadata.width / metadata.height;
      const targetHeight = Math.round(resolution.width / aspectRatio);

      // Use the smaller of target height and resolution height
      const finalHeight = Math.min(targetHeight, resolution.height);
      const finalWidth = Math.round(finalHeight * aspectRatio);

      let command = ffmpeg(inputPath)
        // Video settings
        .videoCodec(this.ENCODING_SETTINGS.codec)
        .size(`${finalWidth}x${finalHeight}`)
        .videoBitrate(resolution.bitrate)
        .outputOptions([
          `-preset ${this.ENCODING_SETTINGS.preset}`,
          `-crf ${this.ENCODING_SETTINGS.crf}`,
          '-movflags +faststart', // Web optimization
          `-pix_fmt ${this.ENCODING_SETTINGS.pixelFormat}`, // Compatibility
          '-profile:v baseline', // Better compatibility
          '-level 3.0',
        ]);

      // Audio settings (if audio exists)
      if (metadata.hasAudio) {
        command = command
          .audioCodec(this.ENCODING_SETTINGS.audioCodec)
          .audioBitrate(resolution.audioBitrate);
      } else {
        command = command.noAudio();
      }

      command
        .output(outputPath)
        .on('start', (cmdLine) => {
          this.logger.debug(`FFmpeg command: ${cmdLine}`);
        })
        .on('progress', (progress) => {
          this.logger.debug(
            `Processing ${resolution.name}: ${progress.percent}% done`,
          );
        })
        .on('end', async () => {
          try {
            const stats = await fs.stat(outputPath);
            const processedMetadata = await this.getVideoMetadata(outputPath);

            resolve({
              path: outputPath,
              resolution: resolution.name,
              width: finalWidth,
              height: finalHeight,
              bitrate: resolution.bitrate,
              size: stats.size,
              format: 'mp4',
              duration: processedMetadata.duration,
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject)
        .run();
    });
  }

  private async generateHLS(
    outputDir: string,
    variants: Record<string, VideoVariant>,
  ): Promise<HLSOutput> {
    const hlsDir = path.join(outputDir, 'hls');
    await fs.ensureDir(hlsDir);

    const variantPlaylists: string[] = [];
    const segmentFiles: string[] = [];

    // Generate HLS segments for each variant
    for (const [name, variant] of Object.entries(variants)) {
      const playlistPath = path.join(hlsDir, `${name}.m3u8`);
      const segmentPattern = path.join(hlsDir, `${name}_%03d.ts`);

      await this.generateHLSVariant(variant.path, playlistPath, segmentPattern);
      variantPlaylists.push(playlistPath);

      // Collect segment files
      const files = await fs.readdir(hlsDir);
      const segments = files.filter(
        (f) => f.startsWith(`${name}_`) && f.endsWith('.ts'),
      );
      segmentFiles.push(...segments.map((s) => path.join(hlsDir, s)));
    }

    // Create master playlist
    const masterPlaylistPath = path.join(hlsDir, 'master.m3u8');
    const masterPlaylist = this.createHLSMasterPlaylist(variants);
    await fs.writeFile(masterPlaylistPath, masterPlaylist);

    return {
      masterPlaylist: masterPlaylistPath,
      variantPlaylists,
      segmentFiles,
    };
  }

  private async generateHLSVariant(
    inputPath: string,
    playlistPath: string,
    segmentPattern: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-c copy', // Don't re-encode (already optimized)
          '-start_number 0',
          '-hls_time 10', // 10-second segments
          '-hls_list_size 0', // Keep all segments
          '-hls_segment_filename',
          segmentPattern,
          '-f hls',
        ])
        .output(playlistPath)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
  }

  private createHLSMasterPlaylist(
    variants: Record<string, VideoVariant>,
  ): string {
    let playlist = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

    // Sort variants by resolution (height)
    const sortedVariants = Object.entries(variants).sort(
      ([, a], [, b]) => a.height - b.height,
    );

    for (const [name, variant] of sortedVariants) {
      const bandwidth = parseInt(variant.bitrate.replace('k', '')) * 1000; // Convert to bps
      playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${variant.width}x${variant.height}\n`;
      playlist += `${name}.m3u8\n\n`;
    }

    return playlist;
  }

  private async generateThumbnail(
    inputPath: string,
    outputDir: string,
    timestamp: number,
  ): Promise<string> {
    const outputPath = path.join(outputDir, 'thumbnail.jpg');

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: [timestamp],
          filename: 'thumbnail.jpg',
          folder: outputDir,
          size: '320x180',
        })
        .on('end', () => resolve(outputPath))
        .on('error', reject);
    });
  }

  private async generatePoster(
    inputPath: string,
    outputDir: string,
    timestamp: number,
  ): Promise<string> {
    const outputPath = path.join(outputDir, 'poster.jpg');

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: [timestamp],
          filename: 'poster.jpg',
          folder: outputDir,
          size: '1280x720',
        })
        .on('end', () => resolve(outputPath))
        .on('error', reject);
    });
  }

  private async generatePreview(
    inputPath: string,
    outputDir: string,
  ): Promise<string> {
    const outputPath = path.join(outputDir, 'preview.gif');

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-t 3', // 3 seconds
          '-vf scale=320:-1', // 320px wide, maintain aspect ratio
          '-r 10', // 10 fps
          '-f gif',
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  /**
   * Check if the file is a supported video format
   */
  isVideoSupported(mimetype: string): boolean {
    const supportedTypes = [
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
    ];

    return supportedTypes.includes(mimetype.toLowerCase());
  }

  /**
   * Get estimated processing time in seconds
   */
  estimateProcessingTime(fileSize: number, duration?: number): number {
    // Base time of 30 seconds + 2 seconds per MB + 10 seconds per minute of video
    let estimatedTime = 30;
    estimatedTime += Math.ceil(fileSize / (1024 * 1024)) * 2; // 2 seconds per MB

    if (duration) {
      estimatedTime += Math.ceil(duration / 60) * 10; // 10 seconds per minute
    }

    return Math.min(estimatedTime, 600); // Cap at 10 minutes
  }
}
