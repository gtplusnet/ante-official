import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { GuardianService } from './guardian.service';
import { UtilityService } from '@common/utility.service';
import {
  GuardianCreateDTO,
  GuardianUpdateDTO,
  GuardianResetPasswordDTO,
  AssignStudentDTO,
  RemoveStudentDTO,
} from './guardian.interface';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';

@Controller('school/guardian')
export class GuardianController {
  constructor(
    private readonly guardianService: GuardianService,
    private readonly utilityService: UtilityService,
  ) {}

  @Post('create')
  async create(@Body() data: GuardianCreateDTO, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.guardianService.create(data, this.utilityService.companyId),
      res,
    );
  }

  @Get('list')
  async list(@Res() res: Response) {
    return this.utilityService.responseHandler(
      this.guardianService.findAll(this.utilityService.companyId),
      res,
    );
  }

  @Get('info')
  async getInfo(@Query('id') id: string, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.guardianService.findOne(id, this.utilityService.companyId),
      res,
    );
  }

  @Put('update')
  async update(
    @Query('id') id: string,
    @Body() data: GuardianUpdateDTO,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.guardianService.update(id, data, this.utilityService.companyId),
      res,
    );
  }

  @Delete('delete')
  async delete(@Query('id') id: string, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.guardianService.delete(id, this.utilityService.companyId),
      res,
    );
  }

  @Put('table')
  async table(
    @Body() body: TableBodyDTO,
    @Query() query: TableQueryDTO,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.guardianService.table(body, query, this.utilityService.companyId),
      res,
    );
  }

  @Post('reset-password')
  async resetPassword(
    @Body() data: GuardianResetPasswordDTO,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.guardianService.resetPassword(data, this.utilityService.companyId),
      res,
    );
  }

  @Post('assign-student')
  async assignStudent(@Body() data: AssignStudentDTO, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.guardianService.assignStudent(data, this.utilityService.companyId),
      res,
    );
  }

  @Delete('remove-student')
  async removeStudent(@Body() data: RemoveStudentDTO, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.guardianService.removeStudent(data, this.utilityService.companyId),
      res,
    );
  }

  @Get('student-guardians')
  async getStudentGuardians(
    @Query('studentId') studentId: string,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.guardianService.getStudentGuardians(
        studentId,
        this.utilityService.companyId,
      ),
      res,
    );
  }
}
