import {
  Body,
  Response as NestResponse,
  Inject,
  Query,
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { BranchService } from './branch.service';
import { BranchCreateDTO } from './branch.interface';

@Controller('branch')
export class BranchController {
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly branchService: BranchService;

  @Get('info')
  async getBranchInfo(
    @Query('id') id: string,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.branchService.getBranchInformation(id),
      response,
    );
  }

  @Get('parent-options')
  async getParentBranchOptions(
    @Query('excludeId') excludeId: string,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.branchService.getParentBranchOptions(excludeId),
      response,
    );
  }

  @Get('tree')
  async getBranchTree(@NestResponse() response: Response) {
    this.utilityService.responseHandler(
      this.branchService.getBranchTree(),
      response,
    );
  }

  @Put('table')
  async getBranchesTable(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.branchService.getBranchesTable(query, body),
      response,
    );
  }

  @Post('create')
  async createBranch(
    @Body() body: BranchCreateDTO,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.branchService.createBranch(body),
      response,
    );
  }

  @Patch('update')
  async updateBranch(
    @Body() body: BranchCreateDTO,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.branchService.createBranch(body),
      response,
    );
  }

  @Delete('delete')
  async deleteBranch(
    @Query('id') id: string,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.branchService.deleteBranch(id),
      response,
    );
  }
}
