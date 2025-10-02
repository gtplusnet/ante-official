import { Controller, Get, Post, Body, Req, Res, Inject } from '@nestjs/common';
import { Response } from 'express';
import { SyncService } from './sync.service';
import { UtilityService } from '@common/utility.service';
import { DeviceLicenseService } from '../device-license/device-license.service';
import { RequestWithLicense } from './middleware/device-license.middleware';
import { SyncPullDto, ValidateLicenseResponseDto } from './sync.dto';
import { DeviceConnectionRequest } from '@shared/request/device-license.request';
import { SchoolAttendanceBatchDto } from './school-attendance.dto';
import { AttendancePullRequestDto } from './attendance-pull.dto';
import { SupabaseAuthService } from '@modules/auth/supabase-auth/supabase-auth.service';

@Controller('auth/school/sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly utilityService: UtilityService,
    private readonly deviceLicenseService: DeviceLicenseService,
    @Inject(SupabaseAuthService)
    private readonly supabaseAuthService: SupabaseAuthService,
  ) {}

  @Post('connect')
  async connectDevice(
    @Body() data: DeviceConnectionRequest,
    @Req() req: RequestWithLicense,
    @Res() res: Response,
  ) {
    // Add the license key from the middleware to the data
    const connectionData = {
      ...data,
      licenseKey: req.license?.licenseKey,
    };

    return this.utilityService.responseHandler(
      this.deviceLicenseService.connectDevice(connectionData),
      res,
    );
  }

  @Post('validate')
  async validateLicense(@Req() req: RequestWithLicense, @Res() res: Response) {
    // Generate Supabase tokens for the license
    let supabaseTokens: {
      supabaseToken?: string;
      supabaseRefreshToken?: string;
    } = {};

    try {
      // Create a pseudo-account for the license to get Supabase tokens
      const licenseAccount = {
        id: `license-${req.license?.id}`,
        email: `license-${req.license?.licenseKey}@gate.local`,
        firstName: 'Gate',
        lastName: req.license?.gate?.gateName || 'Device',
        companyId: req.license?.companyId,
      };

      console.log(
        '[SyncController] Creating Supabase user for license:',
        licenseAccount,
      );

      const supabaseResult = await this.supabaseAuthService.ensureSupabaseUser(
        licenseAccount as any,
      );

      console.log('[SyncController] Supabase result:', supabaseResult);

      if (supabaseResult?.accessToken) {
        supabaseTokens = {
          supabaseToken: supabaseResult.accessToken,
          supabaseRefreshToken: supabaseResult.refreshToken,
        };
        console.log('[SyncController] Supabase tokens generated successfully');
      } else {
        console.log('[SyncController] No tokens in Supabase result');
      }
    } catch (error) {
      // Log but don't fail validation if Supabase integration fails
      console.error('[SyncController] Supabase integration error:', error);
      this.utilityService.log(
        `Supabase integration failed for license ${req.license?.licenseKey}: ${error.message}`,
      );
    }

    const response: ValidateLicenseResponseDto = {
      valid: true,
      companyId: req.license?.companyId,
      companyName:
        req.license?.company?.companyName ||
        `Company ${req.license?.companyId}`,
      gateName: req.license?.gate?.gateName || null,
      licenseType: req.license?.licenseType || 'SCHOOL',
      ...supabaseTokens,
    };

    return this.utilityService.responseHandler(Promise.resolve(response), res);
  }

  @Get('status')
  async getSyncStatus(@Req() req: RequestWithLicense, @Res() res: Response) {
    if (!req.deviceConnection) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('Device not connected')),
        res,
      );
    }

    return this.utilityService.responseHandler(
      this.syncService.getSyncStatus(
        req.deviceConnection,
        this.utilityService.companyId,
      ),
      res,
    );
  }

  @Post('pull')
  async pullSync(
    @Body() dto: SyncPullDto,
    @Req() req: RequestWithLicense,
    @Res() res: Response,
  ) {
    if (!req.deviceConnection) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('Device not connected')),
        res,
      );
    }

    return this.utilityService.responseHandler(
      this.syncService.pullSync(
        req.deviceConnection,
        this.utilityService.companyId,
        dto,
      ),
      res,
    );
  }

  @Post('attendance')
  async submitAttendance(
    @Body() dto: SchoolAttendanceBatchDto,
    @Req() req: RequestWithLicense,
    @Res() res: Response,
  ) {
    if (!req.deviceConnection) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('Device not connected')),
        res,
      );
    }

    return this.utilityService.responseHandler(
      this.syncService.submitSchoolAttendance(
        req.deviceConnection,
        this.utilityService.companyId,
        dto,
      ),
      res,
    );
  }

  @Get('attendance/pending')
  async getPendingAttendanceCount(
    @Req() req: RequestWithLicense,
    @Res() res: Response,
  ) {
    if (!req.deviceConnection) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('Device not connected')),
        res,
      );
    }

    return this.utilityService.responseHandler(
      this.syncService.getPendingAttendanceCount(
        req.deviceConnection,
        this.utilityService.companyId,
      ),
      res,
    );
  }

  @Post('attendance/pull')
  async pullAttendanceFromDevices(
    @Body() dto: AttendancePullRequestDto,
    @Req() req: RequestWithLicense,
    @Res() res: Response,
  ) {
    if (!req.deviceConnection) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('Device not connected')),
        res,
      );
    }

    return this.utilityService.responseHandler(
      this.syncService.pullAttendanceFromDevices(
        req.deviceConnection,
        this.utilityService.companyId,
        dto,
      ),
      res,
    );
  }
}
