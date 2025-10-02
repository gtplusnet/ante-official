import { Controller, Get, Query, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AnalyticsService,
  DashboardStats,
  WeeklyApiUsage,
  ApiStatistics,
  TopEndpoint,
  DetailedMediaStats,
} from './analytics.service';

@Controller('cms/analytics')
@ApiTags('CMS Analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get comprehensive dashboard statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard statistics retrieved successfully',
    type: 'object',
  })
  async getDashboardStats() {
    const data = await this.analyticsService.getDashboardStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'Dashboard statistics retrieved successfully',
      data,
    };
  }

  @Get('content-types')
  @ApiOperation({ summary: 'Get content type statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content type statistics retrieved successfully',
  })
  async getContentTypeStats() {
    const data = await this.analyticsService.getContentTypeStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'Content type statistics retrieved successfully',
      data,
    };
  }

  @Get('media')
  @ApiOperation({ summary: 'Get media statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Media statistics retrieved successfully',
  })
  async getMediaStats() {
    const data = await this.analyticsService.getMediaStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'Media statistics retrieved successfully',
      data,
    };
  }

  @Get('media/detailed')
  @ApiOperation({ summary: 'Get detailed media statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detailed media statistics retrieved successfully',
    type: 'object',
  })
  async getDetailedMediaStats() {
    const data = await this.analyticsService.getDetailedMediaStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'Detailed media statistics retrieved successfully',
      data,
    };
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get activity statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Activity statistics retrieved successfully',
  })
  async getActivityStats() {
    const data = await this.analyticsService.getActivityStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'Activity statistics retrieved successfully',
      data,
    };
  }

  @Get('api-usage')
  @ApiOperation({ summary: 'Get API usage statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API usage statistics retrieved successfully',
  })
  async getApiUsageStats() {
    const data = await this.analyticsService.getApiUsageStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'API usage statistics retrieved successfully',
      data,
    };
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get performance metrics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance metrics retrieved successfully',
  })
  async getPerformanceMetrics() {
    const data = await this.analyticsService.getPerformanceMetrics();
    return {
      statusCode: HttpStatus.OK,
      message: 'Performance metrics retrieved successfully',
      data,
    };
  }

  @Get('report')
  @ApiOperation({ summary: 'Generate analytics report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report generated successfully',
  })
  async generateReport(@Query('type') type: string, @Query() dateRange: any) {
    const data = await this.analyticsService.generateReport(type, dateRange);
    return {
      statusCode: HttpStatus.OK,
      message: 'Report generated successfully',
      data,
    };
  }

  @Get('api-usage/weekly')
  @ApiOperation({ summary: 'Get weekly API usage data for chart' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weekly API usage data retrieved successfully',
  })
  async getWeeklyApiUsage() {
    const data = await this.analyticsService.getWeeklyApiUsage();
    return {
      statusCode: HttpStatus.OK,
      message: 'Weekly API usage data retrieved successfully',
      data,
    };
  }

  @Get('api-usage/statistics')
  @ApiOperation({ summary: 'Get API usage statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API usage statistics retrieved successfully',
  })
  async getApiStatistics() {
    const data = await this.analyticsService.getApiStatistics();
    return {
      statusCode: HttpStatus.OK,
      message: 'API usage statistics retrieved successfully',
      data,
    };
  }

  @Get('api-usage/top-endpoints')
  @ApiOperation({ summary: 'Get top API endpoints' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top API endpoints retrieved successfully',
  })
  async getTopEndpoints() {
    const data = await this.analyticsService.getTopEndpoints();
    return {
      statusCode: HttpStatus.OK,
      message: 'Top API endpoints retrieved successfully',
      data,
    };
  }
}
