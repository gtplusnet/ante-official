import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@common/prisma.service';
import { TaskScriptExecutorService } from '../../../services/task-script-executor.service';
import { NotificationService } from '@modules/communication/notification/notification/notification.service';
import { DiscussionService } from '@modules/communication/discussion/discussion/discussion.service';
import { SocketService } from '@modules/communication/socket/socket/socket.service';
import { TaskWatcherType } from '@prisma/client';
import { DISCUSSION_EVENTS } from '../../../shared/events/discussion.events';
import notificationTypeReference from '../../../reference/notification-type.reference';

export interface TaskProcessingJobData {
  taskId: number;
  task: any;
  action: 'created' | 'updated';
  createdAt: string;
}

@Processor('task-processing', {
  concurrency: 5,  // Process up to 5 tasks in parallel
})
export class TaskQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(TaskQueueProcessor.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TaskScriptExecutorService) private readonly scriptExecutor: TaskScriptExecutorService,
    @Inject(NotificationService) private readonly notificationService: NotificationService,
    @Inject(DiscussionService) private readonly discussionService: DiscussionService,
    @Inject(SocketService) private readonly socketService: SocketService,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
  ) {
    super();
    this.logger.log('TaskQueueProcessor initialized');
  }

  async process(job: Job<TaskProcessingJobData>): Promise<any> {
    const startTime = Date.now();
    const { taskId, task, action, createdAt } = job.data;

    this.logger.log(`Processing job ${job.id} for task ${taskId} (action: ${action})`);
    console.log('=== TASK QUEUE PROCESSOR ===');
    console.log(`Job ID: ${job.id}`);
    console.log(`Task ID: ${taskId}`);
    console.log(`Action: ${action}`);
    console.log(`Task Title: ${task?.title || 'Unknown'}`);
    console.log(`Created At: ${createdAt}`);
    console.log('============================');

    try {
      // Fetch the complete task data from database to ensure we have latest info
      const fullTask = await this.prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignedTo: true,
          createdBy: true,
          project: true,
          boardLane: true,
        },
      });

      if (!fullTask) {
        throw new Error(`Task ${taskId} not found in database`);
      }

      console.log('Full task data fetched:', {
        id: fullTask.id,
        title: fullTask.title,
        assignedTo: fullTask.assignedTo?.username,
        createdBy: fullTask.createdBy?.username,
        project: fullTask.project?.name,
        boardLane: fullTask.boardLane?.name,
      });

      // Execute scripts based on the action
      if (action === 'created') {
        await this.handleTaskCreated(fullTask);
      } else if (action === 'updated') {
        await this.handleTaskUpdated(fullTask);
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(`Job ${job.id} completed in ${processingTime}ms`);

      return {
        success: true,
        taskId,
        processingTime,
        processedAt: new Date().toISOString(),
      };

    } catch (error) {
      this.logger.error(`Failed to process job ${job.id} for task ${taskId}:`, error);
      console.error('Task processing error:', error);

      // Re-throw to trigger retry mechanism
      throw error;
    }
  }

  private async handleTaskCreated(task: any) {
    this.logger.log(`Handling task created: ${task.id} - ${task.title}`);
    console.log('=== HANDLING TASK CREATED ===');
    console.log(`Task: ${task.title}`);
    console.log(`Assigned to: ${task.assignedTo?.username || 'Unassigned'}`);
    console.log(`Created by: ${task.createdBy?.username || 'Unknown'}`);

    try {
      // 1. Create Task Watchers
      console.log('Creating task watchers...');
      await this.createTaskWatchers(task);

      // 2. Send Notification to Assignee
      if (task.assignedToId && task.assignedToId !== task.createdById) {
        console.log(`Sending notification to assignee: ${task.assignedToId}`);
        await this.notificationService.sendNotifications(
          task.projectId || null,
          task.createdById,
          [task.assignedToId],
          task.title,
          notificationTypeReference.TASK_ASSIGNED.key,
          task.id.toString(),
        );
        console.log(`✅ Notification sent to assignee`);
      }

      // 3. Create Discussion for the Task
      console.log('Creating discussion for the task...');
      await this.createTaskDiscussion(task);
      console.log(`✅ Discussion created for task ${task.id}`);

      // 4. Execute custom scripts for task creation
      console.log('Executing custom scripts...');
      await this.scriptExecutor.executeTaskCreationScripts(task);
      console.log(`✅ Scripts executed successfully for task ${task.id}`);

      // 5. Log activity
      this.logger.log(`Task ${task.id} processing completed with all operations`);

    } catch (error) {
      console.error('Task processing failed:', error);
      this.logger.error(`Failed to process task ${task.id}:`, error);
      throw error;
    }
  }

  private async createTaskWatchers(task: any) {
    const watchers = [];

    // Creator as watcher
    if (task.createdById) {
      watchers.push({
        taskId: task.id,
        accountId: task.createdById,
        watcherType: TaskWatcherType.CREATOR,
      });
    }

    // Assignee as watcher (if different from creator)
    if (task.assignedToId && task.assignedToId !== task.createdById) {
      watchers.push({
        taskId: task.id,
        accountId: task.assignedToId,
        watcherType: TaskWatcherType.ASSIGNEE,
      });
    }

    // Remove existing watchers and create new ones
    for (const watcher of watchers) {
      try {
        // Delete existing watcher if any
        await this.prisma.taskWatcher.deleteMany({
          where: {
            taskId: watcher.taskId,
            accountId: watcher.accountId,
          },
        });

        // Create new watcher
        await this.prisma.taskWatcher.create({
          data: watcher,
        });

        console.log(`✅ Created ${watcher.watcherType} watcher for account ${watcher.accountId}`);
      } catch (error) {
        console.error(`Failed to create watcher for ${watcher.accountId}:`, error);
      }
    }
  }

  private async createTaskDiscussion(task: any) {
    try {
      // Collect all watchers for the discussion
      const allWatchers = new Set<string>();

      if (task.createdById) {
        allWatchers.add(task.createdById);
      }

      if (task.assignedToId) {
        allWatchers.add(task.assignedToId);
      }

      // Emit discussion create event with companyId
      this.eventEmitter.emit(DISCUSSION_EVENTS.CREATE, {
        module: 'Task',
        targetId: task.id.toString(),
        title: task.title,
        actorId: task.createdById || 'system',
        initialWatchers: Array.from(allWatchers),
        timestamp: new Date().toISOString(),
        companyId: task.companyId, // Include companyId from task
      });

      console.log(`Discussion event emitted for task ${task.id} with ${allWatchers.size} watchers`);
    } catch (error) {
      console.error('Failed to create discussion for task:', error);
      // Don't throw - discussion creation is not critical
    }
  }

  private async handleTaskUpdated(task: any) {
    this.logger.log(`Handling task updated: ${task.id} - ${task.title}`);
    // Placeholder for future task update handling
    // Could execute different scripts based on what was updated
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<TaskProcessingJobData>) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<TaskProcessingJobData>, error: Error) {
    this.logger.error(`Job ${job.id} failed:`, error);
  }

  @OnWorkerEvent('active')
  onActive(job: Job<TaskProcessingJobData>) {
    this.logger.log(`Job ${job.id} started processing`);
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string) {
    this.logger.warn(`Job ${jobId} stalled`);
  }
}