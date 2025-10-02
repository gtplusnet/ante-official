import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { EmployeeImportationService } from './employee-importation.service';
import { UtilityService } from '@common/utility.service';
import { EmployeeImportationDTO } from './employee-importation.interface';
import { MulterFile } from '../../../../types/multer';

@Controller('hris/employee/importation')
export class EmployeeImportationController {
  constructor(
    private readonly employeeImportationService: EmployeeImportationService,
    private readonly utilityService: UtilityService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('excelDataFile'))
  async importEmployee(
    @UploadedFile() excelDataFile: MulterFile,
    @Param() param: EmployeeImportationDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeImportationService.importEmployeeData(excelDataFile, param),
      response,
    );
  }
}
