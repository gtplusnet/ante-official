import { Controller, Get, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { UtilityService } from '@common/utility.service';
import { EmployeeCurrentService } from './employee-current.service';

@Controller('hris/employee/current')
export class EmployeeCurrentController {
  constructor(
    private readonly employeeCurrentService: EmployeeCurrentService,
    private readonly utilityService: UtilityService,
  ) {}

  @Get('employment-details')
  async getEmploymentDetails(@Res() response: Response) {
    const accountId = this.utilityService.accountInformation?.id;
    return this.utilityService.responseHandler(
      this.employeeCurrentService.getEmploymentDetails(accountId),
      response,
    );
  }

  @Get('job-details')
  async getJobDetails(@Res() response: Response) {
    const accountId = this.utilityService.accountInformation?.id;
    return this.utilityService.responseHandler(
      this.employeeCurrentService.getJobDetails(accountId),
      response,
    );
  }

  @Get('shift')
  async getShiftDetails(@Res() response: Response) {
    const accountId = this.utilityService.accountInformation?.id;
    return this.utilityService.responseHandler(
      this.employeeCurrentService.getShiftDetails(accountId),
      response,
    );
  }

  @Get('allowances')
  async getAllowances(@Res() response: Response) {
    const accountId = this.utilityService.accountInformation?.id;
    return this.utilityService.responseHandler(
      this.employeeCurrentService.getAllowances(accountId),
      response,
    );
  }

  @Get('documents')
  async getDocuments(@Res() response: Response) {
    const accountId = this.utilityService.accountInformation?.id;
    return this.utilityService.responseHandler(
      this.employeeCurrentService.getDocuments(accountId),
      response,
    );
  }

  @Get('contract')
  async getContractDetails(@Res() response: Response) {
    const accountId = this.utilityService.accountInformation?.id;
    return this.utilityService.responseHandler(
      this.employeeCurrentService.getContractDetails(accountId),
      response,
    );
  }

  @Get('government-ids')
  async getGovernmentIds(@Res() response: Response) {
    const accountId = this.utilityService.accountInformation?.id;
    return this.utilityService.responseHandler(
      this.employeeCurrentService.getGovernmentIds(accountId),
      response,
    );
  }

  @Get('leaves')
  async getLeaves(@Res() response: Response) {
    const accountId = this.utilityService.accountInformation?.id;
    return this.utilityService.responseHandler(
      this.employeeCurrentService.getLeaves(accountId),
      response,
    );
  }

  @Get('deductions')
  async getDeductions(@Res() response: Response) {
    const accountId = this.utilityService.accountInformation?.id;
    return this.utilityService.responseHandler(
      this.employeeCurrentService.getDeductions(accountId),
      response,
    );
  }

  @Get('timesheet')
  async getTimesheet(@Res() response: Response) {
    const accountId = this.utilityService.accountInformation?.id;
    return this.utilityService.responseHandler(
      this.employeeCurrentService.getTimesheet(accountId),
      response,
    );
  }
}