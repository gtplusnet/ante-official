import {
  Injectable,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { SchedulerMongoService } from './mongodb/scheduler-mongo.service';
import { SchedulerExecutionMongoService } from './mongodb/scheduler-execution-mongo.service';
import { SchedulerRegistryService } from './scheduler-registry.service';
import { SchedulerExecutorService } from './scheduler-executor.service';
import { SCHEDULER_DEFINITIONS } from 'reference/scheduler.reference';
import {
  CreateSchedulerDTO,
  UpdateSchedulerDTO,
  SchedulerResponse,
  SchedulerExecutionResponse,
  SchedulerStatsResponse,
} from './scheduler.interface';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly schedulerMongoService: SchedulerMongoService,
    private readonly executionMongoService: SchedulerExecutionMongoService,
    private readonly registryService: SchedulerRegistryService,
    private readonly executorService: SchedulerExecutorService,
  ) {}

  async onModuleInit() {
    await this.syncSchedulersFromReference();
  }

  async syncSchedulersFromReference(): Promise<void> {
    try {
      this.logger.log('Syncing schedulers from reference file...');

      for (const [key, definition] of Object.entries(SCHEDULER_DEFINITIONS)) {
        try {
          // Check if scheduler exists by reference key
          let scheduler = await this.schedulerMongoService.findOne({
            referenceKey: key,
          });

          if (!scheduler) {
            // Create new scheduler
            this.logger.log(`Creating new scheduler from reference: ${key}`);
            scheduler = await this.schedulerMongoService.create({
              name: definition.name,
              description: definition.description,
              referenceKey: key,
              taskType: definition.taskType,
              cronExpression: definition.cronExpression,
              taskConfig: definition.taskConfig,
              isActive: definition.isActive,
            });
          } else {
            // Update existing scheduler (preserve user modifications)
            this.logger.log(`Updating existing scheduler: ${key}`);
            await this.schedulerMongoService.update(scheduler.id, {
              name: definition.name,
              description: definition.description,
              taskType: definition.taskType,
              // Preserve user's cronExpression and isActive if modified
              cronExpression:
                scheduler.cronExpression || definition.cronExpression,
              isActive:
                scheduler.isActive !== undefined
                  ? scheduler.isActive
                  : definition.isActive,
              // Merge taskConfig
              taskConfig: { ...definition.taskConfig, ...scheduler.taskConfig },
            });
          }

          // Register with scheduler registry if active
          if (scheduler.isActive) {
            await this.registryService.registerScheduler(
              scheduler.id,
              scheduler.name,
              scheduler.cronExpression,
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to sync scheduler ${key}: ${error.message}`,
          );
        }
      }

      this.logger.log('Scheduler synchronization completed');
    } catch (error) {
      this.logger.error(
        'Failed to sync schedulers from reference',
        error.stack,
      );
    }
  }

  async create(_dto: CreateSchedulerDTO): Promise<SchedulerResponse> {
    // Schedulers can only be created from reference file
    throw new BadRequestException(
      'Schedulers cannot be created manually. They are managed through the system reference file.',
    );
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{
    data: SchedulerResponse[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const result = await this.schedulerMongoService.paginate(page, limit);

    return {
      ...result,
      data: result.data.map((scheduler) =>
        this.formatSchedulerResponse(scheduler),
      ),
    };
  }

  async findOne(id: string): Promise<SchedulerResponse> {
    const scheduler = await this.schedulerMongoService.findById(id);
    if (!scheduler) {
      throw new NotFoundException('Scheduler not found');
    }
    return this.formatSchedulerResponse(scheduler);
  }

  async update(
    id: string,
    dto: UpdateSchedulerDTO,
  ): Promise<SchedulerResponse> {
    const scheduler = await this.schedulerMongoService.findById(id);
    if (!scheduler) {
      throw new NotFoundException('Scheduler not found');
    }

    // Only allow updating certain fields
    const allowedUpdates: Partial<UpdateSchedulerDTO> = {};

    // Users can only update cronExpression, isActive, and taskConfig
    if (dto.cronExpression !== undefined) {
      allowedUpdates.cronExpression = dto.cronExpression;
    }
    if (dto.isActive !== undefined) {
      allowedUpdates.isActive = dto.isActive;
    }
    if (dto.taskConfig !== undefined) {
      allowedUpdates.taskConfig = dto.taskConfig;
    }

    // Prevent updating protected fields
    if (dto.name || dto.description || dto.taskType) {
      throw new BadRequestException(
        'Cannot modify scheduler name, description, or task type. These are managed by the system.',
      );
    }

    // Update scheduler
    const updated = await this.schedulerMongoService.update(id, allowedUpdates);

    // Update registry if needed
    if (updated) {
      if (updated.isActive) {
        await this.registryService.updateScheduler(
          updated.id,
          updated.name,
          updated.cronExpression,
        );
      } else {
        this.registryService.deleteJob(updated.name);
      }
    }

    return this.formatSchedulerResponse(updated);
  }

  async toggle(id: string): Promise<SchedulerResponse> {
    const scheduler = await this.schedulerMongoService.toggleActive(id);
    if (!scheduler) {
      throw new NotFoundException('Scheduler not found');
    }

    // Update registry
    if (scheduler.isActive) {
      await this.registryService.registerScheduler(
        scheduler.id,
        scheduler.name,
        scheduler.cronExpression,
      );
    } else {
      this.registryService.deleteJob(scheduler.name);
    }

    return this.formatSchedulerResponse(scheduler);
  }

  async delete(_id: string): Promise<void> {
    // Schedulers cannot be deleted, only disabled
    throw new BadRequestException(
      'Schedulers cannot be deleted. Use the toggle feature to disable them instead.',
    );
  }

  async runNow(id: string): Promise<void> {
    const scheduler = await this.schedulerMongoService.findById(id);
    if (!scheduler) {
      throw new NotFoundException('Scheduler not found');
    }

    await this.registryService.runJobNow(id);
  }

  async getExecutionHistory(
    schedulerId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    data: SchedulerExecutionResponse[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const result = await this.executionMongoService.paginate(
      schedulerId,
      page,
      limit,
    );

    return {
      ...result,
      data: result.data.map((execution) =>
        this.formatExecutionResponse(execution),
      ),
    };
  }

  async getStats(
    schedulerId: string,
    days = 30,
  ): Promise<SchedulerStatsResponse> {
    return this.executionMongoService.getStats(schedulerId, days);
  }

  async getAvailableTasks(): Promise<
    Array<{ name: string; description: string }>
  > {
    return this.executorService.getAvailableTasks();
  }

  private formatSchedulerResponse(scheduler: any): SchedulerResponse {
    return {
      id: scheduler._id.toString(),
      name: scheduler.name,
      description: scheduler.description,
      cronExpression: scheduler.cronExpression,
      taskType: scheduler.taskType,
      taskConfig: scheduler.taskConfig,
      isActive: scheduler.isActive,
      status: scheduler.status,
      lastRunAt: scheduler.lastRunAt,
      nextRunAt: scheduler.nextRunAt,
      lastStatus: scheduler.lastStatus,
      lastDuration: scheduler.lastDuration,
      createdAt: scheduler.createdAt,
      updatedAt: scheduler.updatedAt,
    };
  }

  private formatExecutionResponse(execution: any): SchedulerExecutionResponse {
    return {
      id: execution._id.toString(),
      schedulerId: execution.schedulerId,
      schedulerName: execution.schedulerName,
      status: execution.status,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      duration: execution.duration,
      output: execution.output,
      error: execution.error,
      createdAt: execution.createdAt,
    };
  }
}
