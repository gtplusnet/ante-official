import { SocketService } from '@modules/communication/socket/socket/socket.service';
import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { NotificationFilterDto } from '../../../../dto/notification.validator.dto';
import {
  NotificationsInterface,
  AccountNotificationsInterface,
  NotificationResponse,
  NotificationSender,
  NotificationData,
} from '@shared/response';
import notificationTypeReference from '../../../../reference/notification-type.reference';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { ShowDialogModules } from 'interfaces/showDialogModules.interface';

type NotificationQuery = {
  receiverId: string;
  isDeleted: boolean;
  projectId?: number;
  hasRead?: boolean;
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  @Inject() public utility: UtilityService;
  @Inject() public prisma: PrismaService;
  @Inject() public socketService: SocketService;

  /**
   * Get count of unread notifications for the current user
   * @returns Number of pending notifications
   */
  async getOwnPendingNotificationCount(): Promise<number> {
    const { id } = this.utility.accountInformation;

    return this.prisma.accountNotifications.count({
      where: {
        receiverId: id,
        hasRead: false,
        isDeleted: false,
      },
    });
  }

  /**
   * Send notifications to multiple receivers
   * @param projectId - ID of the related project
   * @param senderId - ID of the notification sender
   * @param receiverIds - Array of receiver account IDs
   * @param notificationsMessage - Content of the notification
   * @param notificationCode - Code identifying notification type
   * @param showDialogId - Optional ID for dialog to show
   */
  async sendNotifications(
    projectId: number | null,
    senderId: string,
    receiverIds: string[],
    notificationsMessage: string,
    notificationCode: string,
    showDialogId?: string,
  ): Promise<void> {
    // Validate notification code and get dialog module
    const { showDialogModule } =
      this.validateNotificationCode(notificationCode);

    // Create notification record
    const notificationsData = await this.createProjectNotification(
      notificationsMessage,
      notificationCode,
      showDialogModule,
      showDialogId,
    );

    // Link notification to accounts - filter out sender to avoid self-notifications
    const filteredReceiverIds = receiverIds.filter(
      (receiverId) => Boolean(receiverId) && receiverId !== senderId, // Filter out null/empty values and sender's own ID
    );
    await this.linkNotificationToReceivers(
      notificationsData.id,
      senderId,
      projectId,
      filteredReceiverIds,
    );

    // Emit notification to clients (excluding sender)
    this.socketService.emitToClients(
      filteredReceiverIds,
      'notification',
      notificationsData,
    );

    this.utility.log(
      `Notification sent to ${filteredReceiverIds.length} accounts`,
    );
  }

  /**
   * Validate notification code and get its dialog module
   * @param notificationCode - Code to validate
   * @returns Object containing the dialog module
   * @throws BadRequestException if code doesn't exist
   */
  private validateNotificationCode(notificationCode: string): {
    showDialogModule: ShowDialogModules;
  } {
    const notificationCodeReference =
      notificationTypeReference[notificationCode];

    if (!notificationCodeReference) {
      const errorMessage = `Notification code ${notificationCode} does not exist`;
      this.logger.error(errorMessage);
      throw new BadRequestException(errorMessage);
    }

    return {
      showDialogModule: notificationCodeReference.showDialogModule,
    };
  }

  /**
   * Link a notification to multiple receiver accounts
   * @param notificationsId - ID of the notification
   * @param senderId - ID of the sender
   * @param projectId - ID of the project
   * @param receiverIds - Array of receiver IDs
   */
  private async linkNotificationToReceivers(
    notificationsId: number,
    senderId: string,
    projectId: number | null,
    receiverIds: string[],
  ): Promise<void> {
    await Promise.all(
      receiverIds.map(async (receiverId) => {
        const accountNotifications: AccountNotificationsInterface = {
          notificationsId,
          senderId,
          receiverId,
          projectId,
        };

        if (!projectId) {
          delete accountNotifications.projectId;
        }

        await this.prisma.accountNotifications.create({
          data: accountNotifications,
        });
      }),
    );
  }

  /**
   * Create a notification record in the database
   * @param notificationMessage - Content of the notification
   * @param notificationCode - Code identifying notification type
   * @param showDialogModule - Module to show in dialog
   * @param showDialogId - Optional ID for dialog to show
   * @returns Created notification data
   */
  async createProjectNotification(
    notificationMessage: string,
    notificationCode: string,
    showDialogModule?: ShowDialogModules,
    showDialogId?: string,
  ): Promise<NotificationsInterface> {
    return this.prisma.notifications.create({
      data: {
        content: notificationMessage,
        code: notificationCode,
        showDialogModule,
        showDialogId,
      },
    });
  }

  /**
   * Get notifications for the currently logged in user
   * @param notificationFilter - Filter criteria for notifications
   * @returns Formatted notification list with references
   */
  async getNotificationsListByLoggedInUser(
    notificationFilter: NotificationFilterDto,
  ): Promise<NotificationResponse[]> {
    const { id } = this.utility.accountInformation;
    const query = this.buildNotificationQuery(id, notificationFilter);

    const notificationsList = await this.prisma.accountNotifications.findMany({
      where: query,
      include: {
        notificationData: true,
        project: true,
        notificationSender: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return this.formatNotificationResponse(notificationsList);
  }

  /**
   * Build query object for notification filtering
   * @param userId - Current user ID
   * @param filter - Filter criteria
   * @returns Query object for Prisma
   */
  private buildNotificationQuery(
    userId: string,
    filter: NotificationFilterDto,
  ): NotificationQuery {
    const query: NotificationQuery = {
      receiverId: userId,
      isDeleted: false,
    };

    if (filter.projectId) {
      query.projectId = Number(filter.projectId);
    }

    if (filter.isRead !== undefined) {
      query.hasRead =
        filter.isRead === true || (filter.isRead as any) === 'true';
    }

    return query;
  }

  /**
   * Format notification list response with references
   * @param notificationsList - Raw notification data from database
   * @returns Formatted notification list
   */
  private formatNotificationResponse(
    notificationsList: Record<string, unknown>[],
  ): NotificationResponse[] {
    const response = this.formatResponseList(notificationsList);
    // Map notification type to the response - already handled in formatNotificationData
    return response;
  }

  /**
   * Mark notifications as read for the current user
   * @param notificationId - Optional specific notification ID to mark as read
   *                        If not provided, all notifications will be marked as read
   */
  async markNotificationAsRead(notificationId?: number): Promise<void> {
    const { id } = this.utility.accountInformation;
    const whereClause = this.buildMarkAsReadQuery(id, notificationId);

    await this.prisma.accountNotifications.updateMany({
      where: whereClause,
      data: { hasRead: true },
    });

    // Notify client about the update
    this.socketService.emitToClients([id], 'notification', { hasRead: true });
  }

  /**
   * Build query for marking notifications as read
   * @param userId - Current user ID
   * @param notificationId - Optional specific notification ID
   * @returns Query object for Prisma
   */
  private buildMarkAsReadQuery(
    userId: string,
    notificationId?: number,
  ): Record<string, unknown> {
    const whereClause: Record<string, unknown> = {
      receiverId: userId,
    };

    if (notificationId) {
      whereClause.notificationsId = Number(notificationId);
    }

    return whereClause;
  }

  private formatResponse(notification: any): NotificationResponse {
    return {
      id: notification.id,
      hasRead: notification.hasRead,
      notificationData: this.formatNotificationData(
        notification.notificationData,
      ),
      notificationSender: this.formatNotificationSender(
        notification.notificationSender,
      ),
      project: notification.project
        ? {
            id: notification.project.id,
            name: notification.project.name,
          }
        : undefined,
    };
  }

  private formatResponseList(notifications: any[]): NotificationResponse[] {
    return notifications.map((notification) =>
      this.formatResponse(notification),
    );
  }

  private formatNotificationData(data: any): NotificationData {
    const code = notificationTypeReference[data.code];

    return {
      id: data.id,
      content: data.content,
      code: code || { key: data.code, message: '', showDialogModule: '' },
      showDialogModule: data.showDialogModule,
      showDialogId: data.showDialogId,
      createdAt: {
        timeAgo: this.utility.formatDate(data.createdAt).timeAgo,
        date: data.createdAt,
      },
      updatedAt: data.updatedAt,
    };
  }

  private formatNotificationSender(sender: any): NotificationSender {
    if (!sender) return null;

    return {
      id: sender.id,
      username: sender.username,
      firstName: sender.firstName,
      lastName: sender.lastName,
      image: sender.image,
    };
  }
}
