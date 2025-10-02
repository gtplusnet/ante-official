import {
  Body,
  Controller,
  Inject,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import { DeliveryService } from './delivery.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import {
  SetStageForDeliveryDTO,
  ReceiveItemDTO,
} from '../../../../dto/delivery.validator';
import { Response } from 'express';
import { EquipmentService } from '@/equipment/equipment.service';

@Controller('delivery')
export class DeliveryController {
  @Inject() public utility: UtilityService;
  @Inject() public deliveryService: DeliveryService;
  @Inject() public equipmentService: EquipmentService;

  @Post('receive-item')
  async receiveItem(@Res() response: Response, @Body() body: ReceiveItemDTO) {
    this.utility.responseHandler(
      this.deliveryService.receiveItem(body),
      response,
    );
  }

  @Post('set-stage-for-delivery')
  async setStageForDelivery(
    @Res() response: Response,
    @Body() body: SetStageForDeliveryDTO,
  ) {
    this.utility.responseHandler(
      this.deliveryService.setStageForDelivery(body),
      response,
    );
  }

  @Post('set-stage')
  async setStage(@Res() response: Response, @Body() body: any) {
    this.utility.responseHandler(this.deliveryService.setStage(body), response);
  }
  @Put()
  async table(
    @Res() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    this.utility.responseHandler(
      this.deliveryService.table(query, body),
      response,
    );
  }
}
