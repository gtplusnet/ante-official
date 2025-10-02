import {
  Body,
  Response as NestResponse,
  Inject,
  Query,
  Put,
  Controller,
  UsePipes,
  ValidationPipe,
  Post,
  Get,
  Delete,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { EquipmentService } from './equipment.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import {
  EquipmentCreateDTO,
  EquipmentItemCreateDTO,
  EquipmentMaintenanceCreateDTO,
  EquipmentPartCreateDTO,
  EquipmentPartsSetNextMaintenanceDate,
} from './equipment.interface';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('equipment')
export class EquipmentController {
  @Inject() public utilityService: UtilityService;
  @Inject() public equipmentService: EquipmentService;

  @Get('parts')
  async getParts(@NestResponse() response: Response, @Query('id') id: number) {
    this.utilityService.responseHandler(
      this.equipmentService.getParts(id),
      response,
    );
  }

  @Post('parts/set-next-maintenance-date')
  async setNextMaintenanceDate(
    @NestResponse() response: Response,
    @Body() body: EquipmentPartsSetNextMaintenanceDate,
  ) {
    this.utilityService.responseHandler(
      this.equipmentService.setNextMaintenanceDate(body),
      response,
    );
  }

  @Post('parts-maintenance')
  async savePartsMaintenance(
    @NestResponse() response: Response,
    @Body() body: EquipmentMaintenanceCreateDTO,
  ) {
    this.utilityService.responseHandler(
      this.equipmentService.savePartsMaintenance(body),
      response,
    );
  }

  @Put('parts-table')
  async getPartsTable(
    @NestResponse() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    this.utilityService.responseHandler(
      this.equipmentService.getPartsTable(query, body),
      response,
    );
  }

  @Put('maintenance-history-table')
  async getMaintenanceHistory(
    @NestResponse() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    this.utilityService.responseHandler(
      this.equipmentService.getMaintenanceHistoryTable(query, body),
      response,
    );
  }

  @Post('maintenance-history/next-stage')
  async nextStage(@NestResponse() response: Response, @Body('id') id: number) {
    this.utilityService.responseHandler(
      this.equipmentService.maintenanceNextStage(id),
      response,
    );
  }

  @Get('parts-items')
  async getPartsItems(
    @NestResponse() response: Response,
    @Query('partId') partId: number,
  ) {
    this.utilityService.responseHandler(
      this.equipmentService.getPartsItems(partId),
      response,
    );
  }

  @Post('parts-items')
  async savePartsItems(
    @NestResponse() response: Response,
    @Body() body: EquipmentItemCreateDTO,
  ) {
    this.utilityService.responseHandler(
      this.equipmentService.savePartsItems(body),
      response,
    );
  }

  @Delete('parts-items')
  async deletePartsItems(
    @NestResponse() response: Response,
    @Body('id') id: number,
  ) {
    this.utilityService.responseHandler(
      this.equipmentService.deletePartsItems(id),
      response,
    );
  }

  @Delete('parts')
  async deleteParts(
    @NestResponse() response: Response,
    @Query('id') id: number,
  ) {
    this.utilityService.responseHandler(
      this.equipmentService.deleteParts(id),
      response,
    );
  }

  @Get()
  async getEquipmentData(
    @NestResponse() response: Response,
    @Query('id') id: number,
  ) {
    this.utilityService.responseHandler(
      this.equipmentService.getEquipmentData(id),
      response,
    );
  }

  @Put()
  async table(
    @NestResponse() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    this.utilityService.responseHandler(
      this.equipmentService.table(query, body),
      response,
    );
  }

  @Post()
  async saveEquipment(
    @NestResponse() response: Response,
    @Body() body: EquipmentCreateDTO,
  ) {
    this.utilityService.responseHandler(
      this.equipmentService.saveEquipment(body),
      response,
    );
  }

  @Post('part')
  async saveParts(
    @NestResponse() response: Response,
    @Body() body: EquipmentPartCreateDTO,
  ) {
    this.utilityService.responseHandler(
      this.equipmentService.saveParts(body),
      response,
    );
  }

  @Post('save-brand')
  async saveBrand(@NestResponse() response: Response, @Body() body: any) {
    this.utilityService.responseHandler(
      this.equipmentService.saveBrand(body),
      response,
    );
  }
}
