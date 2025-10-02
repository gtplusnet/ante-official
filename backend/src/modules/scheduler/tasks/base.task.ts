import { Logger } from '@nestjs/common';
import { SchedulerTask } from '../scheduler.interface';

export abstract class BaseTask implements SchedulerTask {
  protected readonly logger: Logger;

  constructor() {
    this.logger = new Logger(this.constructor.name);
  }

  abstract execute(config: Record<string, any>): Promise<void | string>;
  abstract getName(): string;
  abstract getDescription(): string;

  protected async logStart(): Promise<void> {
    this.logger.log(`Starting task: ${this.getName()}`);
  }

  protected async logComplete(duration: number): Promise<void> {
    this.logger.log(`Completed task: ${this.getName()} in ${duration}ms`);
  }

  protected async logError(error: Error): Promise<void> {
    this.logger.error(
      `Error in task ${this.getName()}: ${error.message}`,
      error.stack,
    );
  }
}
