import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';

export interface CreateNotificationDto {
  type: string;
  title: string;
  message: string;
  priority?: string;
  data?: any;
}

export interface NotificationListDto {
  limit?: number;
  offset?: number;
  type?: string;
  unread?: boolean;
  unreadOnly?: boolean;
}

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: string;
  data?: Record<string, any>;
  studentId?: string;
  studentName?: string;
}

@Injectable()
export class GuardianNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utility: UtilityService,
  ) { }

  /**
   * Convert database notification to DTO format for frontend
   */
  private mapToDto(notification: any): NotificationDto {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: notification.createdAt.toISOString(),
      isRead: notification.readAt !== null,
      priority: notification.priority,
      data: notification.data,
      studentId: notification.data?.studentId,
      studentName: notification.data?.studentName,
    };
  }

  async getNotifications(guardianId: string, dto: NotificationListDto) {
    const { limit = 20, offset = 0, type, unread, unreadOnly } = dto;

    const where: any = {
      guardianId,
    };

    if (type) {
      where.type = type;
    }

    // Handle both unread and unreadOnly parameters
    if (unread !== undefined) {
      where.readAt = unread ? null : { not: null };
    } else if (unreadOnly !== undefined) {
      where.readAt = unreadOnly ? null : { not: null };
    }

    const [notifications, total] = await Promise.all([
      this.prisma.guardianNotification.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.guardianNotification.count({ where }),
    ]);

    // Convert to DTO format
    const notificationDtos = notifications.map(n => this.mapToDto(n));

    return {
      notifications: notificationDtos,
      total,
      hasMore: offset + notifications.length < total,
    };
  }

  async getUnreadCount(guardianId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.prisma.guardianNotification.count({
      where: {
        guardianId,
        readAt: null,
      },
    });

    return { unreadCount };
  }

  async getNotification(guardianId: string, notificationId: string) {
    const notification = await this.prisma.guardianNotification.findFirst({
      where: {
        id: notificationId,
        guardianId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAsRead(guardianId: string, notificationId: string) {
    const notification = await this.prisma.guardianNotification.findFirst({
      where: {
        id: notificationId,
        guardianId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.guardianNotification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    return {
      success: true,
      notification: updated,
    };
  }

  async markAllAsRead(guardianId: string) {
    const result = await this.prisma.guardianNotification.updateMany({
      where: {
        guardianId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return {
      success: true,
      count: result.count,
    };
  }

  async deleteNotification(guardianId: string, notificationId: string) {
    const notification = await this.prisma.guardianNotification.findFirst({
      where: {
        id: notificationId,
        guardianId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.guardianNotification.delete({
      where: { id: notificationId },
    });

    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  }

  async createNotification(guardianId: string, dto: CreateNotificationDto) {
    const notification = await this.prisma.guardianNotification.create({
      data: {
        guardianId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        priority: dto.priority || 'normal',
        data: dto.data || {},
      },
    });

    return notification;
  }

  async createPaymentReminder(guardianId: string, data: any) {
    return this.createNotification(guardianId, {
      type: 'payment_reminder',
      title: 'Payment Reminder',
      message: data.message || 'You have a pending payment',
      priority: 'high',
      data,
    });
  }

  async createAnnouncement(guardianId: string, data: any) {
    return this.createNotification(guardianId, {
      type: 'announcement',
      title: data.title || 'School Announcement',
      message: data.message,
      priority: data.priority || 'normal',
      data,
    });
  }

  /**
   * Create notification for multiple guardians at once
   * Used when sending push notifications to multiple guardians
   */
  async createNotificationForGuardians(
    guardianIds: string[],
    dto: CreateNotificationDto,
  ): Promise<void> {
    if (guardianIds.length === 0) return;

    // Create notifications for all guardians
    const notifications = guardianIds.map(guardianId => ({
      guardianId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      priority: dto.priority || 'normal',
      data: dto.data || {},
    }));

    await this.prisma.guardianNotification.createMany({
      data: notifications,
    });
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(guardianId: string, notificationIds: string[]) {
    if (notificationIds.length === 0) return { success: true, count: 0 };

    const result = await this.prisma.guardianNotification.updateMany({
      where: {
        id: { in: notificationIds },
        guardianId,
        readAt: null, // Only update unread notifications
      },
      data: { readAt: new Date() },
    });

    return {
      success: true,
      count: result.count,
    };
  }
}
