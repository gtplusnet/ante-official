import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { ListSentEmailsDto } from './dto/list-sent-emails.dto';
import { SaveSentEmailRequest } from '@shared/request/sent-email.request';
import {
  SentEmailResponse,
  ListSentEmailsResponse,
  SentEmailStatsResponse,
} from '@shared/response/sent-email.response';
import { Prisma } from '@prisma/client';

@Injectable()
export class SentEmailService {
  private readonly logger = new Logger(SentEmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly utilityService: UtilityService,
  ) {}

  /**
   * Save a sent email record
   */
  async saveSentEmail(data: SaveSentEmailRequest): Promise<SentEmailResponse> {
    try {
      const sentEmail = await this.prisma.sentEmail.create({
        data: {
          companyId: data.companyId,
          sentBy: data.sentBy,
          module: data.module,
          moduleContext: data.moduleContext,
          to: Array.isArray(data.to) ? data.to : [data.to],
          cc: data.cc ? (Array.isArray(data.cc) ? data.cc : [data.cc]) : null,
          bcc: data.bcc
            ? Array.isArray(data.bcc)
              ? data.bcc
              : [data.bcc]
            : null,
          subject: data.subject,
          htmlContent: data.htmlContent,
          textContent: data.textContent,
          status: data.status,
          errorMessage: data.errorMessage,
          messageId: data.messageId,
          metadata: data.metadata,
        },
        include: {
          sentByAccount: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return this.formatSentEmailResponse(sentEmail);
    } catch (error) {
      this.logger.error('Failed to save sent email:', error);
      throw error;
    }
  }

  /**
   * Get list of sent emails with filtering and pagination
   */
  async listSentEmails(
    companyId: number,
    filters: ListSentEmailsDto,
  ): Promise<ListSentEmailsResponse> {
    const where: Prisma.SentEmailWhereInput = {
      companyId,
    };

    // Apply filters
    if (filters.module) {
      where.module = filters.module;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.sentAt = {};
      if (filters.dateFrom) {
        where.sentAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.sentAt.lte = new Date(filters.dateTo);
      }
    }

    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { to: { array_contains: filters.search } },
      ];
    }

    // Count total records
    const total = await this.prisma.sentEmail.count({ where });

    // Calculate pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Get paginated records
    const emails = await this.prisma.sentEmail.findMany({
      where,
      include: {
        sentByAccount: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        [filters.sortBy || 'sentAt']: filters.sortOrder || 'desc',
      },
      skip,
      take: limit,
    });

    return {
      emails: emails.map((email) => this.formatSentEmailResponse(email)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get sent email by ID
   */
  async getSentEmailById(
    id: string,
    companyId: number,
  ): Promise<SentEmailResponse> {
    const sentEmail = await this.prisma.sentEmail.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        sentByAccount: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!sentEmail) {
      throw new NotFoundException('Sent email not found');
    }

    return this.formatSentEmailResponse(sentEmail);
  }

  /**
   * Get email statistics
   */
  async getEmailStats(companyId: number): Promise<SentEmailStatsResponse> {
    const [totalEmails, statusCounts, moduleStats, recentActivity] =
      await Promise.all([
        // Total emails
        this.prisma.sentEmail.count({ where: { companyId } }),

        // Status counts
        this.prisma.sentEmail.groupBy({
          by: ['status'],
          where: { companyId },
          _count: { status: true },
        }),

        // Module statistics
        this.prisma.sentEmail.groupBy({
          by: ['module', 'status'],
          where: { companyId },
          _count: { module: true },
        }),

        // Recent activity (last 7 days)
        this.getRecentActivity(companyId, 7),
      ]);

    // Process status counts
    const statusMap = statusCounts.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Process module stats
    const moduleStatsMap = new Map<
      string,
      { total: number; successful: number }
    >();
    moduleStats.forEach((stat) => {
      const existing = moduleStatsMap.get(stat.module) || {
        total: 0,
        successful: 0,
      };
      existing.total += stat._count.module;
      if (stat.status === 'SENT') {
        existing.successful += stat._count.module;
      }
      moduleStatsMap.set(stat.module, existing);
    });

    const formattedModuleStats = Array.from(moduleStatsMap.entries()).map(
      ([module, stats]) => ({
        module,
        count: stats.total,
        successRate:
          stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
      }),
    );

    return {
      totalEmails,
      successfulEmails: statusMap['SENT'] || 0,
      failedEmails: statusMap['FAILED'] || 0,
      pendingEmails: statusMap['PENDING'] || 0,
      moduleStats: formattedModuleStats,
      recentActivity,
    };
  }

  /**
   * Get recent email activity
   */
  private async getRecentActivity(
    companyId: number,
    days: number,
  ): Promise<Array<{ date: string; count: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const emails = await this.prisma.sentEmail.groupBy({
      by: ['sentAt'],
      where: {
        companyId,
        sentAt: { gte: startDate },
      },
      _count: { sentAt: true },
    });

    // Group by date (ignoring time)
    const activityMap = new Map<string, number>();
    emails.forEach((email) => {
      const date = email.sentAt.toISOString().split('T')[0];
      activityMap.set(date, (activityMap.get(date) || 0) + email._count.sentAt);
    });

    // Fill in missing dates with 0
    const result: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        count: activityMap.get(dateStr) || 0,
      });
    }

    return result.reverse();
  }

  /**
   * Format sent email response
   */
  private formatSentEmailResponse(email: any): SentEmailResponse {
    return {
      id: email.id,
      companyId: email.companyId,
      sentBy: email.sentBy,
      sentByAccount: email.sentByAccount,
      sentAt: email.sentAt.toISOString(),
      module: email.module,
      moduleContext: email.moduleContext,
      to: email.to as string[],
      cc: email.cc as string[] | undefined,
      bcc: email.bcc as string[] | undefined,
      subject: email.subject,
      htmlContent: email.htmlContent,
      textContent: email.textContent,
      status: email.status,
      errorMessage: email.errorMessage,
      messageId: email.messageId,
      metadata: email.metadata as Record<string, any> | undefined,
      createdAt: email.createdAt.toISOString(),
      updatedAt: email.updatedAt.toISOString(),
    };
  }
}
