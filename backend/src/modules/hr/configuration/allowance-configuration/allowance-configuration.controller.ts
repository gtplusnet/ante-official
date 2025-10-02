import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Body,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AllowanceConfigurationService } from './allowance-configuration.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateAllowanceConfigurationDTO,
  UpdateAllowanceConfigurationDTO,
} from './allowance-configuration.interface';

@Controller('hr-configuration/allowance')
export class AllowanceConfigurationController {
  constructor(
    private readonly allowanceConfigurationService: AllowanceConfigurationService,
    private readonly utilityService: UtilityService,
  ) {}

  @Get()
  async getAllowanceById(@Query('id') id: number, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.allowanceConfigurationService.getById(id),
      response,
    );
  }

  @Get('all')
  async getAllAllowances(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.allowanceConfigurationService.getAll(),
      response,
    );
  }

  @Get('tree')
  async getAllowanceTree(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.allowanceConfigurationService.getTree(),
      response,
    );
  }

  @Get('categories')
  async getAllowanceCategories(@Res() response: Response) {
    return this.utilityService.responseHandler(
      Promise.resolve(this.allowanceConfigurationService.getCategories()),
      response,
    );
  }

  @Get('tax-basis')
  async getAllowanceTaxBasis(@Res() response: Response) {
    return this.utilityService.responseHandler(
      Promise.resolve(this.allowanceConfigurationService.getTaxBasis()),
      response,
    );
  }

  @Get('select-options')
  async getAllowanceSelectOptions(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.allowanceConfigurationService.getSelectOptions(),
      response,
    );
  }

  @Post()
  async createAllowanceConfiguration(
    @Body() body: CreateAllowanceConfigurationDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.allowanceConfigurationService.create(body),
      response,
    );
  }

  @Patch()
  async updateAllowanceConfiguration(
    @Body() body: UpdateAllowanceConfigurationDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.allowanceConfigurationService.update(body),
      response,
    );
  }

  @Delete()
  async deleteAllowanceConfiguration(
    @Query('id') id: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.allowanceConfigurationService.delete(id),
      response,
    );
  }
}
