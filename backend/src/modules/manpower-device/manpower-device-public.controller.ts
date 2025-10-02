import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  HttpStatus,
  HttpCode,
  BadRequestException,
  Render,
} from '@nestjs/common';
import { ManpowerDeviceService } from './manpower-device.service';
import { Public } from '@common/decorators/public.decorator';

@Controller('api/public/manpower')
@Public() // Mark all endpoints as public (no auth required)
export class ManpowerDevicePublicController {
  constructor(
    private readonly manpowerDeviceService: ManpowerDeviceService,
  ) {}

  /**
   * API Documentation page
   * GET /api/public/manpower
   */
  @Get()
  @Render('manpower/api-documentation')
  async getDocumentation() {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const lastUpdated = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      layout: 'api-documentation',
      title: 'Manpower Time Tracking API',
      description: 'REST API for time tracking devices and employee attendance management',
      baseUrl: `${baseUrl}/api/public/manpower`,
      version: 'v1.0',
      lastUpdated,
      companyName: 'ANTE GEER',
      theme: {
        primaryColor: '#1976d2',
        secondaryColor: '#f50057',
        headerGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        headerGradientDark: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
      },
      hasQuickStart: true,
      hasWebSocket: false,
    };
  }

  /**
   * Record time-in for an employee
   * POST /api/public/manpower/time-in
   */
  @Post('time-in')
  @HttpCode(HttpStatus.OK)
  async recordTimeIn(
    @Headers('x-api-key') apiKey: string,
    @Body() body: {
      employeeId: string;
      timestamp?: string; // Optional, uses current time if not provided
    },
  ) {
    if (!apiKey) {
      throw new BadRequestException('API key is required in x-api-key header');
    }

    if (!body.employeeId) {
      throw new BadRequestException('Employee ID is required');
    }

    try {
      const result = await this.manpowerDeviceService.recordTimeIn(
        apiKey,
        body.employeeId,
      );
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Failed to record time-in');
    }
  }

  /**
   * Record time-out for an employee
   * POST /api/public/manpower/time-out
   */
  @Post('time-out')
  @HttpCode(HttpStatus.OK)
  async recordTimeOut(
    @Headers('x-api-key') apiKey: string,
    @Body() body: {
      timeRecordId: number;
      timestamp?: string; // Optional, uses current time if not provided
    },
  ) {
    if (!apiKey) {
      throw new BadRequestException('API key is required in x-api-key header');
    }

    if (!body.timeRecordId) {
      throw new BadRequestException('Time record ID is required');
    }

    try {
      const result = await this.manpowerDeviceService.recordTimeOut(
        apiKey,
        body.timeRecordId,
      );
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Failed to record time-out');
    }
  }

  /**
   * Get daily logs for a specific date
   * GET /api/public/manpower/daily-logs?date=2024-12-16
   */
  @Get('daily-logs')
  async getDailyLogs(
    @Headers('x-api-key') apiKey: string,
    @Query('date') date: string,
  ) {
    if (!apiKey) {
      throw new BadRequestException('API key is required in x-api-key header');
    }

    if (!date) {
      throw new BadRequestException('Date parameter is required (format: YYYY-MM-DD)');
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    try {
      const result = await this.manpowerDeviceService.getDailyLogs(apiKey, date);
      return {
        date,
        totalRecords: result.length,
        records: result,
      };
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Failed to fetch daily logs');
    }
  }

  /**
   * Health check endpoint for devices
   * GET /api/public/manpower/health
   */
  @Get('health')
  async healthCheck(
    @Headers('x-api-key') apiKey: string,
  ) {
    if (!apiKey) {
      throw new BadRequestException('API key is required in x-api-key header');
    }

    const device = await this.manpowerDeviceService.validateDevice(apiKey);

    if (!device) {
      throw new BadRequestException('Invalid or inactive device');
    }

    return {
      status: 'ok',
      device: {
        id: device.deviceId,
        name: device.name,
        location: device.location,
        lastActivity: device.lastActivityAt,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get employee status (clocked in/out)
   * GET /api/public/manpower/employee-status?employeeId=123
   */
  @Get('employee-status')
  async getEmployeeStatus(
    @Headers('x-api-key') apiKey: string,
    @Query('employeeId') employeeId: string,
  ) {
    if (!apiKey) {
      throw new BadRequestException('API key is required in x-api-key header');
    }

    if (!employeeId) {
      throw new BadRequestException('Employee ID is required');
    }

    try {
      const result = await this.manpowerDeviceService.getEmployeeStatus(
        apiKey,
        employeeId,
      );
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Failed to get employee status');
    }
  }

  /**
   * Get all employees for the device's company
   * GET /api/public/manpower/employees?page=1&limit=50&withPhotos=true
   */
  @Get('employees')
  async getEmployees(
    @Headers('x-api-key') apiKey: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('withPhotos') withPhotos?: string,
  ) {
    if (!apiKey) {
      throw new BadRequestException('API key is required in x-api-key header');
    }

    try {
      const result = await this.manpowerDeviceService.getEmployees(
        apiKey,
        page ? Number(page) : 1,
        limit ? Number(limit) : 50,
        withPhotos === 'true',
      );
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Failed to fetch employees');
    }
  }
}
