import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ActivityLogService,
  QueryActivityLogDto,
} from './activity-log.service';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
// import { AuthGuard } from '@shared/guards/auth.guard';
import { UtilityService } from '@common/utility.service';

@ApiTags('Activity Log')
@Controller('cms/activity-log')
// @UseGuards(AuthGuard)
export class ActivityLogController {
  constructor(
    private readonly activityLogService: ActivityLogService,
    private readonly utility: UtilityService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all activity logs with filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'resource', required: false, type: String })
  @ApiQuery({ name: 'resourceId', required: false, type: String })
  @ApiQuery({ name: 'performedBy', required: false, type: String })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  async findAll(@Query() query: any) {
    const queryDto: QueryActivityLogDto = {
      page: query.page ? parseInt(query.page) : undefined,
      pageSize: query.pageSize ? parseInt(query.pageSize) : undefined,
      action: query.action,
      resource: query.resource,
      resourceId: query.resourceId,
      performedBy: query.performedBy,
      ...(query.fromDate || query.toDate
        ? {
            dateRange: {
              ...(query.fromDate && { from: new Date(query.fromDate) }),
              ...(query.toDate && { to: new Date(query.toDate) }),
            },
          }
        : {}),
      sort:
        query.sortBy && query.sortOrder
          ? {
              [query.sortBy]: query.sortOrder === 'desc' ? -1 : 1,
            }
          : undefined,
    };

    const result = await this.activityLogService.findAll(queryDto);
    return result;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get activity log statistics' })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  async getStats(@Query() query: any) {
    const dateRange =
      query.fromDate || query.toDate
        ? {
            ...(query.fromDate && { from: new Date(query.fromDate) }),
            ...(query.toDate && { to: new Date(query.toDate) }),
          }
        : undefined;

    const stats = await this.activityLogService.getStats(dateRange);
    return stats;
  }

  @Get('export')
  @ApiOperation({ summary: 'Export activity logs to CSV/JSON' })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'] })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'resource', required: false, type: String })
  @ApiQuery({ name: 'performedBy', required: false, type: String })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  async exportActivities(@Query() query: any) {
    const queryDto: QueryActivityLogDto = {
      action: query.action,
      resource: query.resource,
      performedBy: query.performedBy,
      ...(query.fromDate || query.toDate
        ? {
            dateRange: {
              ...(query.fromDate && { from: new Date(query.fromDate) }),
              ...(query.toDate && { to: new Date(query.toDate) }),
            },
          }
        : {}),
    };

    const activities = await this.activityLogService.exportActivities(queryDto);
    const format = query.format || 'json';

    if (format === 'csv') {
      // Convert to CSV format
      const headers = [
        'ID',
        'Action',
        'Resource',
        'Resource Name',
        'Performed By',
        'Performed At',
        'Changes',
        'IP Address',
        'User Agent',
      ];

      const csvRows = [
        headers.join(','),
        ...activities.map((activity) =>
          [
            activity.id,
            activity.action,
            activity.resource,
            `"${activity.resourceName}"`,
            activity.performedBy,
            activity.performedAt,
            `"${JSON.stringify(activity.changes || {}).replace(/"/g, '""')}"`,
            activity.metadata?.ip || '',
            `"${activity.metadata?.userAgent || ''}"`,
          ].join(','),
        ),
      ];

      return {
        data: csvRows.join('\n'),
        filename: `activity-logs-${new Date().toISOString().split('T')[0]}.csv`,
        contentType: 'text/csv',
      };
    }

    return {
      data: activities,
      filename: `activity-logs-${new Date().toISOString().split('T')[0]}.json`,
      contentType: 'application/json',
    };
  }

  @Get('resource/:resource/:resourceId')
  @ApiOperation({ summary: 'Get activity history for a specific resource' })
  @ApiParam({ name: 'resource', type: String })
  @ApiParam({ name: 'resourceId', type: String })
  async getResourceHistory(
    @Param('resource') resource: string,
    @Param('resourceId') resourceId: string,
  ) {
    const history = await this.activityLogService.getResourceHistory(
      resource,
      resourceId,
    );
    return history;
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get activity logs for a specific user' })
  @ApiParam({ name: 'userId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'resource', required: false, type: String })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  async getUserActivity(@Param('userId') userId: string, @Query() query: any) {
    const queryDto: QueryActivityLogDto = {
      page: query.page ? parseInt(query.page) : undefined,
      pageSize: query.pageSize ? parseInt(query.pageSize) : undefined,
      action: query.action,
      resource: query.resource,
      ...(query.fromDate || query.toDate
        ? {
            dateRange: {
              ...(query.fromDate && { from: new Date(query.fromDate) }),
              ...(query.toDate && { to: new Date(query.toDate) }),
            },
          }
        : {}),
    };

    const result = await this.activityLogService.getUserActivity(
      userId,
      queryDto,
    );
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific activity log by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    const activityLog = await this.activityLogService.findOne(id);
    return activityLog;
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Cleanup old activity logs' })
  @ApiQuery({ name: 'retentionDays', required: false, type: Number })
  async cleanup(@Query('retentionDays') retentionDays?: number) {
    const days = retentionDays ? parseInt(retentionDays.toString()) : 90;
    const result = await this.activityLogService.cleanup(days);
    return result;
  }
}
