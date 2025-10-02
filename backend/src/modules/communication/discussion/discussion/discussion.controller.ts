import {
  Controller,
  Inject,
  Post,
  Body,
  Put,
  Delete,
  Param,
  Get,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { DiscussionService } from './discussion.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateDiscussionMessageDto,
  EditDiscussionMessageDto,
  DiscussionTableDto,
  DiscussionGetInfoDto,
  SyncDiscussionWatchersDto,
} from './discussion.interface';
import { AccountService } from '@modules/account/account/account.service';

@Controller('discussion')
export class DiscussionController {
  @Inject() public utility: UtilityService;
  @Inject() public discussionService: DiscussionService;
  @Inject() private accountService: AccountService;

  /**
   * Search for company users to mention in discussions
   */
  @Get('mentions')
  searchMentions(@Query('search') search: string, @Res() res: Response) {
    // Create minimal table query params for search
    const query = { page: 1, perPage: 20 };
    const body = { filters: [], settings: {} };
    const result = this.accountService.searchAccount(query, body, search);
    this.utility.responseHandler(result, res);
  }

  /**
   * Table API for discussions
   */
  @Put('table')
  table(@Body() dto: DiscussionTableDto, @Res() res: Response) {
    const result = this.discussionService.table(dto, {
      filters: dto.filters ?? [],
      settings: dto.settings ?? {},
    });
    this.utility.responseHandler(result, res);
  }

  /**
   * Get paginated messages for a discussion (for chat/infinite scroll)
   */
  @Get('messages')
  getMessages(
    @Query('discussionId') discussionId: string,
    @Query('limit') limit: string,
    @Query('beforeId') beforeId: string,
    @Res() res: Response,
  ) {
    if (!discussionId) {
      return this.utility.responseHandler(Promise.resolve([]), res);
    }

    const accountId = this.utility.accountInformation.id;
    return this.utility.responseHandler(
      this.discussionService.getMessages(
        discussionId,
        limit ? Number(limit) : 10,
        beforeId ? Number(beforeId) : undefined,
        accountId,
      ),
      res,
    );
  }

  /**
   * Get info for a single discussion
   */
  @Get(':id')
  getInfo(@Param() params: DiscussionGetInfoDto, @Res() res: Response) {
    const result = this.discussionService.getInfo(params.id);
    this.utility.responseHandler(result, res);
  }

  /**
   * Create a discussion message (and discussion if not exists)
   */
  @Post('message')
  createMessage(@Body() dto: CreateDiscussionMessageDto, @Res() res: Response) {
    const accountId = this.utility.accountInformation.id;
    const result = this.discussionService.createDiscussionMessage(
      dto,
      accountId,
    );
    this.utility.responseHandler(result, res);
  }

  /**
   * Edit a discussion message
   */
  @Put('message/:id')
  editMessage(
    @Param('id') id: string,
    @Body() dto: EditDiscussionMessageDto,
    @Res() res: Response,
  ) {
    const accountId = this.utility.accountInformation.id;
    const messageId = Number(id);
    const result = this.discussionService.editDiscussionMessage(
      { ...dto, messageId },
      accountId,
    );
    this.utility.responseHandler(result, res);
  }

  /**
   * Delete a discussion message
   */
  @Delete('message/:id')
  deleteMessage(@Param('id') id: string, @Res() res: Response) {
    const accountId = this.utility.accountInformation.id;
    const messageId = Number(id);
    const result = this.discussionService.deleteDiscussionMessage(
      messageId,
      accountId,
    );
    this.utility.responseHandler(result, res);
  }

  /**
   * Get unread message count for a specific discussion
   */
  @Get('unread-count/:discussionId')
  getUnreadCount(
    @Param('discussionId') discussionId: string,
    @Res() res: Response,
  ) {
    const accountId = this.utility.accountInformation.id;
    const result = this.discussionService.getUnreadCount(
      discussionId,
      accountId,
    );
    this.utility.responseHandler(result, res);
  }

  /**
   * Get unread counts for multiple discussions (batch)
   */
  @Post('unread-counts')
  getUnreadCounts(
    @Body() dto: { discussionIds: string[] },
    @Res() res: Response,
  ) {
    const accountId = this.utility.accountInformation.id;
    const result = this.discussionService.getUnreadCounts(
      dto.discussionIds || [],
      accountId,
    );

    // Convert Map to object for JSON serialization
    const resultPromise = result.then((map) => {
      const obj: Record<string, number> = {};
      map.forEach((value, key) => {
        obj[key] = value;
      });
      return obj;
    });

    this.utility.responseHandler(resultPromise, res);
  }

  /**
   * Mark messages as read up to a certain point
   */
  @Post('mark-read/:discussionId')
  markMessagesAsRead(
    @Param('discussionId') discussionId: string,
    @Body() dto: { upToMessageId?: number; markAll?: boolean },
    @Res() res: Response,
  ) {
    const accountId = this.utility.accountInformation.id;
    const result = this.discussionService.markMessagesAsRead(
      discussionId,
      accountId,
      dto,
    );
    this.utility.responseHandler(result, res);
  }

  /**
   * Get watchers for a specific discussion
   */
  @Get('watchers/:discussionId')
  getWatchers(
    @Param('discussionId') discussionId: string,
    @Res() res: Response,
  ) {
    const result = this.discussionService.getDiscussionWatchers(discussionId);
    this.utility.responseHandler(result, res);
  }

  /**
   * Sync discussion watchers with task-related account IDs
   */
  @Post('sync-watchers')
  syncWatchers(@Body() dto: SyncDiscussionWatchersDto, @Res() res: Response) {
    const result = this.discussionService.syncDiscussionWatchers(
      dto.discussionId,
      dto.taskRelatedIds,
    );
    this.utility.responseHandler(result, res);
  }
}
