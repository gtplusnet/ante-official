import {
  Inject,
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Delete,
  Body,
  Res,
  Query,
} from '@nestjs/common';
import {
  RoleGetDTO,
  RoleCreateDTO,
  RoleUpdateDTO,
  RoleDeleteDTO,
  RoleParentDTO,
} from '../../../dto/role.validator.dto';
import { DeveloperRoleService } from './developer-role.service';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { ChangeRoleParentDto } from './dto/change-parent.dto';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@Controller('developer-role')
export class DeveloperRoleController {
  @Inject() public developerRoleService: DeveloperRoleService;
  @Inject() public utility: UtilityService;

  @Get('tree')
  async tree(@Res() response) {
    return this.utility.responseHandler(
      this.developerRoleService.getTree(),
      response,
    );
  }

  @Get('by-group')
  async parent(@Res() response, @Query() params: RoleParentDTO) {
    return this.utility.responseHandler(
      this.developerRoleService.getRoleByGroup(params),
      response,
    );
  }

  @Get()
  async get(@Res() response, @Query() params: RoleGetDTO) {
    return this.utility.responseHandler(
      this.developerRoleService.getRole(params),
      response,
    );
  }

  @Put()
  async table(
    @Res() response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    return this.utility.responseHandler(
      this.developerRoleService.roleTable(query, body),
      response,
    );
  }

  @Post()
  async add(@Res() response, @Body() params: RoleCreateDTO) {
    const newRoleLevel = await this.developerRoleService.calculateRoleLevel(
      params.parentRoleId,
    );
    const adjustedParams = {
      ...params,
      level: newRoleLevel,
    };
    return this.utility.responseHandler(
      this.developerRoleService.addRole(adjustedParams),
      response,
    );
  }
  @Patch()
  async update(@Res() response, @Body() params: RoleUpdateDTO) {
    return this.utility.responseHandler(
      this.developerRoleService.updateRole(params),
      response,
    );
  }
  @Delete()
  async delete(@Res() response, @Query() params: RoleDeleteDTO) {
    return this.utility.responseHandler(
      this.developerRoleService.deleteRole(params),
      response,
    );
  }

  @ApiOperation({
    summary: 'Change the parent of a developer role in the role hierarchy',
  })
  @ApiBody({
    type: ChangeRoleParentDto,
    description: 'Role ID and new parent ID for reassignment',
  })
  @ApiResponse({
    status: 200,
    description: 'Developer role parent updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or circular reference detected',
  })
  @ApiResponse({
    status: 404,
    description: 'Role or parent not found',
  })
  @Patch('change-parent')
  async changeRoleParent(@Res() response, @Body() data: ChangeRoleParentDto) {
    return this.utility.responseHandler(
      this.developerRoleService.changeRoleParent(data),
      response,
    );
  }
}
