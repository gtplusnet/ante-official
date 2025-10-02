import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Inject,
  Response as NestResponse,
} from '@nestjs/common';
import { Response } from 'express';
import { EmailService } from './email.service';
import { SendEmailDto } from './email-send.dto';
import { UtilityService } from '@common/utility.service';
import { AccountDataResponse } from '@shared/response';

@Controller('email')
export class EmailController {
  @Inject() private emailService: EmailService;
  @Inject() private utilityService: UtilityService;

  @Get('folders')
  async getFolders(@NestResponse() response: Response) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailService.getFolders(account.id),
      response,
    );
  }

  @Get('list')
  async getEmails(
    @Query('folder') folder = 'INBOX',
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('search') search = '',
    @NestResponse() response: Response,
  ) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailService.getEmails(account.id, {
        folder,
        page: parseInt(page),
        limit: parseInt(limit),
        search,
      }),
      response,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@NestResponse() response: Response) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailService.getUnreadCount(account.id),
      response,
    );
  }

  @Get(':id')
  async getEmail(@Param('id') id: string, @NestResponse() response: Response) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailService.getEmail(account.id, id),
      response,
    );
  }

  @Post('send')
  async sendEmail(
    @Body() dto: SendEmailDto,
    @NestResponse() response: Response,
  ) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailService.sendEmail(account.id, dto),
      response,
    );
  }

  @Put(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailService.markAsRead(account.id, id),
      response,
    );
  }

  @Put(':id/unread')
  async markAsUnread(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailService.markAsUnread(account.id, id),
      response,
    );
  }

  @Put(':id/star')
  async starEmail(@Param('id') id: string, @NestResponse() response: Response) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailService.starEmail(account.id, id),
      response,
    );
  }

  @Put(':id/unstar')
  async unstarEmail(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailService.unstarEmail(account.id, id),
      response,
    );
  }

  @Put(':id/move')
  async moveEmail(
    @Param('id') id: string,
    @Body('folder') folder: string,
    @NestResponse() response: Response,
  ) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailService.moveEmail(account.id, id, folder),
      response,
    );
  }

  @Delete(':id')
  async deleteEmail(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailService.deleteEmail(account.id, id),
      response,
    );
  }

  @Post('sync')
  async syncEmails(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.emailService.syncEmails(),
      response,
    );
  }

  @Get('verify')
  async verifyConnection(@NestResponse() response: Response) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailService.verifyConnection(account.id),
      response,
    );
  }

  @Post('test')
  async sendTestEmail(@NestResponse() response: Response) {
    const account: AccountDataResponse = this.utilityService.accountInformation;
    return this.utilityService.responseHandler(
      this.emailService.sendTestEmail(account.id),
      response,
    );
  }
}
