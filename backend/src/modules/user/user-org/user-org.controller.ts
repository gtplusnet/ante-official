import {
  Inject,
  Controller,
  Get,
  Patch,
  Body,
  Response as NestResponse,
  Query,
} from '@nestjs/common';
import { UserOrgService } from './user-org.service';
import { UtilityService } from '@common/utility.service';
import { Response } from 'express';
import { CommonIdDTO } from '../../../dto/common.id.dto';
import { ChangeParentDto } from './dto/change-parent.dto';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@Controller('user-org')
export class UserOrgController {
  @Inject() public utility: UtilityService;
  @Inject() public userOrgService: UserOrgService;

  @Get()
  async getUserOrgList(@NestResponse() response: Response) {
    this.utility.responseHandler(
      this.userOrgService.getUserOrgList(),
      response,
    );
  }

  @Get('tree')
  async roleTreeWithUsers(@NestResponse() response: Response) {
    this.utility.responseHandler(this.userOrgService.getUserTree(), response);
  }

  @Get('parent-list')
  async getUserParentList(
    @NestResponse() response: Response,
    @Query() parameters: CommonIdDTO,
  ) {
    this.utility.responseHandler(
      this.userOrgService.findParentUserDropdownList(parameters),
      response,
    );
  }

  @ApiOperation({
    summary: 'Change the parent of a user in the organizational hierarchy',
  })
  @ApiBody({
    type: ChangeParentDto,
    description: 'User ID and new parent ID for reassignment',
  })
  @ApiResponse({
    status: 200,
    description: 'User parent updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or circular reference detected',
  })
  @ApiResponse({
    status: 404,
    description: 'User or parent not found',
  })
  @Patch('change-parent')
  async changeUserParent(
    @NestResponse() response: Response,
    @Body() data: ChangeParentDto,
  ) {
    this.utility.responseHandler(
      this.userOrgService.changeUserParent(data),
      response,
    );
  }
}
