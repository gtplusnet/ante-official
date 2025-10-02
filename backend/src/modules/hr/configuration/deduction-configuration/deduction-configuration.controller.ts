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
import { DeductionConfigurationService } from './deduction-configuration.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateDeductionConfigurationDTO,
  UpdateDeductionConfigurationDTO,
} from './deduction-configuration.interface';

@Controller('hr-configuration/deduction')
export class DeductionConfigurationController {
  constructor(
    private readonly deductionConfigurationService: DeductionConfigurationService,
    private readonly utilityService: UtilityService,
  ) {}

  @Get()
  async getDeductionById(@Query('id') id: number, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.deductionConfigurationService.getById(id),
      response,
    );
  }

  @Get('parents')
  async getDeductionParents(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.deductionConfigurationService.getParents(),
      response,
    );
  }

  @Get('categories')
  async getDeductionCategories(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.deductionConfigurationService.getCategories(),
      response,
    );
  }

  @Get('select-options')
  async getDeductionSelectOptions(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.deductionConfigurationService.getSelectOptions(),
      response,
    );
  }

  @Post()
  async createDeductionConfiguration(
    @Body() body: CreateDeductionConfigurationDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionConfigurationService.create(body),
      response,
    );
  }

  @Patch()
  async updateDeductionConfiguration(
    @Body() body: UpdateDeductionConfigurationDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionConfigurationService.update(body),
      response,
    );
  }

  @Delete()
  async deleteDeductionConfiguration(
    @Query('id') id: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionConfigurationService.delete(id),
      response,
    );
  }
}
