import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SocketService } from '@modules/communication/socket/socket/socket.service';

export interface FilingChangeEvent {
  action: 'create' | 'update' | 'delete';
  filingId: number;
  filing: any;
  affectedUserIds: string[];
  timestamp: string;
}

@Injectable()
export class FilingChangeListener {
  @Inject() private socketService: SocketService;

  constructor() {
    console.log('[FilingChangeListener] Initialized');
  }

  @OnEvent('filing.changed')
  async handleFilingChanged(event: FilingChangeEvent) {
    console.log('[FilingChangeListener] Received filing.changed event:', event);
    try {
      // Emit to affected users only
      if (event.affectedUserIds && event.affectedUserIds.length > 0) {
        console.log(
          '[FilingChangeListener] Emitting socket event filing-updated to affected users:',
          event.affectedUserIds,
        );
        this.socketService.emitToClients(
          event.affectedUserIds,
          'filing-updated',
          event,
        );
      } else {
        console.log(
          '[FilingChangeListener] No affected users found, emitting to all users',
        );
        this.socketService.emitToAll('filing-updated', event);
      }

      // Emit more specific events based on the action
      if (event.action === 'create') {
        const createdEvent = {
          filingId: event.filingId,
          filing: event.filing,
          timestamp: event.timestamp,
        };
        if (event.affectedUserIds && event.affectedUserIds.length > 0) {
          this.socketService.emitToClients(
            event.affectedUserIds,
            'filing-created',
            createdEvent,
          );
        } else {
          this.socketService.emitToAll('filing-created', createdEvent);
        }
      }

      // If filing status changed to approved
      if (event.action === 'update' && event.filing?.status === 'APPROVED') {
        const approvedEvent = {
          filingId: event.filingId,
          filing: event.filing,
          timestamp: event.timestamp,
        };
        if (event.affectedUserIds && event.affectedUserIds.length > 0) {
          this.socketService.emitToClients(
            event.affectedUserIds,
            'filing-approved',
            approvedEvent,
          );
        } else {
          this.socketService.emitToAll('filing-approved', approvedEvent);
        }
      }

      // If filing status changed to rejected
      if (event.action === 'update' && event.filing?.status === 'REJECTED') {
        const rejectedEvent = {
          filingId: event.filingId,
          filing: event.filing,
          timestamp: event.timestamp,
        };
        if (event.affectedUserIds && event.affectedUserIds.length > 0) {
          this.socketService.emitToClients(
            event.affectedUserIds,
            'filing-rejected',
            rejectedEvent,
          );
        } else {
          this.socketService.emitToAll('filing-rejected', rejectedEvent);
        }
      }
    } catch (error) {
      console.error('Error in filing change listener:', error);
    }
  }
}
