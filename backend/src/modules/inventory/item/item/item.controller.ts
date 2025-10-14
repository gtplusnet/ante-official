import {
  Controller,
  Post,
  Body,
  Res,
  Inject,
  Get,
  Query,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { ItemService } from './item.service';
import {
  CreateSimpleItemDto,
  UpdateSimpleItemDto,
} from '../../../../dto/simple-item.validator.dto';
import { UtilityService } from '@common/utility.service';
import {
  CreateItemWithVariantsDto,
  GetVariationItemDTO,
  UpdateItemWithVariantsDto,
} from '../../../../dto/variation-item.create.dto';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';

@Controller('items')
export class ItemController {
  @Inject() public itemService: ItemService;
  @Inject() public utility: UtilityService;

  @Put('advanceView')
  async getItemAdvanceView(
    @Res() response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @Query('keyword') keyword?: string,
    @Query('tagKey') tagKey?: string,
  ) {
    this.utility.responseHandler(
      this.itemService.getItemAdvanceView(query, body, keyword, tagKey),
      response,
    );
  }

  @Put('simpleView')
  async getItemSimpleView(
    @Res() response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @Query('keyword') keyword?: string,
    @Query('tagKey') tagKey?: string,
  ) {
    this.utility.responseHandler(
      this.itemService.getItemSimpleView(query, body, keyword, tagKey),
      response,
    );
  }

  @Post('get-variation-item')
  async getVariationItem(@Res() response, @Body() body: GetVariationItemDTO) {
    this.utility.responseHandler(
      this.itemService.getVariationItem(body),
      response,
    );
  }

  @Get(':id')
  async getItemInfoById(@Res() response, @Param('id') id: string) {
    this.utility.responseHandler(
      this.itemService.getItemInfoById(id),
      response,
    );
  }

  @Get(':id/parent')
  async getParentItemInfoById(@Res() response, @Param('id') id: string) {
    this.utility.responseHandler(
      this.itemService.getItemAndChildrenInfoById(id),
      response,
    );
  }

  @Post()
  async createSimpleItem(
    @Res() response,
    @Body() itemDto: CreateSimpleItemDto,
  ) {
    this.utility.responseHandler(
      this.itemService.createSimpleItem(itemDto),
      response,
    );
  }

  @Post('withVariants')
  async createItemWithVariants(
    @Res() response,
    @Body() itemDto: CreateItemWithVariantsDto,
  ) {
    this.utility.responseHandler(
      this.itemService.createItemWithVariants(itemDto),
      response,
    );
  }

  @Post('update-variation-item/id')
  async updateItemWithVariants(
    @Res() response,
    @Body() itemDto: UpdateItemWithVariantsDto,
  ) {
    this.utility.responseHandler(
      this.itemService.updateItemWithVariants(itemDto.id, itemDto),
      response,
    );
  }

  @Post('update-simple-item')
  async updateSimpleItem(
    @Res() response,
    @Body() updateItemDto: UpdateSimpleItemDto,
  ) {
    this.utility.responseHandler(
      this.itemService.updateSimpleItem(updateItemDto),
      response,
    );
  }

  @Delete(':id')
  async softDeleteItemById(@Res() response, @Param('id') id: string) {
    this.utility.responseHandler(
      this.itemService.softDeleteItemById({ parentId: id }),
      response,
    );
  }

  @Put('restore/:id')
  async restoreItem(@Res() response, @Param('id') id: string) {
    this.utility.responseHandler(
      this.itemService.restoreItem({ parentId: id }),
      response,
    );
  }
}
