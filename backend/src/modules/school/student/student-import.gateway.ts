import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

export interface ImportProgressData {
  sessionId: string;
  current: number;
  total: number;
  percentage: number;
  studentName?: string;
  status: 'processing' | 'success' | 'error' | 'complete';
  message?: string;
  error?: string;
  row?: number;
  action?: 'created' | 'updated'; // Added to track action type in progress
}

export interface ImportResultData {
  sessionId: string;
  successCount: number;
  createdCount?: number;
  updatedCount?: number;
  errorCount: number;
  errors: Array<{
    row: number;
    studentName: string;
    message: string;
  }>;
  successes: Array<{
    row: number;
    studentName: string;
    studentNumber: string;
    action?: 'created' | 'updated';
  }>;
}

@Injectable()
@WebSocketGateway({
  namespace: '/student-import',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class StudentImportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(StudentImportGateway.name);
  private importSessions = new Map<string, Socket>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Get session ID from query params
    const sessionId = client.handshake.query.sessionId as string;
    if (sessionId) {
      this.importSessions.set(sessionId, client);
      client.join(`import-${sessionId}`);
      this.logger.log(`Client ${client.id} joined import session: ${sessionId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove from import sessions
    for (const [sessionId, socket] of this.importSessions.entries()) {
      if (socket.id === client.id) {
        this.importSessions.delete(sessionId);
        break;
      }
    }
  }

  /**
   * Send progress update to specific import session
   */
  sendProgress(sessionId: string, data: ImportProgressData) {
    this.server.to(`import-${sessionId}`).emit('import-progress', data);
    
    // Log progress
    if (data.status === 'processing') {
      this.logger.debug(
        `Import progress [${sessionId}]: ${data.current}/${data.total} - Processing ${data.studentName}`
      );
    }
  }

  /**
   * Send success notification for a single student
   */
  sendStudentSuccess(sessionId: string, data: {
    row: number;
    studentName: string;
    studentNumber: string;
    current: number;
    total: number;
    action?: 'created' | 'updated';
  }) {
    const progressData: ImportProgressData = {
      sessionId,
      current: data.current,
      total: data.total,
      percentage: Math.round((data.current / data.total) * 100),
      studentName: data.studentName,
      status: 'success',
      message: `Successfully ${data.action === 'updated' ? 'updated' : 'imported'} ${data.studentName}`,
      row: data.row,
      action: data.action,
    };
    
    this.sendProgress(sessionId, progressData);
  }

  /**
   * Send error notification for a single student
   */
  sendStudentError(sessionId: string, data: {
    row: number;
    studentName?: string;
    error: string;
    current: number;
    total: number;
  }) {
    const progressData: ImportProgressData = {
      sessionId,
      current: data.current,
      total: data.total,
      percentage: Math.round((data.current / data.total) * 100),
      studentName: data.studentName,
      status: 'error',
      error: data.error,
      row: data.row,
    };
    
    this.sendProgress(sessionId, progressData);
  }

  /**
   * Send import completion notification
   */
  sendImportComplete(sessionId: string, result: ImportResultData) {
    let message = 'Import complete: ';
    if (result.createdCount !== undefined && result.updatedCount !== undefined) {
      message += `${result.createdCount} created, ${result.updatedCount} updated`;
      if (result.errorCount > 0) {
        message += `, ${result.errorCount} failed`;
      }
    } else {
      message += `${result.successCount} succeeded, ${result.errorCount} failed`;
    }
    
    const progressData: ImportProgressData = {
      sessionId,
      current: result.successCount + result.errorCount,
      total: result.successCount + result.errorCount,
      percentage: 100,
      status: 'complete',
      message,
    };
    
    this.server.to(`import-${sessionId}`).emit('import-progress', progressData);
    this.server.to(`import-${sessionId}`).emit('import-complete', result);
    
    // Clean up session
    this.importSessions.delete(sessionId);
  }

  /**
   * Handle import cancellation
   */
  cancelImport(sessionId: string) {
    this.server.to(`import-${sessionId}`).emit('import-cancelled', { sessionId });
    this.importSessions.delete(sessionId);
  }
}