import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { DeviceLicenseService } from './device-license.service';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import {
  DeviceLicenseGenerateRequest,
  DeviceLicenseUpdateRequest,
  DeviceConnectionRequest,
  DeviceLicenseRegenerateRequest,
  DeviceLicenseDeleteRequest,
} from '@shared/request/device-license.request';

@Controller('school/device-license')
export class DeviceLicenseController {
  constructor(
    private readonly deviceLicenseService: DeviceLicenseService,
    private readonly utilityService: UtilityService,
  ) {}

  @Post('generate')
  async generateLicenses(
    @Body() data: DeviceLicenseGenerateRequest,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deviceLicenseService.generateLicenses(
        data,
        this.utilityService.companyId,
      ),
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
      this.deviceLicenseService.table(
        body,
        query,
        this.utilityService.companyId,
      ),
      res,
    );
  }

  @Put('update')
  async updateLicense(
    @Body() data: DeviceLicenseUpdateRequest,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deviceLicenseService.updateLicense(
        data,
        this.utilityService.companyId,
      ),
      res,
    );
  }

  @Post('regenerate')
  async regenerateLicense(
    @Body() data: DeviceLicenseRegenerateRequest,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deviceLicenseService.regenerateLicense(
        data,
        this.utilityService.companyId,
      ),
      res,
    );
  }

  @Delete('delete')
  async deleteLicenses(
    @Body() data: DeviceLicenseDeleteRequest,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deviceLicenseService.deleteLicenses(
        data,
        this.utilityService.companyId,
      ),
      res,
    );
  }

  @Post('connect')
  async connectDevice(
    @Body() data: DeviceConnectionRequest,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deviceLicenseService.connectDevice(data),
      res,
    );
  }
}
