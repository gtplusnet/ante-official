import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { TaskProcessingJobData } from '../infrastructure/queues/processors/task-queue.processor';

@Injectable()
export class TaskRealtimeListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TaskRealtimeListener.name);
  private supabase: SupabaseClient;
  private taskChannel: RealtimeChannel;
  private isEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue('task-processing') private readonly taskQueue: Queue<TaskProcessingJobData>,
  ) {
    this.isEnabled = this.configService.get('ENABLE_TASK_REALTIME', 'false') === 'true';
  }

  async onModuleInit() {
    if (!this.isEnabled) {
      this.logger.log('Task realtime listener is disabled via ENABLE_TASK_REALTIME env variable');
      return;
    }

    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      this.logger.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. Task realtime listener disabled.');
      return;
    }

    try {
      // Initialize Supabase client with service key (backend only)
      this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      // Subscribe to Task table changes
      this.taskChannel = this.supabase
        .channel('task-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'Task',
          },
          async (payload) => {
            await this.handleTaskInsert(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'Task',
          },
          async (payload) => {
            await this.handleTaskUpdate(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.logger.log('✅ Successfully subscribed to Task table realtime changes');
            console.log('=== TASK REALTIME LISTENER ACTIVE ===');
            console.log('Listening for INSERT and UPDATE events on Task table');
            console.log('=====================================');
          } else {
            this.logger.log(`Subscription status: ${status}`);
          }
        });

    } catch (error) {
      this.logger.error('Failed to initialize Supabase realtime listener:', error);
    }
  }

  async onModuleDestroy() {
    if (this.taskChannel) {
      await this.supabase.removeChannel(this.taskChannel);
      this.logger.log('Task realtime listener disconnected');
    }
  }

  private async handleTaskInsert(payload: any) {
    const task = payload.new;
    const taskId = task.id;

    this.logger.log(`New task detected via Supabase realtime: ${taskId}`);
    console.log('=== NEW TASK DETECTED (Supabase Realtime) ===');
    console.log(`Task ID: ${taskId}`);
    console.log(`Title: ${task.title || 'Unknown'}`);
    console.log(`Created By ID: ${task.createdById}`);
    console.log(`Assigned To ID: ${task.assignedToId || 'Unassigned'}`);
    console.log('==============================================');

    try {
      // Add job to queue with deduplication via jobId
      const jobId = `task-created-${taskId}`;

      const job = await this.taskQueue.add(
        'process-new-task',
        {
          taskId: taskId,
          task: task,
          action: 'created',
          createdAt: new Date().toISOString(),
        },
        {
          jobId: jobId, // This ensures deduplication across multiple backend instances
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );

      this.logger.log(`Added job ${job.id} to queue for new task ${taskId}`);
      console.log(`✅ Job added to queue with ID: ${job.id} (deduplication key: ${jobId})`);

    } catch (error) {
      // If job already exists (duplicate), this is expected with multiple instances
      if (error.message?.includes('already exists')) {
        this.logger.log(`Job for task ${taskId} already exists in queue (expected with multiple instances)`);
        console.log(`ℹ️  Job for task ${taskId} already in queue (deduplication working correctly)`);
      } else {
        this.logger.error(`Failed to add job to queue for task ${taskId}:`, error);
        console.error('Error adding job to queue:', error);
      }
    }
  }

  private async handleTaskUpdate(payload: any) {
    const task = payload.new;
    const oldTask = payload.old;
    const taskId = task.id;

    // Log significant updates (you can customize what's considered significant)
    if (oldTask.status !== task.status || oldTask.assignedToId !== task.assignedToId) {
      this.logger.log(`Task ${taskId} updated: status or assignment changed`);
      console.log('=== TASK UPDATED (Supabase Realtime) ===');
      console.log(`Task ID: ${taskId}`);
      console.log(`Title: ${task.title}`);

      if (oldTask.status !== task.status) {
        console.log(`Status: ${oldTask.status} → ${task.status}`);
      }

      if (oldTask.assignedToId !== task.assignedToId) {
        console.log(`Assigned To: ${oldTask.assignedToId || 'None'} → ${task.assignedToId || 'None'}`);
      }
      console.log('=========================================');

      // You can add update processing to queue if needed
      // For now, we're focusing on task creation
    }
  }
}