import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  Response as NestResponse,
} from '@nestjs/common';
import { Response } from 'express';
import { ManpowerDeviceService } from './manpower-device.service';
import { UtilityService } from '@common/utility.service';

@Controller('manpower/devices')
export class ManpowerDeviceController {
  @Inject() private readonly manpowerDeviceService: ManpowerDeviceService;
  @Inject() private readonly utilityService: UtilityService;

  /**
   * Get all devices for the company
   */
  @Get()
  async getAllDevices(
    @Query('includeInactive') includeInactive: string,
    @NestResponse() res: Response,
  ) {
    const companyId = this.utilityService.accountInformation?.company?.id;
    if (!companyId) {
      return res.status(403).json({ message: 'Company not found' });
    }

    const result = await this.manpowerDeviceService.getAllDevices(
      companyId,
      includeInactive === 'true',
    );
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  /**
   * Get a single device by ID
   */
  @Get(':id')
  async getDevice(
    @Param('id') id: string,
    @NestResponse() res: Response,
  ) {
    const companyId = this.utilityService.accountInformation?.company?.id;
    if (!companyId) {
      return res.status(403).json({ message: 'Company not found' });
    }

    const result = await this.manpowerDeviceService.getDeviceById(id, companyId);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  /**
   * Create a new device
   */
  @Post()
  async createDevice(
    @Body() body: {
      name: string;
      location?: string;
      projectId?: number;
    },
    @NestResponse() res: Response,
  ) {
    const companyId = this.utilityService.accountInformation?.company?.id;
    if (!companyId) {
      return res.status(403).json({ message: 'Company not found' });
    }

    const result = await this.manpowerDeviceService.createDevice({
      ...body,
      companyId,
    });
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  /**
   * Update device details
   */
  @Put(':id')
  async updateDevice(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      location?: string;
      projectId?: number | null;
      isActive?: boolean;
    },
    @NestResponse() res: Response,
  ) {
    const companyId = this.utilityService.accountInformation?.company?.id;
    if (!companyId) {
      return res.status(403).json({ message: 'Company not found' });
    }

    const result = await this.manpowerDeviceService.updateDevice(
      id,
      companyId,
      body,
    );
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  /**
   * Regenerate API key for a device
   */
  @Post(':id/regenerate-key')
  async regenerateApiKey(
    @Param('id') id: string,
    @NestResponse() res: Response,
  ) {
    const companyId = this.utilityService.accountInformation?.company?.id;
    if (!companyId) {
      return res.status(403).json({ message: 'Company not found' });
    }

    const result = await this.manpowerDeviceService.regenerateApiKey(id, companyId);

    // Return the new API key only once (it won't be retrievable again)
    return this.utilityService.responseHandler(
      Promise.resolve({
        device: result.device,
        apiKey: result.newApiKey, // Show the raw API key
        message: 'API key regenerated successfully. Please save it as it won\'t be shown again.',
      }),
      res,
    );
  }

  /**
   * Delete (soft delete) a device
   */
  @Delete(':id')
  async deleteDevice(
    @Param('id') id: string,
    @NestResponse() res: Response,
  ) {
    const companyId = this.utilityService.accountInformation?.company?.id;
    if (!companyId) {
      return res.status(403).json({ message: 'Company not found' });
    }

    const result = await this.manpowerDeviceService.deleteDevice(id, companyId);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }
}