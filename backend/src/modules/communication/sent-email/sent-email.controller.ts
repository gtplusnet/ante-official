import {
  Controller,
  Get,
  Param,
  Query,
  Response as NestResponse,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { SentEmailService } from './sent-email.service';
import { ListSentEmailsDto } from './dto/list-sent-emails.dto';
import { AccountDataResponse } from '@shared/response';

@Controller('api/sent-emails')
export class SentEmailController {
  @Inject() private sentEmailService: SentEmailService;
  @Inject() private utilityService: UtilityService;

  /**
   * Get list of sent emails
   */
  @Get()
  async listSentEmails(
    @Query() filters: ListSentEmailsDto,
    @NestResponse() response: Response,
  ) {
    const account: AccountDataResponse = this.utilityService.accountInformation;

    if (!account.company?.id) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('Company not found')),
        response,
      );
    }

    return this.utilityService.responseHandler(
      this.sentEmailService.listSentEmails(account.company.id, filters),
      response,
    );
  }

  /**
   * Get email statistics
   */
  @Get('stats')
  async getEmailStats(@NestResponse() response: Response) {
    const account: AccountDataResponse = this.utilityService.accountInformation;

    if (!account.company?.id) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('Company not found')),
        response,
      );
    }

    return this.utilityService.responseHandler(
      this.sentEmailService.getEmailStats(account.company.id),
      response,
    );
  }

  /**
   * Get sent email by ID
   */
  @Get(':id')
  async getSentEmailById(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    const account: AccountDataResponse = this.utilityService.accountInformation;

    if (!account.company?.id) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('Company not found')),
        response,
      );
    }

    return this.utilityService.responseHandler(
      this.sentEmailService.getSentEmailById(id, account.company.id),
      response,
    );
  }
}
