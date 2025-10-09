import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { CRMActivityType, CRMEntityType } from '@prisma/client';
import { GetActivitiesQueryDto } from './crm-activity.validator.dto';

@Injectable()
export class CRMActivityService {
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly utilityService: UtilityService;

  async createActivity(data: {
    activityType: CRMActivityType;
    entityType: CRMEntityType;
    entityId: number;
    entityName: string;
    description: string;
    performedById: string;
  }) {
    return await this.prisma.cRMActivity.create({
      data: {
        ...data,
        companyId: this.utilityService.companyId,
      },
    });
  }

  async getRecentActivities(query: GetActivitiesQueryDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const skip = (page - 1) * limit;

    const where: any = {
      companyId: this.utilityService.companyId,
    };

    // Filter by read status
    if (query.filter === 'unread') {
      where.isRead = false;
    } else if (query.filter === 'read') {
      where.isRead = true;
    }

    const [activities, total] = await Promise.all([
      this.prisma.cRMActivity.findMany({
        where,
        include: {
          performedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.cRMActivity.count({ where }),
    ]);

    return {
      activities: activities.map((activity) => ({
        id: activity.id,
        activityType: activity.activityType,
        entityType: activity.entityType,
        entityId: activity.entityId,
        entityName: activity.entityName,
        description: activity.description,
        isRead: activity.isRead,
        createdAt: activity.createdAt,
        performedBy: {
          id: activity.performedBy.id,
          name: `${activity.performedBy.firstName} ${activity.performedBy.lastName}`,
          image: activity.performedBy.image,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(id: number) {
    return await this.prisma.cRMActivity.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead() {
    return await this.prisma.cRMActivity.updateMany({
      where: {
        companyId: this.utilityService.companyId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async getUnreadCount() {
    return await this.prisma.cRMActivity.count({
      where: {
        companyId: this.utilityService.companyId,
        isRead: false,
      },
    });
  }
}
