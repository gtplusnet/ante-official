import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { WsAdminGuard } from '@common/guards/ws-jwt.guard';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { TopicService } from '@modules/communication/topic/topic/topic.service';
import { AccountSocketDataInterface } from './socket.interface';
import { AccountService } from '@modules/account/account/account.service';

@Injectable()
export class SocketService {
  public readonly connectedClients: Map<string, AccountSocketDataInterface> =
    new Map();
  public io: Server = null;
  public socket: Socket = null;
  private readonly logger = new Logger(SocketService.name);
  @Inject() public topicService: TopicService;

  private readonly wsAdminGuard: WsAdminGuard;

  constructor(
    private readonly prisma: PrismaService,
    private readonly utilityService: UtilityService,
    private readonly accountService: AccountService,
  ) {
    this.wsAdminGuard = new WsAdminGuard(
      prisma,
      utilityService,
      accountService,
    );
  }

  async handleConnection(socket: Socket): Promise<void> {
    const clientId = socket.id;
    const { token } = socket.handshake.auth?.token
      ? socket.handshake.auth
      : socket.handshake.headers;

    // Check if token is present
    if (!token) {
      socket.disconnect();
      return;
    }

    const checkToken = await this.wsAdminGuard.authenticateClient(token);

    // Check if token is valid
    if (!checkToken) {
      socket.disconnect();
      return;
    }

    // Get account information for this specific connection
    const accountInformation = await this.accountService.getAccountInformation({
      id: checkToken.accountId,
    });
    if (!accountInformation) {
      socket.disconnect();
      return;
    }

    const { id: accountId } = accountInformation;

    // Join the global topic
    this.topicService.joinTopic(socket, 'GLOBAL_TOPIC');
    this.topicService.broadcastWelcome(socket, 'GLOBAL_TOPIC', clientId);

    const {
      role: { roleGroup },
    } = accountInformation;
    this.topicService.joinTopicPerRoleGroup(socket, roleGroup);

    const projectList = await this.prisma.project.findMany();

    // Join topics per project
    if (projectList.length > 0) {
      const projectNames = projectList.map((project) => ({
        name: project.name,
      }));
      this.topicService.joinTopicsPerProject(socket, projectNames);
    }

    // If the account is not in the connected clients map, add it
    if (!this.connectedClients.has(accountId)) {
      const accountSocketData: AccountSocketDataInterface = {
        ...accountInformation,
        socket: [],
      };
      this.connectedClients.set(accountId, accountSocketData);
    }

    // Add the socket to the account
    const accountData = this.connectedClients.get(accountId);
    if (accountData && accountData.socket) {
      accountData.socket.push(socket);
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      const socketsForAccount = this.connectedClients.get(accountId);
      if (socketsForAccount) {
        const index = socketsForAccount.socket.indexOf(socket);
        if (index !== -1) {
          socketsForAccount.socket.splice(index, 1);
        }
        if (socketsForAccount.socket.length === 0) {
          this.connectedClients.delete(accountId);
        }
      }
    });

    this.socket = socket;
  }

  async joinRoom(topicName: string): Promise<boolean> {
    if (this.socket && !this.socket.rooms?.has(topicName)) {
      await this.socket.join(topicName);
      this.utilityService.log(
        `${this.utilityService.accountInformation.username} has joined Room (${topicName})`,
      );
      return false;
    }

    return true;
  }
  async exitRoom(topicName: string): Promise<void> {
    await this.socket.leave(topicName);
  }
  isRoomExist(topicName: string): boolean {
    return this.socket.rooms.has(topicName);
  }

  async sendToRoom(
    topicName: string,
    eventName: string,
    payload: any,
  ): Promise<void> {
    await this.broadcastToRoom(topicName, eventName, payload);
  }

  getSocketsByAccountId(accountId: string): Socket[] | undefined {
    return this.connectedClients.get(accountId).socket;
  }

  emitToAll(eventName: string, payload: any): void {
    console.log(`[SocketService] emitToAll called for event: ${eventName}`);
    console.log(`[SocketService] io instance available: ${!!this.io}`);

    if (!this.io) {
      console.error('[SocketService] Socket.io instance is not available!');
      throw new BadRequestException('Socket.io instance is not available.');
    }

    console.log(`[SocketService] Emitting ${eventName} to all clients`);
    console.log(
      `[SocketService] Connected sockets count:`,
      this.io.sockets.sockets.size,
    );
    this.io.emit(eventName, payload);
    console.log(`[SocketService] Event ${eventName} emitted successfully`);
  }
  emitToClients(accountIds: string[], eventName: string, payload: any): void {
    console.log(
      `[SocketService] emitToClients called for event: ${eventName} to users:`,
      accountIds,
    );

    if (!this.io) {
      console.error('[SocketService] Socket.io instance is not available!');
      throw new BadRequestException('Socket.io instance is not available.');
    }

    console.log(
      `[SocketService] Connected clients:`,
      Array.from(this.connectedClients.keys()),
    );

    let emittedCount = 0;
    accountIds.forEach((accountId) => {
      const account = this.connectedClients.get(accountId);

      if (account) {
        console.log(
          `[SocketService] Found account ${account.username} with ${account.socket?.length || 0} sockets`,
        );
        account.socket.forEach((socket) => {
          this.utilityService.log(
            `${account.username} received a socket.io emit for ${eventName}.`,
          );
          socket.emit(eventName, payload);
          emittedCount++;
        });
      } else {
        console.log(
          `[SocketService] Account ${accountId} not found in connected clients`,
        );
      }
    });

    console.log(
      `[SocketService] Event ${eventName} emitted to ${emittedCount} sockets`,
    );
  }

  async broadcastToRoom(
    roomName: string,
    eventName: string,
    payload: any,
  ): Promise<void> {
    if (!roomName) {
      throw new BadRequestException('Room name is not available.');
    }

    // Skip broadcasting if Socket.io is not initialized (e.g., during HTTP requests)
    if (!this.io) {
      this.logger.warn(
        `Socket.io not initialized. Skipping broadcast to room ${roomName} for event ${eventName}`,
      );
      return;
    }

    this.io.to(roomName).emit(eventName, payload);
  }

  emitToCompany(companyId: number, eventName: string, payload: any): void {
    if (!this.io) {
      throw new BadRequestException('Socket.io instance is not available.');
    }
    this.connectedClients.forEach((account) => {
      if (account.company && account.company.id === companyId) {
        account.socket?.forEach((socket) => {
          this.utilityService.log(
            `${account.username} (company ${companyId}) received a socket.io emit.`,
          );
          socket.emit(eventName, payload);
        });
      }
    });
  }
}
