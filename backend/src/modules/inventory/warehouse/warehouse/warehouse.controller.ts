import {
  Controller,
  Post,
  Body,
  Res,
  Put,
  Get,
  Query,
  Param,
  Inject,
} from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import {
  WarehouseCreateDTO,
  WarehouseUpdateDTO,
} from '../../../../dto/warehouse.validator';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { UtilityService } from '@common/utility.service';

@Controller('warehouse')
export class WarehouseController {
  @Inject() public warehouseService: WarehouseService;
  @Inject() public utility: UtilityService;

  @Put()
  async table(
    @Res() response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    return this.utility.responseHandler(
      this.warehouseService.getTable(query, body),
      response,
    );
  }

  @Get(':id')
  async getWarehouseById(@Res() response, @Param('id') id: string) {
    return this.utility.responseHandler(
      this.warehouseService.getWarehouseById(id),
      response,
    );
  }

  @Post()
  async createWarehouse(
    @Res() response,
    @Body() warehouseCreateDTO: WarehouseCreateDTO,
  ) {
    this.utility.responseHandler(
      this.warehouseService.createWarehouse(warehouseCreateDTO),
      response,
    );
  }

  @Put(':id')
  async updateWarehouse(
    @Res() response,
    @Param('id') id: string,
    @Body() warehouseUpdateDTO: WarehouseUpdateDTO,
  ) {
    return this.utility.responseHandler(
      this.warehouseService.updateWarehouse(id, warehouseUpdateDTO),
      response,
    );
  }

  @Put(':id/set-main')
  async setMainWarehouse(@Res() response, @Param('id') id: string) {
    return this.utility.responseHandler(
      this.warehouseService.setMainWarehouse(id),
      response,
    );
  }
}
