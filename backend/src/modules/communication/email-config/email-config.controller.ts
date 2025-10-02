import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Response as NestResponse,
  Inject,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { EmailConfigService } from './email-config.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateEmailConfigDto,
  UpdateEmailConfigDto,
  TestEmailConnectionDto,
} from './email-config.validator.dto';
import { AccountDataResponse } from '@shared/response';

@Controller('email-config')
export class EmailConfigController {
  @Inject() private emailConfigService: EmailConfigService;
  @Inject() private utilityService: UtilityService;

  @Get()
  async getEmailConfiguration(@NestResponse() response: Response) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailConfigService.getEmailConfiguration(account.id),
      response,
    );
  }

  @Post()
  async createEmailConfiguration(
    @Body() dto: CreateEmailConfigDto,
    @NestResponse() response: Response,
  ) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailConfigService.createEmailConfiguration(account.id, dto),
      response,
    );
  }

  @Put()
  async updateEmailConfiguration(
    @Body() dto: UpdateEmailConfigDto,
    @NestResponse() response: Response,
  ) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailConfigService.updateEmailConfiguration(account.id, dto),
      response,
    );
  }

  @Delete()
  async deleteEmailConfiguration(@NestResponse() response: Response) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailConfigService.deleteEmailConfiguration(account.id),
      response,
    );
  }

  @Post('test')
  async testEmailConnection(
    @Body() dto: TestEmailConnectionDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.emailConfigService.testEmailConnection(dto),
      response,
    );
  }

  @Post('test-saved')
  async testSavedConnection(@NestResponse() response: Response) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailConfigService.testSavedConnection(account.id),
      response,
    );
  }

  @Get('presets/:provider')
  async getEmailProviderPresets(
    @NestResponse() response: Response,
    @Param('provider') provider: string,
  ) {
    const presets = this.emailConfigService.getEmailProviderPresets(provider);

    if (!presets) {
      return response.status(404).json({ message: 'Provider not found' });
    }

    return response.json(presets);
  }
}
