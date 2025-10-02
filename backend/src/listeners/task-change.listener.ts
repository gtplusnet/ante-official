import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SocketService } from '@modules/communication/socket/socket/socket.service';

export interface TaskChangeEvent {
  action: 'create' | 'update' | 'delete';
  taskId: number;
  task: any;
  affectedUserIds: string[];
  timestamp: string;
}

@Injectable()
export class TaskChangeListener {
  @Inject() private socketService: SocketService;

  constructor() {
    console.log('[TaskChangeListener] Initialized');
  }

  @OnEvent('task.changed')
  async handleTaskChanged(event: TaskChangeEvent) {
    console.log('[TaskChangeListener] Received task.changed event:', event);
    try {
      // Emit to affected users only
      if (event.affectedUserIds && event.affectedUserIds.length > 0) {
        console.log(
          '[TaskChangeListener] Emitting socket event task-changed to affected users:',
          event.affectedUserIds,
        );
        this.socketService.emitToClients(
          event.affectedUserIds,
          'task-changed',
          event,
        );
      } else {
        console.log(
          '[TaskChangeListener] No affected users found, emitting to all users',
        );
        this.socketService.emitToAll('task-changed', event);
      }

      // Additionally emit a more specific event based on the action
      if (event.action === 'update' && event.task?.boardLane?.key === 'DONE') {
        const completedEvent = {
          taskId: event.taskId,
          task: event.task,
          timestamp: event.timestamp,
        };
        if (event.affectedUserIds && event.affectedUserIds.length > 0) {
          this.socketService.emitToClients(
            event.affectedUserIds,
            'task-completed',
            completedEvent,
          );
        } else {
          this.socketService.emitToAll('task-completed', completedEvent);
        }
      }

      // If it's an approval task that was updated, emit a special event
      if (event.task?.taskType === 'APPROVAL' && event.action === 'update') {
        const approvalEvent = {
          taskId: event.taskId,
          task: event.task,
          timestamp: event.timestamp,
        };
        if (event.affectedUserIds && event.affectedUserIds.length > 0) {
          this.socketService.emitToClients(
            event.affectedUserIds,
            'approval-processed',
            approvalEvent,
          );
        } else {
          this.socketService.emitToAll('approval-processed', approvalEvent);
        }
      }
    } catch (error) {
      console.error('Error in task change listener:', error);
    }
  }
}
