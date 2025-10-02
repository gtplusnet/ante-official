import { Controller, Get, Query, Inject, Res } from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { HrFilingService } from './hr-filing/hr-filing.service';
import { QueryFilingDTO } from './hr-filing/dto/payroll-filing.dto';
import { PayrollFilingType } from '@prisma/client';

@Controller('hr-filing/overtime')
export class OvertimeFilingController {
  @Inject() private readonly hrFilingService: HrFilingService;
  @Inject() private readonly utilityService: UtilityService;

  @Get()
  async getOvertimeFilings(
    @Query() query: QueryFilingDTO,
    @Res() res: Response,
  ) {
    const modifiedQuery = { ...query, filingType: PayrollFilingType.OVERTIME };
    return this.utilityService.responseHandler(
      this.hrFilingService.getFilings(modifiedQuery),
      res,
    );
  }
}

@Controller('hr-filing/leave')
export class LeaveFilingController {
  @Inject() private readonly hrFilingService: HrFilingService;
  @Inject() private readonly utilityService: UtilityService;

  @Get()
  async getLeaveFilings(@Query() query: QueryFilingDTO, @Res() res: Response) {
    const modifiedQuery = { ...query, filingType: PayrollFilingType.LEAVE };
    return this.utilityService.responseHandler(
      this.hrFilingService.getFilings(modifiedQuery),
      res,
    );
  }
}

@Controller('hr-filing/schedule')
export class ScheduleFilingController {
  @Inject() private readonly hrFilingService: HrFilingService;
  @Inject() private readonly utilityService: UtilityService;

  @Get()
  async getScheduleFilings(
    @Query() query: QueryFilingDTO,
    @Res() res: Response,
  ) {
    const modifiedQuery = {
      ...query,
      filingType: PayrollFilingType.SCHEDULE_ADJUSTMENT,
    };
    return this.utilityService.responseHandler(
      this.hrFilingService.getFilings(modifiedQuery),
      res,
    );
  }
}

@Controller('hr-filing/business')
export class BusinessFilingController {
  @Inject() private readonly hrFilingService: HrFilingService;
  @Inject() private readonly utilityService: UtilityService;

  @Get()
  async getBusinessFilings(
    @Query() query: QueryFilingDTO,
    @Res() res: Response,
  ) {
    const modifiedQuery = {
      ...query,
      filingType: PayrollFilingType.OFFICIAL_BUSINESS_FORM,
    };
    return this.utilityService.responseHandler(
      this.hrFilingService.getFilings(modifiedQuery),
      res,
    );
  }
}

@Controller('hr-filing/attendance')
export class AttendanceFilingController {
  @Inject() private readonly hrFilingService: HrFilingService;
  @Inject() private readonly utilityService: UtilityService;

  @Get()
  async getAttendanceFilings(
    @Query() query: QueryFilingDTO,
    @Res() res: Response,
  ) {
    const modifiedQuery = {
      ...query,
      filingType: PayrollFilingType.CERTIFICATE_OF_ATTENDANCE,
    };
    return this.utilityService.responseHandler(
      this.hrFilingService.getFilings(modifiedQuery),
      res,
    );
  }
}
