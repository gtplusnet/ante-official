import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Inject,
  Res,
} from '@nestjs/common';
import { HrFilingService } from './hr-filing.service';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import {
  CreatePayrollFilingDTO,
  UpdatePayrollFilingDTO,
  FilingActionDTO,
  QueryFilingDTO,
} from './dto/payroll-filing.dto';

@Controller('hr-filing')
export class HrFilingController {
  @Inject() private readonly hrFilingService: HrFilingService;
  @Inject() private readonly utilityService: UtilityService;

  /**
   * Create a new HR filing
   * @param body - Filing details including optional 'reason' parameter
   * @param res - Express response object
   */
  @Post('filing')
  async createFiling(
    @Body() body: CreatePayrollFilingDTO,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrFilingService.createFiling(body),
      res,
    );
  }

  @Patch('filing')
  async updateFiling(
    @Body() body: UpdatePayrollFilingDTO,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrFilingService.updateFiling(body),
      res,
    );
  }

  @Get('filing')
  async getFilingById(@Query('id') id: number, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.hrFilingService.getFilingById(Number(id)),
      res,
    );
  }

  @Get('filings')
  async getFilings(@Query() query: QueryFilingDTO, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.hrFilingService.getFilings(query),
      res,
    );
  }

  @Post('filing/cancel')
  async cancelFiling(@Body() body: FilingActionDTO, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.hrFilingService.cancelFiling(body),
      res,
    );
  }

  @Post('filing/approve')
  async approveFiling(@Body() body: FilingActionDTO, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.hrFilingService.approveFiling(body),
      res,
    );
  }

  @Post('filing/reject')
  async rejectFiling(@Body() body: FilingActionDTO, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.hrFilingService.rejectFiling(body),
      res,
    );
  }

  @Get('filing/:id/shift-details')
  async getFilingShiftDetails(@Param('id') id: string, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.hrFilingService.getFilingShiftDetails(Number(id)),
      res,
    );
  }

  @Get('dashboard-counters')
  async getDashboardCounters(@Res() res: Response) {
    return this.utilityService.responseHandler(
      this.hrFilingService.getDashboardCounters(),
      res,
    );
  }

  @Get('all-filings')
  async getAllFilings(@Query() query: QueryFilingDTO, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.hrFilingService.getAllFilings(query),
      res,
    );
  }
}
