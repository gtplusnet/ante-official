import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { payload } from './types/socket.type';
import {
  Inject,
  Injectable,
  Logger,
  UseInterceptors,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { BoardLaneService } from '@modules/project/board/board-lane/board-lane.service';
import { UtilityService } from '@common/utility.service';
import { WsResponseInterceptor } from '../../../../interceptors/ws.response.interceptor';
import { WsExceptionFilter } from '../../../../filters/ws.exception.filter';
import { CustomWsException } from '../../../../filters/custom-ws.exception';
import { Socket } from 'socket.io';
import { WsAdminGuard } from '@common/guards/ws-jwt.guard';
import { SocketService } from './socket.service';
import { TaskService } from '@modules/project/task/task/task.service';
import { BoqService } from '@modules/project/boq/boq/boq.service';
import {
  BoardLaneCreateDto,
  BoardLaneIdDto,
  BoardLaneUpdateDto,
} from '../../../../dto/board-lane.validator.dto';
import { AiChatService } from '@integrations/ai-chat/ai-chat/ai-chat.service';
import { AiChatMessagePayload } from './types/socket.type';
import { DiscussionService } from '@modules/communication/discussion/discussion/discussion.service';

@UseInterceptors(WsResponseInterceptor)
@UseFilters(WsExceptionFilter)
@UseGuards(WsAdminGuard)
@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins with explicit wildcard
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: '*', // Allow ANY header
  },
})
@Injectable()
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SocketGateway.name);
  @Inject() public prisma: PrismaService;
  @Inject() public boardLaneService: BoardLaneService;
  @Inject() public utilityService: UtilityService;
  @Inject() public taskService: TaskService;
  @Inject() private socketService: SocketService;
  @Inject() private boqService: BoqService;
  @Inject() private aiChatService: AiChatService;
  @Inject() private discussionService: DiscussionService;

  private globalRoomUsers = new Set<string>();
  private socketRooms = new Map<string, Set<string>>();

  @WebSocketServer() server: Server;

  afterInit(server: Server): void {
    console.log('[SocketGateway] afterInit called, setting io instance');
    this.socketService.io = server;
    console.log('[SocketGateway] io instance set successfully');
  }

  async handleConnection(client: Socket) {
    this.utilityService.log('Socket connected: ' + client.id);

    // Add a catch-all listener to log all events
    client.onAny((eventName, ...args) => {
      this.logger.log(`[SOCKET EVENT] Received event: ${eventName} from client: ${client.id}`);
      if (eventName === 'ai_chat_message') {
        this.logger.log(`[SOCKET EVENT] AI Chat message data: ${JSON.stringify(args)}`);
      }
    });

    await this.socketService.handleConnection(client);
  }

  handleDisconnect(client: Socket) {
    if (client.id) {
      // Clean up tracked rooms
      if (this.socketRooms.has(client.id)) {
        this.socketRooms.delete(client.id);
      }

      //console.log(this.globalRoomUsers);
      this.utilityService.log('Socket disconnected: ' + client.id);
    }
  }

  @SubscribeMessage('CREATE_BOARD_LANE')
  async handleCreateBoardLane(
    @MessageBody() dataPayload: payload<BoardLaneCreateDto>,
  ) {
    try {
      const { data } = dataPayload;

      const createBoardLaneData =
        await this.boardLaneService.createBoardLane(data);

      this.logger.log(`BoardLane Successfully created`);
      return createBoardLaneData;
    } catch (error) {
      this.logger.error(`Error creating board lane: ${error.message}`);
      throw new CustomWsException(
        500,
        'An error occurred while creating the board lane.',
        'CREATE_BOARD_LANE_ERROR',
      );
    }
  }

  @SubscribeMessage('FETCH_BOARD_LANE')
  async handleFetchBoardLane(@MessageBody() requestPayload) {
    try {
      const { data } = requestPayload;
      const boardLaneData = await this.boardLaneService.getBoardLanes(
        data.projectId,
      );
      return boardLaneData;
    } catch (error) {}
  }

  @SubscribeMessage('UPDATE_BOARD_LANE_INFORMATION')
  async handleUpdateBoardLaneInformation(
    @MessageBody() requestPayload: payload<BoardLaneUpdateDto>,
  ) {
    try {
      const { data } = requestPayload;
      const updatedBoardLaneInformation =
        await this.boardLaneService.updateBoardLaneInformation(data);
      return updatedBoardLaneInformation;
    } catch (error) {
      this.logger.error(`Error in updating board lane: ${error.message}`);
      throw new CustomWsException(
        500,
        'An error occurred while creating the board lane.',
        'UPDATE_BOARD_LANE_INFORMATION_ERROR',
      );
    }
  }

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() payload: string) {
    this.logger.log(`Message received: ${payload}`);
    this.server.emit('message_response', payload);
  }

  @SubscribeMessage('DELETE_BOARD_LANE')
  async handleDeleteBoardLane(
    @MessageBody() requestPayload: payload<BoardLaneIdDto>,
  ) {
    try {
      const { data } = requestPayload;
      const updatedBoardLaneInformation =
        await this.boardLaneService.deleteBoardLane(data);
      this.logger.log(`BoardLane Successfully deleted`);
      return updatedBoardLaneInformation;
    } catch (error) {
      this.logger.error(`Error in deleting board lane: ${error.message}`);
      throw new CustomWsException(
        500,
        'An error occurred while creating the board lane.',
        'DELETE_BOARD_LANE_ERROR',
      );
    }
  }

  @SubscribeMessage('DRAG_BOARD_LANE')
  async handleBoardLaneOrder(@MessageBody() requestPayload) {
    try {
      const {
        data: { newItems },
      } = requestPayload;

      const boardLaneOrder =
        await this.boardLaneService.reOrderBoardLanes(newItems);
      return boardLaneOrder;
    } catch (error) {
      this.logger.error(`Error in moving board lane: ${error.message}`);
      throw new CustomWsException(
        500,
        'An error occurred while creating the board lane.',
        'DRAG_BOARD_LANE_ERROR',
      );
    }
  }

  @SubscribeMessage('CREATE_TASK')
  async handleCreateTask(@MessageBody() requestPayload) {
    try {
      const { data } = requestPayload;
      const createTask = await this.taskService.createAndAssignTask(data);

      return createTask;
    } catch (error) {
      this.logger.error(`Error in creating task: ${error.message}`);
      throw new CustomWsException(
        500,
        'An error occurred while creating the task.',
        'CREATE_TASK_ERROR',
      );
    }
  }

  @SubscribeMessage('UPDATE_TASK')
  async handleUpdateTask(@MessageBody() requestPayload) {
    try {
      requestPayload;
      //const updateTaskInformation =
      //await this.taskService.updateTaskInformation(data);
      //return updateTaskInformation;
    } catch (error) {
      this.logger.error(`Error in updating task  ${error.message}`);
      throw new CustomWsException(
        500,
        'An error occurred while updating the task lane.',
        'UPDATE_TASK_ERROR',
      );
    }
  }

  @SubscribeMessage('DELETE_TASK')
  async handleDeleteTask(@MessageBody() requestPayload) {
    try {
      const { data } = requestPayload;
      const updatedTaskInformation = await this.taskService.deleteTask(data);
      this.logger.log(`Task Successfully deleted`);
      return updatedTaskInformation;
    } catch (error) {
      this.logger.error(`Error in deleting task lane: ${error.message}`);
      throw new CustomWsException(
        500,
        'An error occurred while creating the task lane.',
        'DELETE_TASK_ERROR',
      );
    }
  }

  @SubscribeMessage('DRAG_TASK_VERTICAL')
  async handleDragTaskVertical(@MessageBody() requestPayload) {
    try {
      const {
        data: { newItems },
      } = requestPayload;

      const taskOrderVertical =
        await this.taskService.reOrderTaskVertical(newItems);
      this.logger.log(`Successfully dragged task vertical`);
      return taskOrderVertical;
    } catch (error) {
      this.logger.error(`Error in moving task lane: ${error.message}`);
      throw new CustomWsException(
        500,
        'An error occurred while creating the task lane.',
        'DRAG_TASK_VERTICAL_ERROR',
      );
    }
  }

  /* BOQ Gateways */
  @SubscribeMessage('BOQ_RELOAD')
  async handleBoqReload(@MessageBody() requestPayload) {
    try {
      await this.boqService.reloadBoq(requestPayload.data.boqId);
      return { status: 'success' };
    } catch (error) {
      this.handleError('Error in reloading BOQ');
    }
  }

  @SubscribeMessage('BOQ_UPDATE')
  async handleBoqUpdate(@MessageBody() requestPayload) {
    try {
      this.boqService.updateBoqInformation(
        requestPayload.data.boqId,
        requestPayload.data.params,
      );
      return {
        status: 'success',
        message: 'BOQ Information Successfully Updated.',
      };
    } catch (error) {
      this.handleError('Error in joining BOQ room');
    }
  }

  @SubscribeMessage('BOQ_JOIN')
  async handleBOQJoin(@MessageBody() requestPayload) {
    try {
      this.boqService.joinRoom(requestPayload.data.boqId);
    } catch (error) {
      this.handleError('Error in joining BOQ room');
    }
  }

  @SubscribeMessage('BOQ_LEAVE')
  async handleBOQLeave(@MessageBody() requestPayload) {
    try {
      this.boqService.exitRoom(requestPayload.data.boqId);
      return { status: 'success' };
    } catch (error) {
      this.handleError('Error in leaving BOQ room');
    }
  }

  @SubscribeMessage('BOQ_ADD_ITEM')
  async handleBoqAddItem(@MessageBody() requestPayload) {
    try {
      this.boqService.addItem(
        requestPayload.data.boqId,
        requestPayload.data.params,
      );
      return { status: 'success' };
    } catch (error) {
      this.handleError('Error in adding item to BOQ');
    }
  }

  @SubscribeMessage('BOQ_DELETE_ITEM')
  async handleBoqDeleteItem(@MessageBody() requestPayload) {
    try {
      this.boqService.deleteItem(
        requestPayload.data.boqId,
        requestPayload.data.params,
      );
      return { status: 'success' };
    } catch (error) {
      this.handleError('Error in adding item to BOQ');
    }
  }

  @SubscribeMessage('BOQ_EDIT_ITEM')
  async handleBoqEditItem(@MessageBody() requestPayload) {
    try {
      this.boqService.editItem(
        requestPayload.data.boqId,
        requestPayload.data.params,
      );
      return { status: 'success' };
    } catch (error) {
      this.handleError('Error in adding item to BOQ');
    }
  }

  @SubscribeMessage('BOQ_MOVE_ITEM')
  async handleBoqMoveItem(@MessageBody() requestPayload) {
    try {
      this.boqService.moveItem(
        requestPayload.data.boqId,
        requestPayload.data.params,
      );
      return { status: 'success' };
    } catch (error) {
      this.handleError('Error in adding item to BOQ');
    }
  }

  @SubscribeMessage('BOQ_CHANGE_COLOR')
  async handleBoqChangeColor(@MessageBody() requestPayload) {
    try {
      this.boqService.changeColor(
        requestPayload.data.boqId,
        requestPayload.data.params,
      );
      return { status: 'success' };
    } catch (error) {
      this.handleError('Error in adding item to BOQ');
    }
  }

  @SubscribeMessage('BOQ_LOCK')
  async handleBoqLock(@MessageBody() requestPayload) {
    try {
      this.boqService.lockBoq(
        requestPayload.data.boqId,
        requestPayload.data.isLock,
      );
      return { status: 'success' };
    } catch (error) {
      this.handleError('Error in adding item to BOQ');
    }
  }

  @SubscribeMessage('ai_chat_message')
  async handleAiChatMessage(
    @MessageBody() dataPayload: payload<AiChatMessagePayload>,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`[AI CHAT] Received message from client ${client.id}`);
    this.logger.log(`[AI CHAT] Payload: ${JSON.stringify(dataPayload)}`);

    try {
      // Get account info from socket client data (set by WsAdminGuard)
      const account = client.data?.account;
      this.logger.log(`[AI CHAT] Account info: ${account ? account.id : 'null'}`);

      if (!account) {
        this.logger.error('[AI CHAT] No account information found in client data');
        throw new Error('Unauthorized - account information not available');
      }

      this.logger.log(`[AI CHAT] Calling AI service...`);
      // Store user message and get AI response
      // Pass account info to avoid CLS dependency in WebSocket context
      const { userMessage, aiMessage } =
        await this.aiChatService.addMessageForAccount(
          dataPayload.data.role,
          dataPayload.data.content,
          account.id,
          'gemini', // default provider
          undefined, // default model
          account, // pass account info directly
        );

      this.logger.log(`[AI CHAT] Got response from AI service`);

      // Emit user message
      this.server.to(client.id).emit('ai_chat_message', {
        message: 'user',
        data: {
          role: userMessage.role,
          content: userMessage.content,
          createdAt: userMessage.createdAt.toISOString(),
        },
      });

      this.logger.log(`[AI CHAT] Emitting assistant message`);
      this.server.to(client.id).emit('ai_chat_message', {
        message: 'assistant',
        data: {
          role: aiMessage.role,
          content: aiMessage.content,
          createdAt: aiMessage.createdAt.toISOString(),
        },
      });

      this.logger.log(`[AI CHAT] Message handling completed successfully`);
    } catch (error) {
      this.logger.error(`[AI CHAT] Error: ${error.message}`);
      this.utilityService.error(`AI chat error: ${error.stack}`);
      this.server.to(client.id).emit('ai_chat_message', {
        message: 'error',
        data: {
          role: 'assistant',
          content: 'An error occurred while processing your message.',
          createdAt: new Date().toISOString(),
        },
      });
    }
  }

  private async handleError(defaultMessage: string) {
    this.utilityService.error(defaultMessage);
  }

  /**
   * Handle joining a discussion room
   */
  @SubscribeMessage('join-discussion')
  async handleJoinDiscussion(
    @MessageBody() payload: { discussionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const accountId =
        client.data?.accountId || this.utilityService.accountInformation?.id;
      if (!accountId) {
        throw new Error('Unauthorized: Account ID not found');
      }

      // Verify user can access this discussion
      const canAccess = await this.discussionService.canAccessDiscussion(
        payload.discussionId,
        accountId,
      );
      if (!canAccess) {
        throw new Error('Access denied to this discussion');
      }

      const roomName = `discussion:${payload.discussionId}`;
      await client.join(roomName);

      // Track room membership for reconnection
      if (!this.socketRooms.has(client.id)) {
        this.socketRooms.set(client.id, new Set());
      }
      this.socketRooms.get(client.id).add(roomName);

      // Send current unread count
      const unreadCount = await this.discussionService.getUnreadCount(
        payload.discussionId,
        accountId,
      );
      client.emit(`discussion:${payload.discussionId}:unread-count`, {
        count: unreadCount,
      });

      this.logger.log(
        `Client ${client.id} joined discussion room: ${roomName}`,
      );
      return { status: 'joined', discussionId: payload.discussionId };
    } catch (error) {
      this.logger.error(`Error joining discussion room: ${error.message}`);
      throw new CustomWsException(403, error.message, 'JOIN_DISCUSSION_ERROR');
    }
  }

  /**
   * Handle leaving a discussion room
   */
  @SubscribeMessage('leave-discussion')
  async handleLeaveDiscussion(
    @MessageBody() payload: { discussionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const roomName = `discussion:${payload.discussionId}`;
      await client.leave(roomName);

      // Remove from tracked rooms
      if (this.socketRooms.has(client.id)) {
        this.socketRooms.get(client.id).delete(roomName);
      }

      this.logger.log(`Client ${client.id} left discussion room: ${roomName}`);
      return { status: 'left', discussionId: payload.discussionId };
    } catch (error) {
      this.logger.error(`Error leaving discussion room: ${error.message}`);
      throw new CustomWsException(500, error.message, 'LEAVE_DISCUSSION_ERROR');
    }
  }

  /**
   * Handle socket reconnection - rejoin previous rooms
   */
  @SubscribeMessage('reconnect-discussions')
  async handleReconnectDiscussions(
    @MessageBody() payload: { discussionIds: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const accountId =
        client.data?.accountId || this.utilityService.accountInformation?.id;
      if (!accountId) {
        throw new Error('Unauthorized: Account ID not found');
      }

      const joinedRooms: string[] = [];

      for (const discussionId of payload.discussionIds) {
        const canAccess = await this.discussionService.canAccessDiscussion(
          discussionId,
          accountId,
        );
        if (canAccess) {
          const roomName = `discussion:${discussionId}`;
          await client.join(roomName);
          joinedRooms.push(discussionId);

          // Track room
          if (!this.socketRooms.has(client.id)) {
            this.socketRooms.set(client.id, new Set());
          }
          this.socketRooms.get(client.id).add(roomName);
        }
      }

      return { status: 'reconnected', joinedRooms };
    } catch (error) {
      this.logger.error(
        `Error reconnecting to discussion rooms: ${error.message}`,
      );
      throw new CustomWsException(
        500,
        error.message,
        'RECONNECT_DISCUSSIONS_ERROR',
      );
    }
  }
}
