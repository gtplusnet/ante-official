import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GuardianWsAuthGuard } from '../guards/guardian-ws-auth.guard';
import { PrismaService } from '@common/prisma.service';

@WebSocketGateway(+process.env.SOCKET_PORT || 4000, {
  cors: {
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'token',
      'sentry-trace',
      'baggage',
    ],
  },
  namespace: '/guardian', // Use guardian namespace on same port
})
export class GuardianAttendanceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GuardianAttendanceGateway.name);
  private guardianSockets: Map<string, Set<string>> = new Map(); // guardianId -> Set of socket IDs

  constructor(private prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client attempting to connect: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove socket from guardian mapping
    const guardianId = client.data.guardianId;
    if (guardianId) {
      const sockets = this.guardianSockets.get(guardianId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.guardianSockets.delete(guardianId);
        }
      }
    }
  }

  @UseGuards(GuardianWsAuthGuard)
  @SubscribeMessage('guardian:authenticate')
  async handleAuthentication(
    @ConnectedSocket() client: Socket,
    @MessageBody() _token: string,
  ) {
    try {
      // Guard will validate token and set client.data
      const guardianId = client.data.guardianId;

      if (!guardianId) {
        this.logger.error('Guardian ID not set by auth guard');
        throw new WsException('Authentication failed - no guardian ID');
      }

      // Add socket to guardian mapping
      if (!this.guardianSockets.has(guardianId)) {
        this.guardianSockets.set(guardianId, new Set());
      }
      this.guardianSockets.get(guardianId).add(client.id);

      // Join guardian-specific room
      const room = `guardian:${guardianId}`;
      await client.join(room);

      // Verify room join
      const roomSockets = await this.server.in(room).fetchSockets();
      this.logger.log(
        `Guardian ${guardianId} joined room ${room} - room now has ${roomSockets.length} sockets`,
      );

      // Send authentication success
      client.emit('guardian:authenticated', { guardianId });
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      throw new WsException('Authentication failed');
    }
  }

  @UseGuards(GuardianWsAuthGuard)
  @SubscribeMessage('guardian:join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() guardianId: string,
  ) {
    // Verify guardian can only join their own room
    if (client.data.guardianId !== guardianId) {
      throw new WsException('Unauthorized room access');
    }

    client.join(`guardian:${guardianId}`);
    this.logger.log(`Guardian ${guardianId} joined their room`);
  }

  // Method to emit attendance status updates to specific guardians
  async emitAttendanceStatusUpdate(guardianIds: string[], data: any) {
    if (!this.server) {
      this.logger.error('Socket server not initialized');
      return;
    }

    for (const guardianId of guardianIds) {
      const room = `guardian:${guardianId}`;
      const roomSockets = await this.server.in(room).fetchSockets();
      this.logger.log(
        `Emitting attendance:status_update to room ${room} (${roomSockets.length} sockets)`,
      );
      this.server.to(room).emit('attendance:status_update', data);
    }
  }

  // Method to emit new attendance logs to specific guardians
  async emitNewAttendanceLog(guardianIds: string[], data: any) {
    if (!this.server) {
      this.logger.error('Socket server not initialized');
      return;
    }

    for (const guardianId of guardianIds) {
      const room = `guardian:${guardianId}`;
      const roomSockets = await this.server.in(room).fetchSockets();
      this.logger.log(
        `Emitting attendance:new_log to room ${room} (${roomSockets.length} sockets)`,
      );
      this.server.to(room).emit('attendance:new_log', data);
    }
  }

  // Get all connected guardian IDs
  getConnectedGuardians(): string[] {
    return Array.from(this.guardianSockets.keys());
  }

  // Check if a guardian is connected
  isGuardianConnected(guardianId: string): boolean {
    const sockets = this.guardianSockets.get(guardianId);
    return sockets ? sockets.size > 0 : false;
  }
}
