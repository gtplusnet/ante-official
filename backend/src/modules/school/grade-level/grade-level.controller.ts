import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Res,
  Patch,
} from '@nestjs/common';
import { Response } from 'express';
import { GradeLevelService } from './grade-level.service';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import {
  GradeLevelCreateDTO,
  GradeLevelUpdateDTO,
} from './grade-level.interface';

@Controller('school/grade-level')
export class GradeLevelController {
  constructor(
    private readonly gradeLevelService: GradeLevelService,
    private readonly utilityService: UtilityService,
  ) {}

  @Get('info')
  async getGradeLevelInfo(@Query('id') id: number, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.gradeLevelService.getInfo(id),
      response,
    );
  }

  @Put('table')
  async getGradeLevelTable(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.gradeLevelService.table(query, body),
      response,
    );
  }

  @Post('create')
  async createGradeLevel(
    @Body() body: GradeLevelCreateDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.gradeLevelService.create(body),
      response,
    );
  }

  @Patch('update')
  async updateGradeLevel(
    @Body() body: GradeLevelUpdateDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.gradeLevelService.update(body),
      response,
    );
  }

  @Delete('delete')
  async deleteGradeLevel(@Query('id') id: number, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.gradeLevelService.delete(id),
      response,
    );
  }

  @Post('seed')
  async seedGradeLevels(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.gradeLevelService.seedDefaultGradeLevels(),
      response,
    );
  }

  @Get('list')
  async getGradeLevelList(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.gradeLevelService.getList(),
      response,
    );
  }
}
