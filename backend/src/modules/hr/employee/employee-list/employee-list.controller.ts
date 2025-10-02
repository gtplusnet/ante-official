import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Query,
  Body,
  Res,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmployeeListService } from './employee-list.service';
import { UtilityService } from '@common/utility.service';
import { EmployeeDocumentService } from '../employee-document/employee-document.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import {
  EmployeeCreateDTO,
  EmployeeGetDTO,
  EmployeeUpdateDTO,
  EmployeeDeleteDTO,
  EmployeeRestoreDTO,
  AddContractRequestDTO,
  EditContractRequestDTO,
  SetContractInactiveRequestDTO,
  EmployeeJobDetailsUpdateDTO,
  EmployeeGovernmentDetailsUpdateDTO,
  EmployeeScheduleUpdateDTO,
} from './employee-list.interface';
import { MulterFile } from '../../../../types/multer';
import {
  EmployeeDocumentUploadDTO,
  EmployeeDocumentUpdateDTO,
  EmployeeDocumentListDTO,
} from '../employee-document/employee-document.interface';

@Controller('hris/employee')
export class EmployeeListController {
  constructor(
    private readonly employeeListService: EmployeeListService,
    private readonly utilityService: UtilityService,
    private readonly employeeDocumentService: EmployeeDocumentService,
  ) {}

  @Get('info')
  async employeeInfo(
    @Query() params: EmployeeGetDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeListService.info(params.accountId),
      response,
    );
  }

  @Put('table')
  async employeeList(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeListService.employeeTable(query, body),
      response,
    );
  }

  @Post('add')
  async addEmployee(
    @Body() body: EmployeeCreateDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeListService.add(body),
      response,
    );
  }

  @Patch('update')
  async updateEmployee(
    @Body() body: EmployeeUpdateDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeListService.edit(body),
      response,
    );
  }

  @Delete('delete')
  async deleteEmployee(
    @Body() body: EmployeeDeleteDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeListService.delete(body),
      response,
    );
  }

  @Patch('restore')
  async restoreEmployee(
    @Body() body: EmployeeRestoreDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeListService.restore(body),
      response,
    );
  }

  @Patch('update-job-details')
  async updateJobDetails(
    @Body() body: EmployeeJobDetailsUpdateDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeListService.updateJobDetails(body),
      response,
    );
  }

  @Patch('update-government-details')
  async updateGovernmentDetails(
    @Body() body: EmployeeGovernmentDetailsUpdateDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeListService.updateGovernmentDetails(body),
      response,
    );
  }

  @Patch('update-schedule')
  async updateSchedule(
    @Body() body: EmployeeScheduleUpdateDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeListService.updateSchedule(body),
      response,
    );
  }

  @Post('contract/add')
  async addContract(
    @Body() body: AddContractRequestDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeListService.addContract(body.accountId, body.contractData),
      response,
    );
  }

  @Patch('contract/edit')
  async editContract(
    @Body() body: EditContractRequestDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeListService.editContract(body.contractId, body.contractData),
      response,
    );
  }

  @Patch('contract/inactive')
  async setContractInactive(
    @Body() body: SetContractInactiveRequestDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeListService.setContractInactive(body.contractId),
      response,
    );
  }

  @Get('contract/list')
  async getContractsByAccountId(
    @Query('accountId') accountId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeListService.getContractsByAccountId(accountId),
      response,
    );
  }

  @Get('contract/employment-status')
  async getEmploymentStatusReference(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.employeeListService.getEmploymentStatusReference(),
      response,
    );
  }

  @Get('export')
  async exportEmployeesToExcel(@Res() response: Response) {
    const buffer = await this.employeeListService.exportEmployeesToExcel();
    response.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="employees.xlsx"',
      'Content-Length': buffer.length,
    });
    response.end(buffer);
  }

  @Get('template')
  async downloadEmployeeTemplate(@Res() response: Response) {
    const buffer = await this.employeeListService.downloadEmployeeTemplate();
    response.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="employee_import_template.xlsx"',
      'Content-Length': buffer.length,
    });
    response.end(buffer);
  }

  // Employee Document endpoints
  @Post('document/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: MulterFile,
    @Body() body: EmployeeDocumentUploadDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeDocumentService.uploadDocument(file, body),
      response,
    );
  }

  @Get('document/list')
  async getDocuments(
    @Query() query: EmployeeDocumentListDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeDocumentService.getDocuments(query),
      response,
    );
  }

  @Get('document/types')
  async getDocumentTypes(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.employeeDocumentService.getDocumentTypes(),
      response,
    );
  }

  @Patch('document/:id')
  async updateDocument(
    @Param('id') id: string,
    @Body() body: EmployeeDocumentUpdateDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeDocumentService.updateDocument(Number(id), body),
      response,
    );
  }

  @Delete('document/:id')
  async deleteDocument(@Param('id') id: string, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.employeeDocumentService.deleteDocument(Number(id)),
      response,
    );
  }

  // Employee Leave Summary endpoint
  @Get('leave-summary')
  async getEmployeeLeaveSummary(
    @Query() params: EmployeeGetDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeListService.getLeaveSummary(params.accountId),
      response,
    );
  }

  // Employee Allowances endpoint
  @Get('allowances')
  async getEmployeeAllowances(
    @Query() params: EmployeeGetDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeListService.getAllowances(params.accountId),
      response,
    );
  }

  // Employee Deductions endpoint
  @Get('deductions')
  async getEmployeeDeductions(
    @Query() params: EmployeeGetDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeListService.getDeductions(params.accountId),
      response,
    );
  }

  // Employee Scheduling List endpoint
  @Get('scheduling-list')
  async getSchedulingList(
    @Res() response: Response,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
  ) {
    return this.utilityService.responseHandler(
      this.employeeListService.getEmployeeListForScheduling(
        Number(page || '1'),
        Number(perPage || '20'),
        search,
      ),
      response,
    );
  }

  // Shifts for Scheduling endpoint
  @Get('scheduling-shifts')
  async getSchedulingShifts(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.employeeListService.getShiftsForScheduling(),
      response,
    );
  }
}
