import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  Inject,
  Response as NestResponse,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { UserPreferencesService } from './user-preferences.service';
import {
  UpdatePreferenceDto,
  BulkUpdatePreferencesDto,
  GetPreferenceDto,
} from './user-preferences.dto';

@Controller('account/preferences')
export class UserPreferencesController {
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly userPreferencesService: UserPreferencesService;

  /**
   * Get account ID from utility service account information
   */
  private getAccountId(): string {
    return this.utilityService.accountInformation?.id;
  }

  /**
   * GET /account/preferences
   * Get all user preferences
   */
  @Get()
  async getPreferences(
    @NestResponse() response: Response,
  ) {
    const accountId = this.getAccountId();
    return this.utilityService.responseHandler(
      this.userPreferencesService.getPreferences(accountId),
      response,
    );
  }

  /**
   * GET /account/preferences/:key
   * Get a specific preference by key
   * Supports dot notation (e.g., calendar.enabledSources)
   */
  @Get(':key')
  async getPreference(
    @Param('key') key: string,
    @Query('defaultValue') defaultValue: string,
    @NestResponse() response: Response,
  ) {
    const accountId = this.getAccountId();
    // Parse default value if provided (JSON string)
    const parsedDefault = defaultValue ? JSON.parse(defaultValue) : null;

    return this.utilityService.responseHandler(
      this.userPreferencesService.getPreference(accountId, key, parsedDefault),
      response,
    );
  }

  /**
   * PUT /account/preferences/:key
   * Update a specific preference by key
   */
  @Put(':key')
  async updatePreference(
    @Param('key') key: string,
    @Body() data: { value: any },
    @NestResponse() response: Response,
  ) {
    const accountId = this.getAccountId();
    return this.utilityService.responseHandler(
      this.userPreferencesService.updatePreference(accountId, key, data.value),
      response,
    );
  }

  /**
   * POST /account/preferences/bulk
   * Bulk update multiple preferences (deep merge)
   */
  @Post('bulk')
  async bulkUpdatePreferences(
    @Body() data: BulkUpdatePreferencesDto,
    @NestResponse() response: Response,
  ) {
    const accountId = this.getAccountId();
    return this.utilityService.responseHandler(
      this.userPreferencesService.bulkUpdatePreferences(accountId, data.preferences),
      response,
    );
  }

  /**
   * POST /account/preferences/reset
   * Reset all preferences to defaults
   */
  @Post('reset')
  async resetPreferences(
    @NestResponse() response: Response,
  ) {
    const accountId = this.getAccountId();
    return this.utilityService.responseHandler(
      this.userPreferencesService.resetPreferences(accountId),
      response,
    );
  }
}
