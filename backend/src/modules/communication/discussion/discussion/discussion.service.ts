import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { AccountService } from '@modules/account/account/account.service';
import { NotificationService } from '@modules/communication/notification/notification/notification.service';
import { SocketService } from '@modules/communication/socket/socket/socket.service';
import {
  CreateDiscussionMessageDto,
  EditDiscussionMessageDto,
} from './discussion.interface';
import {
  DiscussionMessageResponse,
  DiscussionResponse,
} from '../../../../shared/response/discussion.response';
import { FileDataResponse } from '../../../../shared/response/file.response';
import { Discussion, DiscussionMessage, Prisma, Files } from '@prisma/client';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';

@Injectable()
export class DiscussionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject() public utilityService: UtilityService,
    @Inject() public tableHandlerService: TableHandlerService,
    @Inject() public accountService: AccountService,
    @Inject() public notificationService: NotificationService,
    @Inject(forwardRef(() => SocketService))
    public socketService: SocketService,
  ) {}

  /**
   * Centralized response formatter for DiscussionMessage
   */
  /**
   * Extract account IDs from @mention tags in message content
   * @param content The message content with potential mentions
   * @returns Array of account IDs that were mentioned
   */
  private extractMentionedAccountIds(content: string): string[] {
    if (!content) return [];

    // Extract all mentions with format <mention class="mention" id="userId">@username</mention>
    const mentionRegex = /<mention[^>]*?id="([^"]+)"[^>]*?>@[^<]+<\/mention>/g;
    const matches = content.matchAll(mentionRegex);

    const accountIds: string[] = [];
    for (const match of matches) {
      if (match[1]) {
        accountIds.push(match[1]);
      }
    }

    return accountIds;
  }

  /**
   * Add an account as a watcher for a discussion if they aren't already watching
   * @param accountId The account ID to add as a watcher
   * @param discussionId The discussion ID to watch
   */
  private async addDiscussionWatcher(
    accountId: string,
    discussionId: string,
  ): Promise<void> {
    const existingWatcher = await this.prisma.discussionWatchers.findUnique({
      where: {
        accountId_discussionId: {
          accountId,
          discussionId,
        },
      },
    });

    if (!existingWatcher) {
      await this.prisma.discussionWatchers.create({
        data: {
          accountId,
          discussionId,
        },
      });
    }
  }

  async formatResponse(
    message: DiscussionMessage & { files?: Files | null },
  ): Promise<DiscussionMessageResponse> {
    const account = await this.accountService.getAccountInformation({
      id: message.accountId,
    });

    let attachment: FileDataResponse | undefined;
    if (message.files) {
      const uploadedBy = await this.accountService.getAccountInformation({
        id: message.files.uploadedById,
      });
      attachment = {
        id: message.files.id,
        name: message.files.name,
        type: message.files.type,
        url: message.files.url,
        size: message.files.size,
        uploadedBy,
        fieldName: message.files.fieldName,
        originalName: message.files.originalName,
        encoding: message.files.encoding,
        mimetype: message.files.mimetype,
      };
    }

    return {
      id: message.id,
      discussionId: message.discussionId as unknown as number,
      activity: message.activity,
      content: message.content,
      createdAt: this.utilityService.formatDate(message.createdAt),
      updatedAt: this.utilityService.formatDate(message.updatedAt),
      accountId: message.accountId,
      account,
      attachment,
    };
  }

  async formatDiscussionResponse(
    discussion: Discussion & { DiscussionMessage?: DiscussionMessage[] },
  ): Promise<DiscussionResponse> {
    const messages = discussion.DiscussionMessage
      ? await Promise.all(
          discussion.DiscussionMessage.map((msg) => this.formatResponse(msg)),
        )
      : [];
    return {
      id: discussion.id,
      title: discussion.title,
      module: discussion.module,
      targetId: discussion.targetId,
      createdAt: this.utilityService.formatDate(discussion.createdAt),
      updatedAt: this.utilityService.formatDate(discussion.updatedAt),
      messages,
    };
  }

  async table(
    query: TableQueryDTO,
    body: TableBodyDTO,
  ): Promise<{
    list: DiscussionResponse[];
    pagination: unknown;
    currentPage: number;
    totalCount: number;
  }> {
    const companyId = this.utilityService.companyId;
    this.tableHandlerService.initialize(query, body, 'discussion');
    const tableQuery =
      this.tableHandlerService.constructTableQuery() as Prisma.DiscussionFindManyArgs;
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId,
    };

    tableQuery.include = {
      DiscussionMessage: true,
    };
    const {
      list: baseList,
      currentPage,
      pagination,
      totalCount,
    } = await this.tableHandlerService.getTableData(
      this.prisma.discussion,
      query,
      tableQuery,
    );
    const formattedList: DiscussionResponse[] = await Promise.all(
      baseList.map(
        (data: Discussion & { DiscussionMessage?: DiscussionMessage[] }) =>
          this.formatDiscussionResponse(data),
      ),
    );
    return { list: formattedList, pagination, currentPage, totalCount };
  }

  async getInfo(id: string): Promise<DiscussionResponse> {
    const companyId = this.utilityService.companyId;
    const discussion = await this.prisma.discussion.findFirst({
      where: { id, companyId },
      include: { DiscussionMessage: true },
    });

    if (!discussion) {
      throw new Error('Discussion not found or access denied');
    }

    return this.formatDiscussionResponse(discussion);
  }

  /**
   * Reusable function to create a discussion message. Creates the discussion if it doesn't exist.
   * This function is intended to be used by other modules as well.
   */
  async createDiscussionMessage(
    dto: CreateDiscussionMessageDto,
    accountId: string,
  ): Promise<DiscussionMessageResponse> {
    const companyId = this.utilityService.companyId;
    // Check for an existing discussion with the given ID, or create a new one
    let discussion = await this.prisma.discussion.findUnique({
      where: { id: dto.discussionId },
    });

    if (!discussion) {
      discussion = await this.prisma.discussion.create({
        data: {
          id: dto.discussionId,
          title: dto.title,
          module: dto.module,
          targetId: dto.targetId,
          companyId: companyId,
        },
      });
    }

    // Process @mentions in the content
    const mentionedAccountIds = this.extractMentionedAccountIds(dto.content);

    // Validate attachment if provided
    if (dto.attachmentId) {
      const attachment = await this.prisma.files.findUnique({
        where: { id: dto.attachmentId },
      });
      if (!attachment) {
        throw new Error('Attachment not found');
      }
    }

    const message = await this.prisma.discussionMessage.create({
      data: {
        discussionId: discussion.id,
        activity: dto.activity,
        content: dto.content,
        accountId,
        attachmentId: dto.attachmentId,
      },
      include: {
        account: true,
        attachment: true,
      },
    });

    // Make the user a watcher for this discussion if they aren't already
    await this.addDiscussionWatcher(accountId, discussion.id);

    // Add all mentioned users as watchers of the discussion
    if (mentionedAccountIds.length > 0) {
      for (const mentionedId of mentionedAccountIds) {
        // Don't add the message sender twice if they were mentioned
        if (mentionedId !== accountId) {
          await this.addDiscussionWatcher(mentionedId, discussion.id);
        }
      }

      // Send notifications to mentioned users
      await this.notifyMentionedUsers(
        mentionedAccountIds,
        accountId,
        discussion.id,
      );
    }

    // Notify all watchers (except the message creator and those already notified via mentions)
    await this.notifyDiscussionWatchers(
      discussion.id,
      accountId,
      mentionedAccountIds,
    );

    const formattedMessage = await this.formatResponse(message);

    // Emit new message event to discussion room
    this.emitToDiscussionRoom(discussion.id, 'new-message', {
      discussionId: discussion.id,
      message: formattedMessage,
      senderId: accountId,
    });

    return formattedMessage;
  }

  async editDiscussionMessage(
    dto: EditDiscussionMessageDto,
    accountId: string,
  ): Promise<DiscussionMessageResponse> {
    // Only allow editing if the message belongs to the account
    const message = await this.prisma.discussionMessage.findUnique({
      where: { id: dto.messageId },
      include: { account: true, discussion: true, attachment: true },
    });
    if (!message || message.accountId !== accountId) {
      throw new Error('Unauthorized or message not found');
    }

    // Process @mentions in the content to find new mentions
    const mentionedAccountIds = this.extractMentionedAccountIds(dto.content);
    const updated = await this.prisma.discussionMessage.update({
      where: { id: dto.messageId },
      data: { content: dto.content },
      include: { account: true, attachment: true },
    });

    // Add new mentioned users as watchers and notify them
    if (mentionedAccountIds.length > 0) {
      for (const mentionedId of mentionedAccountIds) {
        if (mentionedId !== accountId) {
          await this.addDiscussionWatcher(mentionedId, message.discussionId);
        }
      }

      // Send notifications to newly mentioned users
      await this.notifyMentionedUsers(
        mentionedAccountIds,
        accountId,
        message.discussionId,
      );
    }

    return this.formatResponse(updated);
  }

  /**
   * Notify mentioned users about being mentioned in a discussion
   * @param mentionedAccountIds IDs of mentioned accounts
   * @param senderId ID of the user who created the message
   * @param discussionId ID of the discussion
   * @param module Module the discussion belongs to
   * @param targetId Target ID of the module item
   */
  private async notifyMentionedUsers(
    mentionedAccountIds: string[],
    senderId: string,
    discussionId: string,
  ): Promise<void> {
    if (mentionedAccountIds.length === 0) return;

    // Get the discussion to include its title in the notification
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) return;

    const notificationMessage = `${discussion.title}`;

    // Pass null for projectId since discussions aren't necessarily project-related
    await this.notificationService.sendNotifications(
      null,
      senderId,
      mentionedAccountIds,
      notificationMessage,
      'DISCUSSION_MENTION',
      discussionId,
    );
  }

  /**
   * Notify all watchers of a discussion about a new message
   * @param discussionId ID of the discussion
   * @param senderId ID of the user who created the message
   * @param alreadyNotifiedIds IDs of users already notified (to avoid duplicate notifications)
   * @param module Module the discussion belongs to
   * @param targetId Target ID of the module item
   */
  private async notifyDiscussionWatchers(
    discussionId: string,
    senderId: string,
    alreadyNotifiedIds: string[] = [],
  ): Promise<void> {
    // Get the discussion to include its title in the notification
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) return;

    // Get all watchers for this discussion
    const watchers = await this.prisma.discussionWatchers.findMany({
      where: { discussionId },
      select: { accountId: true },
    });

    // Filter out the sender and already notified users
    const watcherIds = watchers
      .map((watcher) => watcher.accountId)
      .filter((id) => id !== senderId && !alreadyNotifiedIds.includes(id));

    if (watcherIds.length === 0) return;

    const notificationMessage = `${discussion.title}`;

    // Pass null for projectId since discussions aren't necessarily project-related
    await this.notificationService.sendNotifications(
      null,
      senderId,
      watcherIds,
      notificationMessage,
      'DISCUSSION_MESSAGE',
      discussionId,
    );
  }

  async deleteDiscussionMessage(
    messageId: number,
    accountId: string,
  ): Promise<DiscussionMessageResponse> {
    // Only allow deleting if the message belongs to the account
    const message = await this.prisma.discussionMessage.findUnique({
      where: { id: messageId },
      include: { account: true, attachment: true },
    });
    if (!message || message.accountId !== accountId) {
      throw new Error('Unauthorized or message not found');
    }
    const deleted = await this.prisma.discussionMessage.delete({
      where: { id: messageId },
      include: { account: true, attachment: true },
    });
    return this.formatResponse(deleted);
  }

  /**
   * Get paginated messages for a discussion (for chat/infinite scroll)
   * Also marks messages as read when fetched
   */
  async getMessages(
    discussionId: string,
    limit = 10,
    beforeId?: number,
    accountId?: string,
  ): Promise<DiscussionMessageResponse[]> {
    const companyId = this.utilityService.companyId;
    const where: Prisma.DiscussionMessageWhereInput = {
      discussionId,
      discussion: { companyId },
    };
    if (beforeId) {
      where.id = { lt: beforeId };
    }
    const messages = await this.prisma.discussionMessage.findMany({
      where,
      orderBy: { id: 'desc' },
      take: limit,
      include: {
        account: true,
        attachment: true,
      },
    });

    // If accountId is provided, mark the fetched messages as read
    if (accountId && messages.length > 0) {
      // Find the latest message ID in the fetched batch
      const latestMessageId = Math.max(...messages.map((m) => m.id));

      // Mark messages as read in the background (don't wait for it)
      this.markMessagesAsRead(discussionId, accountId, {
        upToMessageId: latestMessageId,
      }).catch((err) => {
        console.error('Error marking messages as read:', err);
      });
    }

    return Promise.all(messages.map((msg) => this.formatResponse(msg)));
  }

  /**
   * Check if a user has access to a discussion (is watcher or has module access)
   */
  async canAccessDiscussion(
    discussionId: string,
    _accountId?: string,
  ): Promise<boolean> {
    const companyId = this.utilityService.companyId;

    // Check if discussion exists and belongs to user's company
    const discussion = await this.prisma.discussion.findFirst({
      where: {
        id: discussionId,
        companyId,
      },
    });

    if (!discussion) {
      return false;
    }

    // Allow access to any user in the same company
    // In the future, we can add module-specific access checks based on discussion.module and discussion.targetId
    // For example: check if user has access to the task, payroll summary, etc.
    return true;
  }

  /**
   * Get unread message count for a specific discussion
   */
  async getUnreadCount(
    discussionId: string,
    accountId: string,
  ): Promise<number> {
    // First check if user can access this discussion
    const canAccess = await this.canAccessDiscussion(discussionId);
    if (!canAccess) {
      return 0;
    }

    // Get the last read message ID for this user
    const lastRead = await this.prisma.discussionMessageRead.findFirst({
      where: {
        accountId,
        discussionId,
      },
      orderBy: {
        messageId: 'desc',
      },
    });

    // Count messages after the last read message
    const unreadCount = await this.prisma.discussionMessage.count({
      where: {
        discussionId,
        id: lastRead ? { gt: lastRead.messageId } : undefined,
        // Don't count user's own messages as unread
        accountId: { not: accountId },
      },
    });

    return unreadCount;
  }

  /**
   * Get unread counts for multiple discussions (batch operation)
   */
  async getUnreadCounts(
    discussionIds: string[],
    accountId: string,
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();

    // Initialize all counts to 0
    discussionIds.forEach((id) => counts.set(id, 0));

    if (discussionIds.length === 0) {
      return counts;
    }

    // Get all last read records for these discussions
    const lastReadRecords = await this.prisma.discussionMessageRead.findMany({
      where: {
        accountId,
        discussionId: { in: discussionIds },
      },
      orderBy: {
        messageId: 'desc',
      },
      distinct: ['discussionId'],
    });

    // Create a map of discussion ID to last read message ID
    const lastReadMap = new Map<string, number>();
    lastReadRecords.forEach((record) => {
      lastReadMap.set(record.discussionId, record.messageId);
    });

    // Get unread counts for each discussion separately
    for (const discussionId of discussionIds) {
      const lastReadMessageId = lastReadMap.get(discussionId) || 0;

      const unreadCount = await this.prisma.discussionMessage.count({
        where: {
          discussionId,
          accountId: { not: accountId },
          id: { gt: lastReadMessageId },
        },
      });

      counts.set(discussionId, unreadCount);
    }

    return counts;
  }

  /**
   * Mark messages as read up to a certain point
   */
  async markMessagesAsRead(
    discussionId: string,
    accountId: string,
    options?: {
      upToMessageId?: number;
      markAll?: boolean;
    },
  ): Promise<void> {
    // Check access
    const canAccess = await this.canAccessDiscussion(discussionId);
    if (!canAccess) {
      throw new Error('Access denied to this discussion');
    }

    let maxMessageId: number;

    if (options?.markAll || !options?.upToMessageId) {
      // Get the latest message ID in the discussion
      const latestMessage = await this.prisma.discussionMessage.findFirst({
        where: { discussionId },
        orderBy: { id: 'desc' },
        select: { id: true },
      });

      if (!latestMessage) {
        return; // No messages to mark as read
      }

      maxMessageId = latestMessage.id;
    } else {
      maxMessageId = options.upToMessageId;
    }

    // Get all unread messages up to the specified point
    const unreadMessages = await this.prisma.discussionMessage.findMany({
      where: {
        discussionId,
        id: { lte: maxMessageId },
        // Don't mark user's own messages
        accountId: { not: accountId },
        // Not already read
        NOT: {
          DiscussionMessageRead: {
            some: {
              accountId,
            },
          },
        },
      },
      select: { id: true },
    });

    if (unreadMessages.length === 0) {
      return; // No new messages to mark as read
    }

    // Create read records for all unread messages
    await this.prisma.discussionMessageRead.createMany({
      data: unreadMessages.map((msg) => ({
        accountId,
        messageId: msg.id,
        discussionId,
        lastReadMessageId: maxMessageId,
      })),
      skipDuplicates: true,
    });

    // Emit socket event to notify other clients
    this.emitToDiscussionRoom(discussionId, 'messages-read', {
      discussionId,
      accountId,
      upToMessageId: maxMessageId,
    });
  }

  /**
   * Emit socket event to a discussion room
   */
  private emitToDiscussionRoom(
    discussionId: string,
    event: string,
    data: any,
  ): void {
    const roomName = `discussion:${discussionId}`;
    const eventName = `${roomName}:${event}`;

    // Emit to all clients in the discussion room
    if (this.socketService.io) {
      this.socketService.io.to(roomName).emit(eventName, data);
    }
  }

  /**
   * Get all watchers for a discussion with their account information
   * @param discussionId The discussion ID to get watchers for
   * @returns Array of discussion watchers with account details
   */
  async getDiscussionWatchers(discussionId: string): Promise<any[]> {
    const companyId = this.utilityService.companyId;

    // Check if discussion exists and belongs to user's company
    const discussion = await this.prisma.discussion.findFirst({
      where: {
        id: discussionId,
        companyId,
      },
    });

    if (!discussion) {
      throw new Error('Discussion not found or access denied');
    }

    // Get watchers with their account information
    const watchers = await this.prisma.discussionWatchers.findMany({
      where: { discussionId },
      include: {
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        id: 'asc', // Order by ID (creation order)
      },
    });

    // Format the response with capitalized names
    return watchers.map((watcher) => {
      const firstName = watcher.account?.firstName;
      const lastName = watcher.account?.lastName;

      // Capitalize first letter of each name
      const capitalizedFirstName = firstName
        ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
        : '';
      const capitalizedLastName = lastName
        ? lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase()
        : '';

      return {
        id: watcher.account?.id,
        firstName: capitalizedFirstName,
        lastName: capitalizedLastName,
        fullName: `${capitalizedFirstName} ${capitalizedLastName}`.trim(),
        email: watcher.account?.email,
        image: watcher.account?.image,
      };
    });
  }

  /**
   * Sync discussion watchers with task-related account IDs
   * Adds missing task-related people and preserves manually added watchers
   * @param discussionId The discussion to sync watchers for
   * @param taskRelatedIds Array of account IDs from task (creator, assignee, watchers)
   */
  async syncDiscussionWatchers(
    discussionId: string,
    taskRelatedIds: string[],
  ): Promise<void> {
    const companyId = this.utilityService.companyId;

    // Check if discussion exists and belongs to user's company
    const discussion = await this.prisma.discussion.findFirst({
      where: {
        id: discussionId,
        companyId,
      },
    });

    if (!discussion) {
      throw new Error('Discussion not found or access denied');
    }

    // Get current discussion watchers
    const currentWatchers = await this.prisma.discussionWatchers.findMany({
      where: { discussionId },
      select: { accountId: true },
    });

    const currentWatcherIds = currentWatchers.map((w) => w.accountId);

    // Add missing task-related people as watchers
    for (const accountId of taskRelatedIds) {
      if (!currentWatcherIds.includes(accountId)) {
        await this.addDiscussionWatcher(accountId, discussionId);
      }
    }

    // Note: We intentionally do NOT remove existing watchers that aren't in taskRelatedIds
    // This preserves manually added watchers (from @mentions, etc.)
    // In the future, we could add source tracking to only remove task-related watchers
  }
}
