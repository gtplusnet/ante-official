import { Injectable } from '@nestjs/common';
import { BaseTask } from './base.task';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

@Injectable()
export class LogCleanupTask extends BaseTask {
  getName(): string {
    return 'log-cleanup';
  }

  getDescription(): string {
    return 'Cleans up old log files to free disk space';
  }

  async execute(config: Record<string, any>): Promise<void> {
    const startTime = Date.now();
    await this.logStart();

    try {
      const retentionDays = config.retentionDays || 7;
      const logPaths = config.logPaths || ['./logs'];
      const patterns = config.patterns || ['*.log'];
      const maxSizeBeforeCleanup =
        config.maxSizeBeforeCleanup || 1024 * 1024 * 100; // 100MB

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      let totalSize = 0;
      let deletedCount = 0;
      let deletedSize = 0;

      for (const logPath of logPaths) {
        try {
          // Check if directory exists
          const fullPath = path.resolve(logPath);
          const dirStat = await stat(fullPath).catch(() => null);

          if (!dirStat || !dirStat.isDirectory()) {
            this.logger.warn(`Log directory not found: ${fullPath}`);
            continue;
          }

          // Read directory contents
          const files = await readdir(fullPath);

          for (const file of files) {
            const filePath = path.join(fullPath, file);

            try {
              const fileStat = await stat(filePath);

              if (!fileStat.isFile()) {
                continue;
              }

              // Check if file matches any pattern
              const matchesPattern = patterns.some((pattern) => {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                return regex.test(file);
              });

              if (!matchesPattern) {
                continue;
              }

              totalSize += fileStat.size;

              // Check if file is older than retention period
              if (fileStat.mtime < cutoffDate) {
                await unlink(filePath);
                deletedCount++;
                deletedSize += fileStat.size;
                this.logger.debug(
                  `Deleted old log file: ${file} (${this.formatSize(fileStat.size)})`,
                );
              }
            } catch (fileError) {
              this.logger.warn(
                `Error processing file ${filePath}: ${fileError.message}`,
              );
            }
          }

          // Check if total size exceeds threshold
          if (totalSize > maxSizeBeforeCleanup && deletedCount === 0) {
            this.logger.warn(
              `Log directory ${fullPath} size (${this.formatSize(totalSize)}) exceeds threshold (${this.formatSize(maxSizeBeforeCleanup)})`,
            );
          }
        } catch (dirError) {
          this.logger.error(
            `Error processing directory ${logPath}: ${dirError.message}`,
          );
        }
      }

      this.logger.log(
        `Log cleanup completed: Deleted ${deletedCount} files (${this.formatSize(deletedSize)})`,
      );
      this.logger.log(
        `Total log size: ${this.formatSize(totalSize - deletedSize)}`,
      );

      const duration = Date.now() - startTime;
      await this.logComplete(duration);
    } catch (error) {
      await this.logError(error);
      throw error;
    }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}
