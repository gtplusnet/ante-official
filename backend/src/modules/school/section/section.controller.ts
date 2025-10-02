import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { SectionService } from './section.service';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import {
  CreateSectionDto,
  UpdateSectionDto,
} from './section.validator';

@Controller('school/section')
export class SectionController {
  constructor(
    private readonly sectionService: SectionService,
    private readonly utilityService: UtilityService,
  ) {}

  @Post('create')
  async create(@Body() data: CreateSectionDto, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.sectionService.create(data, this.utilityService.companyId),
      res,
    );
  }

  @Put('update')
  async update(
    @Query('id') id: string,
    @Body() data: UpdateSectionDto,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.sectionService.update(id, data, this.utilityService.companyId),
      res,
    );
  }

  @Get('info')
  async getInfo(@Query('id') id: string, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.sectionService.findOne(id, this.utilityService.companyId),
      res,
    );
  }

  @Get('list')
  async list(@Res() res: Response) {
    return this.utilityService.responseHandler(
      this.sectionService.list(this.utilityService.companyId),
      res,
    );
  }

  @Delete('delete')
  async delete(@Query('id') id: string, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.sectionService.delete(id, this.utilityService.companyId),
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
      this.sectionService.table(body, query, this.utilityService.companyId),
      res,
    );
  }
}