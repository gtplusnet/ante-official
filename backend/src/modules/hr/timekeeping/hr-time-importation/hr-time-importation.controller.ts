import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { HrTimeImportationService } from './hr-time-importation.service';
import { ImportTimeFromImageDTO } from './import-time-from-image.dto';
import { UtilityService } from '@common/utility.service';

@Controller('hr-time-importation')
export class HrTimeImportationController {
  constructor(
    private readonly hrTimeImportationService: HrTimeImportationService,
    private readonly utilityService: UtilityService,
  ) {}

  @Post('image')
  async importTimeFromImage(
    @Body() dto: ImportTimeFromImageDTO,
    @Res() res: Response,
  ) {
    // For now, always return success
    return this.utilityService.responseHandler(
      this.hrTimeImportationService.importTimeFromImage(dto),
      res,
    );
  }
}
