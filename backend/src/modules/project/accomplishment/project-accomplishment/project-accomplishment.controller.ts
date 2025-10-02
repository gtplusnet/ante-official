import {
  Body,
  Response as NestResponse,
  Inject,
  HttpStatus,
  Query,
  Put,
  Controller,
  Post,
  Get,
  Patch,
  Delete,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { ProjectAccomplishmentService } from './project-accomplishment.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import {
  CreateProjectAccomplishmentDTO,
  UpdateWorkAccomplishmentDTO,
} from './project-accomplishment.interface';

@Controller('project-accomplishment')
export class ProjectAccomplishmentController {
  @Inject() public utilityService: UtilityService;
  @Inject() public projectAccomplishmentService: ProjectAccomplishmentService;

  @Put('table')
  async table(
    @NestResponse() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    try {
      const tableData = await this.projectAccomplishmentService.table(
        query,
        body,
      );

      return response.status(HttpStatus.OK).json({
        message: 'Project Accomplishment table successfully retrieved.',
        table: tableData,
      });
    } catch (error) {
      return this.utilityService.errorResponse(response, error, error.message);
    }
  }

  @Post('create')
  async create(
    @NestResponse() response: Response,
    @Body() body: CreateProjectAccomplishmentDTO,
  ) {
    try {
      const projectAccomplishment =
        await this.projectAccomplishmentService.create(body);

      return response.status(HttpStatus.OK).json({
        message: 'Project Accomplishment successfully created.',
        projectAccomplishment,
      });
    } catch (error) {
      return this.utilityService.errorResponse(response, error, error.message);
    }
  }

  @Patch('update')
  async update(
    @NestResponse() response: Response,
    @Body() body: UpdateWorkAccomplishmentDTO,
  ) {
    try {
      const projectAccomplishment =
        await this.projectAccomplishmentService.create(body);

      return response.status(HttpStatus.OK).json({
        message: 'Project Accomplishment successfully updated.',
        projectAccomplishment,
      });
    } catch (error) {
      return this.utilityService.errorResponse(response, error, error.message);
    }
  }

  @Get('latest')
  async getLatestAccomplishment(
    @NestResponse() response: Response,
    @Query('projectId') projectId: number,
  ) {
    try {
      const latestAccomplishment =
        await this.projectAccomplishmentService.getLatestAccomplishment(
          projectId,
        );

      return response.status(HttpStatus.OK).json({
        message: 'Latest project accomplishment successfully retrieved.',
        data: latestAccomplishment,
      });
    } catch (error) {
      return this.utilityService.errorResponse(response, error, error.message);
    }
  }

  @Delete('delete')
  async delete(@NestResponse() response: Response, @Query('id') id: number) {
    try {
      const data = await this.projectAccomplishmentService.delete(id);

      return response.status(HttpStatus.OK).json({
        message: 'Project Accomplishment successfully deleted.',
        data,
      });
    } catch (error) {
      return this.utilityService.errorResponse(response, error, error.message);
    }
  }
}
