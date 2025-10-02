import {
  Controller,
  Post,
  Body,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@common/prisma.service';
import { NotificationService } from '@modules/communication/notification/notification/notification.service';
import { DISCUSSION_EVENTS } from '@shared/events/discussion.events';
import { Public } from '@common/decorators/public.decorator';

// Webhook payload types
interface SupabaseWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: any;
  old_record?: any;
}

// Task Watcher Types
enum TaskWatcherType {
  CREATOR = 'CREATOR',
  ASSIGNEE = 'ASSIGNEE',
  WATCHER = 'WATCHER',
}

@Controller('webhooks/supabase')
export class SupabaseWebhookController {
  private readonly logger = new Logger(SupabaseWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Process Supabase webhook for Task table events
   * This handles async processing for tasks created via direct Supabase insertion
   */
  @Post('task')
  @Public() // Webhook doesn't use our auth system
  async handleTaskWebhook(
    @Body() payload: SupabaseWebhookPayload,
    @Headers('x-supabase-signature') signature: string,
  ) {
    try {
      // TODO: Verify webhook signature for security
      // For now, just log it
      this.logger.log(`Received webhook with signature: ${signature}`);

      // Only process INSERT events for new tasks
      if (payload.type !== 'INSERT' || payload.table !== 'Task') {
        return { processed: false, reason: 'Not a Task INSERT event' };
      }

      const task = payload.record;
      this.logger.log(`Processing new task: ${task.id} - ${task.name}`);

      // Process in parallel for better performance
      const [
        watchersResult,
        notificationResult,
        discussionResult,
      ] = await Promise.allSettled([
        this.createTaskWatchers(task),
        this.sendTaskNotifications(task),
        this.createDiscussionThread(task),
      ]);

      // Log any errors but don't fail the webhook
      if (watchersResult.status === 'rejected') {
        this.logger.error('Failed to create watchers:', watchersResult.reason);
      }
      if (notificationResult.status === 'rejected') {
        this.logger.error('Failed to send notifications:', notificationResult.reason);
      }
      if (discussionResult.status === 'rejected') {
        this.logger.error('Failed to create discussion:', discussionResult.reason);
      }

      return {
        processed: true,
        taskId: task.id,
        watchers: watchersResult.status === 'fulfilled' ? watchersResult.value : 'failed',
        notifications: notificationResult.status === 'fulfilled' ? notificationResult.value : 'failed',
        discussion: discussionResult.status === 'fulfilled' ? discussionResult.value : 'failed',
      };
    } catch (error) {
      this.logger.error('Webhook processing failed:', error);
      throw new HttpException(
        'Webhook processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create task watchers for creator and assignee
   */
  private async createTaskWatchers(task: any) {
    const watchers = [];

    try {
      // Add creator as watcher
      if (task.createdBy) {
        const creatorWatcher = await this.prisma.taskWatcher.create({
          data: {
            taskId: task.id,
            accountId: task.createdBy,
            watcherType: TaskWatcherType.CREATOR,
          },
        });
        watchers.push(creatorWatcher);
        this.logger.log(`Added creator watcher for task ${task.id}`);
      }

      // Add assignee as watcher (if different from creator)
      if (task.assignedTo && task.assignedTo !== task.createdBy) {
        const assigneeWatcher = await this.prisma.taskWatcher.create({
          data: {
            taskId: task.id,
            accountId: task.assignedTo,
            watcherType: TaskWatcherType.ASSIGNEE,
          },
        });
        watchers.push(assigneeWatcher);
        this.logger.log(`Added assignee watcher for task ${task.id}`);
      }

      return watchers;
    } catch (error) {
      this.logger.error('Failed to create task watchers:', error);
      throw error;
    }
  }

  /**
   * Send notifications for new task
   */
  private async sendTaskNotifications(task: any) {
    try {

      // Notify assignee if different from creator
      if (task.assignedTo && task.assignedTo !== task.createdBy) {
        // Get assignee details
        const assignee = await this.prisma.account.findUnique({
          where: { id: task.assignedTo },
          select: {
            id: true,
            email: true,
            username: true,
          },
        });

        if (assignee) {
          // Get creator details for notification
          const creator = await this.prisma.account.findUnique({
            where: { id: task.createdBy },
            select: {
              id: true,
              username: true,
            },
          });

          // Send notification using the service's expected signature
          await this.notificationService.sendNotifications(
            task.projectId, // projectId
            task.createdBy, // senderId
            [assignee.id], // receiverIds
            `${creator?.username || 'Someone'} assigned you a task: ${task.name}`, // message
            'TASK_ASSIGNED', // notificationCode
            task.id.toString(), // showDialogId (task ID as string)
          );

          this.logger.log(`Sent notification to assignee ${assignee.username} for task ${task.id}`);
        }
      }

      return { notificationsSent: true };
    } catch (error) {
      this.logger.error('Failed to send task notifications:', error);
      throw error;
    }
  }

  /**
   * Create discussion thread for the task
   */
  private async createDiscussionThread(task: any) {
    try {
      // Emit event for discussion service to handle
      this.eventEmitter.emit(DISCUSSION_EVENTS.CREATE, {
        entityId: task.id,
        entityType: 'task',
        createdBy: task.createdBy,
        title: `Discussion for task: ${task.name}`,
        metadata: {
          taskId: task.id,
          taskName: task.name,
          projectId: task.projectId,
          companyId: task.companyId,
        },
      });

      this.logger.log(`Emitted discussion creation event for task ${task.id}`);

      return { discussionCreated: true };
    } catch (error) {
      this.logger.error('Failed to create discussion thread:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature (to be implemented)
   * Supabase sends HMAC-SHA256 signature for security
   */
  private verifyWebhookSignature(payload: any, signature: string): boolean {
    // TODO: Implement signature verification
    // const secret = process.env.SUPABASE_WEBHOOK_SECRET;
    // const hmac = crypto.createHmac('sha256', secret);
    // hmac.update(JSON.stringify(payload));
    // const computedSignature = hmac.digest('hex');
    // return computedSignature === signature;

    // For now, return true (implement proper verification in production)
    return true;
  }
}