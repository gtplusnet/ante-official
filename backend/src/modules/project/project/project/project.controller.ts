import {
  Controller,
  Body,
  Inject,
  Post,
  Response as NestResponse,
  Query,
  Put,
  Get,
  Patch,
  Delete,
} from '@nestjs/common';
import { Response } from 'express';
import { ProjectCreateDto } from '@modules/project/project/project/project.validator.dto';
import { ProjectService } from './project.service';
import { ClientService } from '@modules/crm/client/client/client.service';
import { UtilityService } from '@common/utility.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import {
  ProjectIdDto,
  ProjectUpdateDto,
  ProjectDeleteAllDto,
  ProjectMoveDto,
} from '@modules/project/project/project/project.validator.dto';
import { ProjectDataResponse } from '../../../../shared/response';

@Controller('project')
export class ProjectController {
  @Inject() public projectService: ProjectService;
  @Inject() public clientService: ClientService;
  @Inject() public utilityService: UtilityService;

  @Post()
  async create(
    @Body() createProjectDto: ProjectCreateDto,
    @NestResponse() response: Response<ProjectDataResponse>,
  ) {
    return this.utilityService.responseHandler(
      this.projectService.createProject(createProjectDto),
      response,
    );
  }

  @Patch()
  async updateProjectInformation(
    @Body() createProjectDto: ProjectUpdateDto,
    @NestResponse() response: Response<ProjectDataResponse>,
  ) {
    return this.utilityService.responseHandler(
      this.projectService.updateProjectInformation(createProjectDto),
      response,
    );
  }

  @Patch('board-stage')
  async updateProjectBoardStage(
    @Body() projectMoveDto: ProjectMoveDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.projectService.updateProjectBoard(projectMoveDto),
      response,
    );
  }

  @Put()
  async table(
    @NestResponse() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    return this.utilityService.responseHandler(
      this.projectService.projectTable(query, body),
      response,
    );
  }

  @Get('list')
  async getProjectList(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.projectService.getProjectList(),
      response,
    );
  }

  @Get()
  async getProjectInformation(
    @NestResponse() response: Response,
    @Query() parameters: ProjectIdDto,
  ) {
    return this.utilityService.responseHandler(
      this.projectService.getProjectInformationByID(parameters),
      response,
    );
  }

  @Delete()
  async deleteProject(
    @NestResponse() response: Response,
    @Query('id') projectId: number,
  ) {
    return this.utilityService.responseHandler(
      this.projectService.deleteProject(projectId),
      response,
    );
  }

  @Delete('all') async deleteAll(
    @NestResponse() response: Response,
    @Body() parameters: ProjectDeleteAllDto,
  ) {
    return this.utilityService.responseHandler(
      this.projectService.deleteAllProject(parameters),
      response,
    );
  }
}
