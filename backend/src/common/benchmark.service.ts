import { Injectable } from '@nestjs/common';

interface TimingEntry {
  name: string;
  startTime: bigint;
  endTime?: bigint;
  duration?: number;
  metadata?: Record<string, any>;
  children?: TimingEntry[];
  requestId?: string; // Add request ID to prevent race conditions
}

@Injectable()
export class BenchmarkService {
  private timings: Map<string, TimingEntry> = new Map();
  private enabled: boolean = process.env.ENABLE_MIDDLEWARE_BENCHMARK === 'true';

  start(key: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    // Extract request ID from key (format: auth-<timestamp>)
    const requestId = key.split('-')[1] || '';

    this.timings.set(key, {
      name: key,
      startTime: process.hrtime.bigint(),
      metadata,
      children: [],
      requestId,
    });
  }

  end(key: string, metadata?: Record<string, any>): number {
    if (!this.enabled) return 0;

    const timing = this.timings.get(key);
    if (!timing) {
      console.warn(`[Benchmark] No start time found for: ${key}`);
      return 0;
    }

    timing.endTime = process.hrtime.bigint();
    timing.duration = Number(timing.endTime - timing.startTime) / 1_000_000; // Convert to milliseconds

    if (metadata) {
      timing.metadata = { ...timing.metadata, ...metadata };
    }

    return timing.duration;
  }

  startNested(parentKey: string, childKey: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    const parent = this.timings.get(parentKey);
    if (!parent) {
      // Silently skip if parent is missing (likely due to concurrent request cleanup)
      return;
    }

    const childTiming: TimingEntry = {
      name: childKey,
      startTime: process.hrtime.bigint(),
      metadata,
      children: [],
      requestId: parent.requestId,
    };

    parent.children?.push(childTiming);
    // Store with composite key for easy access
    this.timings.set(`${parentKey}.${childKey}`, childTiming);
  }

  endNested(parentKey: string, childKey: string, metadata?: Record<string, any>): number {
    if (!this.enabled) return 0;

    const compositeKey = `${parentKey}.${childKey}`;
    const timing = this.timings.get(compositeKey);

    if (!timing) {
      // Silently skip if timing is missing (likely due to concurrent request cleanup)
      return 0;
    }

    timing.endTime = process.hrtime.bigint();
    timing.duration = Number(timing.endTime - timing.startTime) / 1_000_000;

    if (metadata) {
      timing.metadata = { ...timing.metadata, ...metadata };
    }

    return timing.duration;
  }

  printResults(mainKey: string, endpoint: string, method: string): void {
    if (!this.enabled) return;

    const mainTiming = this.timings.get(mainKey);
    if (!mainTiming || !mainTiming.duration) {
      // Silently skip if timing data is missing (likely due to concurrent request cleanup)
      return;
    }

    // Color codes for console output
    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      dim: '\x1b[2m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
    };

    // Determine color based on total time
    let totalColor = colors.green;
    if (mainTiming.duration > 500) totalColor = colors.red;
    else if (mainTiming.duration > 200) totalColor = colors.yellow;

    console.log(
      `${colors.bright}${colors.blue}[AUTH MIDDLEWARE BENCHMARK]${colors.reset} ` +
      `${colors.cyan}${method}${colors.reset} ${endpoint} - ` +
      `${colors.bright}Total: ${totalColor}${mainTiming.duration.toFixed(2)}ms${colors.reset}`
    );

    // Print children with tree structure
    if (mainTiming.children && mainTiming.children.length > 0) {
      this.printChildren(mainTiming.children, '  ', colors);
    }

    // Clear timings for this request
    this.clearTimings(mainKey);
  }

  private printChildren(children: TimingEntry[], prefix: string, colors: any): void {
    children.forEach((child, index) => {
      const isLast = index === children.length - 1;
      const connector = isLast ? '└─' : '├─';
      const nextPrefix = isLast ? '   ' : '│  ';

      // Determine color based on duration
      let timeColor = colors.green;
      if (child.duration && child.duration > 100) timeColor = colors.red;
      else if (child.duration && child.duration > 50) timeColor = colors.yellow;

      // Format metadata if exists
      let metadataStr = '';
      if (child.metadata) {
        const parts = Object.entries(child.metadata)
          .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
          .join(', ');
        if (parts) metadataStr = ` ${colors.dim}(${parts})${colors.reset}`;
      }

      console.log(
        `${prefix}${connector} ${colors.white}${child.name}:${colors.reset} ` +
        `${timeColor}${child.duration?.toFixed(2) || '0.00'}ms${colors.reset}${metadataStr}`
      );

      // Print nested children
      if (child.children && child.children.length > 0) {
        this.printChildren(child.children, prefix + nextPrefix, colors);
      }
    });
  }

  private clearTimings(mainKey: string): void {
    // Get the main timing to extract request ID
    const mainTiming = this.timings.get(mainKey);
    if (!mainTiming) return;

    const requestId = mainTiming.requestId;

    // Clear main timing and all related nested timings
    const keysToDelete = [];

    // Find all keys related to this request (by request ID)
    for (const [key, timing] of this.timings.entries()) {
      if (timing.requestId === requestId || key === mainKey || key.startsWith(`${mainKey}.`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.timings.delete(key));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Utility method to measure async operations
  async measureAsync<T>(
    key: string,
    operation: () => Promise<T>,
    parentKey?: string,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.enabled) {
      return await operation();
    }

    if (parentKey) {
      this.startNested(parentKey, key, metadata);
    } else {
      this.start(key, metadata);
    }

    try {
      const result = await operation();

      if (parentKey) {
        this.endNested(parentKey, key);
      } else {
        this.end(key);
      }

      return result;
    } catch (error) {
      // Still end timing even if operation fails
      if (parentKey) {
        this.endNested(parentKey, key, { error: true });
      } else {
        this.end(key, { error: true });
      }
      throw error;
    }
  }
}