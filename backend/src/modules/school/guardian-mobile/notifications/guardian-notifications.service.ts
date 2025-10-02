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
}

@Injectable()
export class GuardianNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utility: UtilityService,
  ) {}

  async getNotifications(guardianId: string, dto: NotificationListDto) {
    const { limit = 20, offset = 0, type, unread } = dto;

    const where: any = {
      guardianId,
    };

    if (type) {
      where.type = type;
    }

    if (unread !== undefined) {
      where.readAt = unread ? null : { not: null };
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

    return {
      notifications,
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
}
