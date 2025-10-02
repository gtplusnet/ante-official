import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  AnnouncementListDto,
  AnnouncementWithStats,
  AnnouncementStats,
} from './announcement.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnnouncementService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;

  async create(data: CreateAnnouncementDto) {
    const accountId = this.utilityService.accountInformation.id;
    // Get account with company information
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { companyId: true },
    });

    const announcement = await this.prisma.announcement.create({
      data: {
        ...data,
        createdById: accountId,
        companyId: account?.companyId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
          },
        },
      },
    });

    return announcement;
  }

  async findAll(
    params: AnnouncementListDto,
  ): Promise<{ data: AnnouncementWithStats[]; total: number }> {
    const accountId = this.utilityService.accountInformation.id;
    // Get account with company information
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { companyId: true },
    });
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      priority,
      startDate,
      endDate,
    } = params;
    const offset = (page - 1) * limit;

    const where: Prisma.AnnouncementWhereInput = {
      companyId: account?.companyId,
      ...(isActive !== undefined && { isActive }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(startDate && { createdAt: { gte: new Date(startDate) } }),
      ...(endDate && { createdAt: { lte: new Date(endDate) } }),
    };

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              middleName: true,
            },
          },
          views: {
            select: {
              viewedById: true,
            },
          },
          acknowledgments: {
            select: {
              acknowledgedById: true,
            },
          },
        },
      }),
      this.prisma.announcement.count({ where }),
    ]);

    const data: AnnouncementWithStats[] = announcements.map((announcement) => {
      const viewCount = announcement.views.length;
      const acknowledgmentCount = announcement.acknowledgments.length;
      const isViewed = announcement.views.some(
        (view) => view.viewedById === accountId,
      );
      const isAcknowledged = announcement.acknowledgments.some(
        (ack) => ack.acknowledgedById === accountId,
      );

      return {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        icon: announcement.icon,
        iconColor: announcement.iconColor,
        priority: announcement.priority,
        isActive: announcement.isActive,
        createdAt: announcement.createdAt,
        updatedAt: announcement.updatedAt,
        createdById: announcement.createdById,
        createdBy: announcement.createdBy,
        viewCount,
        acknowledgmentCount,
        isViewed,
        isAcknowledged,
      };
    });

    return { data, total };
  }

  async findOne(id: number): Promise<AnnouncementWithStats> {
    const accountId = this.utilityService.accountInformation.id;
    // Get account with company information
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { companyId: true },
    });

    const announcement = await this.prisma.announcement.findFirst({
      where: {
        id,
        companyId: account?.companyId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
          },
        },
        views: {
          select: {
            viewedById: true,
          },
        },
        acknowledgments: {
          select: {
            acknowledgedById: true,
          },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    const viewCount = announcement.views.length;
    const acknowledgmentCount = announcement.acknowledgments.length;
    const isViewed = announcement.views.some(
      (view) => view.viewedById === accountId,
    );
    const isAcknowledged = announcement.acknowledgments.some(
      (ack) => ack.acknowledgedById === accountId,
    );

    return {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      icon: announcement.icon,
      iconColor: announcement.iconColor,
      priority: announcement.priority,
      isActive: announcement.isActive,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      createdById: announcement.createdById,
      createdBy: announcement.createdBy,
      viewCount,
      acknowledgmentCount,
      isViewed,
      isAcknowledged,
    };
  }

  async update(id: number, data: UpdateAnnouncementDto) {
    const accountId = this.utilityService.accountInformation.id;
    // Get account with company information
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { companyId: true },
    });

    const announcement = await this.prisma.announcement.findFirst({
      where: {
        id,
        companyId: account?.companyId,
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (announcement.createdById !== accountId) {
      throw new ForbiddenException('You can only edit your own announcements');
    }

    const updated = await this.prisma.announcement.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
          },
        },
      },
    });

    return updated;
  }

  async remove(id: number) {
    const accountId = this.utilityService.accountInformation.id;
    // Get account with company information
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { companyId: true },
    });

    const announcement = await this.prisma.announcement.findFirst({
      where: {
        id,
        companyId: account?.companyId,
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (announcement.createdById !== accountId) {
      throw new ForbiddenException(
        'You can only delete your own announcements',
      );
    }

    await this.prisma.announcement.delete({
      where: { id },
    });

    return { message: 'Announcement deleted successfully' };
  }

  async trackView(announcementId: number) {
    const accountId = this.utilityService.accountInformation.id;
    // Get account with company information
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { companyId: true },
    });

    const announcement = await this.prisma.announcement.findFirst({
      where: {
        id: announcementId,
        companyId: account?.companyId,
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Check if already viewed
    const existingView = await this.prisma.announcementView.findUnique({
      where: {
        announcementId_viewedById: {
          announcementId,
          viewedById: accountId,
        },
      },
    });

    if (!existingView) {
      await this.prisma.announcementView.create({
        data: {
          announcementId,
          viewedById: accountId,
        },
      });
    }

    return { message: 'View tracked successfully' };
  }

  async trackAcknowledgment(announcementId: number) {
    const accountId = this.utilityService.accountInformation.id;
    // Get account with company information
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { companyId: true },
    });

    const announcement = await this.prisma.announcement.findFirst({
      where: {
        id: announcementId,
        companyId: account?.companyId,
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Check if already acknowledged
    const existingAck = await this.prisma.announcementAcknowledgment.findUnique(
      {
        where: {
          announcementId_acknowledgedById: {
            announcementId,
            acknowledgedById: accountId,
          },
        },
      },
    );

    if (!existingAck) {
      await this.prisma.announcementAcknowledgment.create({
        data: {
          announcementId,
          acknowledgedById: accountId,
        },
      });
    }

    return { message: 'Acknowledgment tracked successfully' };
  }

  async getStats(announcementId: number): Promise<AnnouncementStats> {
    const accountId = this.utilityService.accountInformation.id;
    // Get account with company information
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { companyId: true },
    });

    const announcement = await this.prisma.announcement.findFirst({
      where: {
        id: announcementId,
        companyId: account?.companyId,
      },
      include: {
        views: {
          include: {
            viewedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            viewedAt: 'desc',
          },
        },
        acknowledgments: {
          include: {
            acknowledgedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            acknowledgedAt: 'desc',
          },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return {
      totalViews: announcement.views.length,
      totalAcknowledgments: announcement.acknowledgments.length,
      viewDetails: announcement.views.map((view) => ({
        viewedBy: view.viewedBy,
        viewedAt: view.viewedAt,
      })),
      acknowledgmentDetails: announcement.acknowledgments.map((ack) => ({
        acknowledgedBy: ack.acknowledgedBy,
        acknowledgedAt: ack.acknowledgedAt,
      })),
    };
  }
}
