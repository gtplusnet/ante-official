import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { Response } from 'express';
import { PosDeviceAuthGuard } from './guards/pos-device-auth.guard';
import { PosDeviceRequest } from './interfaces/pos-device.request';

@ApiTags('POS - Items')
@Controller('pos')
@UseGuards(PosDeviceAuthGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'POS Device API Key',
  required: true,
})
@ApiHeader({
  name: 'x-device-id',
  description: 'Device Fingerprint ID',
  required: true,
})
@ApiHeader({
  name: 'x-cashier-session',
  description: 'Cashier Session Token (from login)',
  required: true,
})
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get('get_items')
  @ApiOperation({
    summary: 'Get all POS-enabled items',
    description: 'Retrieves all items enabled for POS for the device\'s company. Requires POS device API key and cashier ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of POS-enabled items retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Missing required headers (x-api-key or x-cashier-id)',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or inactive POS device API key or cashier',
  })
  @ApiResponse({
    status: 403,
    description: 'Cashier does not belong to the same company as the POS device',
  })
  async getPosItems(@Req() request: PosDeviceRequest) {
    const result = await this.posService.getPosItems(
      request.companyId,
      request.branchId,
    );

    return request['utility'].responseHandler(result, request);
  }
}
