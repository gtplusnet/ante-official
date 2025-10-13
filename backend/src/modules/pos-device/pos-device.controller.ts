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
import { POSDeviceService } from './pos-device.service';
import { UtilityService } from '@common/utility.service';
import {
  POSDeviceCreateRequest,
  POSDeviceUpdateRequest,
  POSDeviceRegenerateKeyRequest,
  POSDeviceDeleteRequest,
  POSDeviceListRequest,
} from '@shared/request/pos-device.request';

@Controller('pos-device')
export class POSDeviceController {
  @Inject() private readonly posDeviceService: POSDeviceService;
  @Inject() private readonly utilityService: UtilityService;

  /**
   * Get all POS devices for the company
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

    const request: POSDeviceListRequest = {
      includeInactive: includeInactive === 'true',
    };

    const result = await this.posDeviceService.getAllDevices(
      companyId,
      request,
    );
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  /**
   * Get a single POS device by ID
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

    const result = await this.posDeviceService.getDeviceById(id, companyId);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  /**
   * Create a new POS device
   */
  @Post()
  async createDevice(
    @Body() body: POSDeviceCreateRequest,
    @NestResponse() res: Response,
  ) {
    const companyId = this.utilityService.accountInformation?.company?.id;
    if (!companyId) {
      return res.status(403).json({ message: 'Company not found' });
    }

    const result = await this.posDeviceService.createDevice(body, companyId);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  /**
   * Update POS device details
   */
  @Put(':id')
  async updateDevice(
    @Param('id') id: string,
    @Body() body: Omit<POSDeviceUpdateRequest, 'id'>,
    @NestResponse() res: Response,
  ) {
    const companyId = this.utilityService.accountInformation?.company?.id;
    if (!companyId) {
      return res.status(403).json({ message: 'Company not found' });
    }

    const result = await this.posDeviceService.updateDevice(
      { ...body, id },
      companyId,
    );
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  /**
   * Regenerate API key for a POS device
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

    const result = await this.posDeviceService.regenerateApiKey(
      { id },
      companyId,
    );
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  /**
   * Delete (soft delete) a POS device
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

    const result = await this.posDeviceService.deleteDevice(
      { id },
      companyId,
    );
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }
}
