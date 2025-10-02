import { Controller, Get, Post, Body, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { AiChatService } from './ai-chat.service';
import { UtilityService } from '@common/utility.service';

@Controller('ai-chat/conversation')
export class AiChatController {
  constructor(
    private readonly aiChatService: AiChatService,
    private readonly utilityService: UtilityService,
  ) {}

  // Get or create the single conversation for the current account
  @Get()
  async getOrCreateConversation(@Res() response: Response) {
    const accountId = this.utilityService.accountInformation.id;
    return this.utilityService.responseHandler(
      this.aiChatService.getOrCreateConversation(accountId),
      response,
    );
  }

  // Get all messages for the current user's conversation, with pagination
  @Get('messages')
  async getMessages(
    @Res() response: Response,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    const accountId = this.utilityService.accountInformation.id;
    return this.utilityService.responseHandler(
      this.aiChatService.getMessagesForAccount(accountId, limit, before),
      response,
    );
  }

  // Add a message to the current user's conversation
  @Post('messages')
  async addMessage(
    @Body('role') role: string,
    @Body('content') content: string,
    @Body('provider') provider: string,
    @Body('model') model: string | undefined,
    @Res() response: Response,
  ) {
    const finalProvider = provider || 'gemini';
    const accountId = this.utilityService.accountInformation.id;
    return this.utilityService.responseHandler(
      this.aiChatService.addMessageForAccount(
        role,
        content,
        accountId,
        finalProvider,
        model,
      ),
      response,
    );
  }

  // Get available AI providers
  @Get('providers')
  async getAvailableProviders(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.aiChatService.getAvailableProviders(),
      response,
    );
  }

  // Get user's available services based on their scopes
  @Get('services')
  async getUserAvailableServices(@Res() response: Response) {
    const services = this.aiChatService.getUserAvailableServices();
    return this.utilityService.responseHandler(
      Promise.resolve(services),
      response,
    );
  }

  // Ask a simple question to a specific provider
  @Post('ask')
  async askProvider(
    @Body('questions') questions: string[],
    @Body('provider') provider: string,
    @Body('model') model: string | undefined,
    @Res() response: Response,
  ) {
    const finalProvider = provider || 'gemini';
    return this.utilityService.responseHandler(
      this.aiChatService.askProvider(questions, finalProvider, model),
      response,
    );
  }
}
