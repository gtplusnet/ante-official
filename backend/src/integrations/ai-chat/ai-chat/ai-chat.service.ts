import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UtilityService } from '@common/utility.service';
import { AIProvider, AIMessage } from '../interfaces/ai-provider.interface';
import { AIServiceResolverService } from '../services/ai-service-resolver.service';
import { GeminiService } from '../providers/gemini/gemini.service';
import { OpenAIService } from '../providers/openai/openai.service';

@Injectable()
export class AiChatService {
  private prisma = new PrismaClient();
  private providers: Map<string, AIProvider> = new Map();

  constructor(
    private readonly geminiService: GeminiService,
    private readonly openaiService: OpenAIService,
    private readonly aiServiceResolver: AIServiceResolverService,
    private readonly utilityService: UtilityService,
  ) {
    // Register AI providers
    this.providers.set('gemini', this.geminiService);
    this.providers.set('openai', this.openaiService);
  }

  /**
   * Get or create the single conversation for an account
   */
  async getOrCreateConversation(accountId: string) {
    let conversation = await this.prisma.conversation.findFirst({
      where: { accountId },
    });
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { accountId },
      });
    }
    return conversation;
  }

  /**
   * List all conversations for an account (for compatibility, just return the single one)
   */
  async listConversations(accountId: string) {
    const conversation = await this.getOrCreateConversation(accountId);
    return [conversation];
  }

  /**
   * Get all messages for a conversation, only if owned by account
   */
  async getMessages(conversationId: number, accountId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.accountId !== accountId)
      throw new ForbiddenException('Access denied');
    return this.prisma.conversationMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Add a message to a conversation, only if owned by account
   */
  async addMessage(
    conversationId: number,
    role: string,
    content: string,
    accountId: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.accountId !== accountId)
      throw new ForbiddenException('Access denied');
    return this.prisma.conversationMessage.create({
      data: { conversationId, role, content },
    });
  }

  /**
   * Get paginated messages for the current user's conversation
   */
  async getMessagesForAccount(
    accountId: string,
    limit?: number,
    before?: string,
  ) {
    const conversation = await this.getOrCreateConversation(accountId);
    const take = limit ? Number(limit) : 30;
    const where: any = { conversationId: conversation.id };
    if (before) {
      where.createdAt = { lt: new Date(before) };
    }
    const messages = await this.prisma.conversationMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    });
    // Return in ascending order for chat display
    return messages.reverse();
  }

  /**
   * Add a message to the current user's conversation with provider selection
   */
  async addMessageForAccount(
    role: string,
    content: string,
    accountId: string,
    provider = 'gemini',
    model?: string,
    accountInfo?: any, // Optional account info to avoid CLS dependency
  ) {
    const conversation = await this.getOrCreateConversation(accountId);

    // 1. Store the user's message
    const userMessage = await this.prisma.conversationMessage.create({
      data: { conversationId: conversation.id, role, content },
    });

    // 2. Get the AI provider
    const aiProvider = this.providers.get(provider.toLowerCase());
    if (!aiProvider) {
      throw new BadRequestException(`AI provider '${provider}' not found`);
    }

    // 3. Check if provider is available
    const isAvailable = await aiProvider.isAvailable();
    if (!isAvailable) {
      throw new BadRequestException(
        `AI provider '${provider}' is not available`,
      );
    }

    // 4. Get the full conversation history
    const messages = await this.prisma.conversationMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // 5. Format messages for AI provider
    const aiMessages: AIMessage[] = messages.reverse().map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 6. Get user's available services for context
    // Use provided accountInfo or fall back to CLS (for HTTP requests)
    const accountData = accountInfo || this.utilityService.accountInformation;
    const userScopes = accountData?.role?.scopeList || [];
    const serviceContext =
      this.aiServiceResolver.generateServiceContext(userScopes);

    // 7. Add service context to the conversation
    if (
      serviceContext &&
      serviceContext !==
        'No additional services are available based on your current permissions.'
    ) {
      aiMessages.unshift({
        role: 'system',
        content: serviceContext,
      });
    }

    try {
      // 8. Call the AI provider
      const aiResponse = await aiProvider.chat(
        aiMessages,
        accountData,
        model,
      );

      // 9. Store the AI's response with provider info
      const aiMessage = await this.prisma.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: aiResponse.content,
        },
      });

      // 10. Return both messages
      return { userMessage, aiMessage };
    } catch (error) {
      // If AI call fails, store an error message
      const errorMessage = await this.prisma.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: `Sorry, I encountered an error while processing your request with ${provider}. Please try again or use a different AI provider.`,
        },
      });

      return { userMessage, aiMessage: errorMessage };
    }
  }

  /**
   * Get available AI providers
   */
  async getAvailableProviders(): Promise<
    { name: string; models: string[]; available: boolean }[]
  > {
    const providerInfo = [];

    for (const [name, provider] of this.providers) {
      const available = await provider.isAvailable();
      providerInfo.push({
        name,
        models: provider.supportedModels,
        available,
      });
    }

    return providerInfo;
  }

  /**
   * Get AI provider by name
   */
  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  /**
   * Ask a simple question to a specific provider
   */
  async askProvider(
    questions: string[],
    provider = 'gemini',
    model?: string,
  ): Promise<string> {
    const aiProvider = this.providers.get(provider.toLowerCase());
    if (!aiProvider) {
      throw new BadRequestException(`AI provider '${provider}' not found`);
    }

    const isAvailable = await aiProvider.isAvailable();
    if (!isAvailable) {
      throw new BadRequestException(
        `AI provider '${provider}' is not available`,
      );
    }

    return aiProvider.ask(questions, model);
  }

  /**
   * Get user's available services based on their scopes
   */
  getUserAvailableServices() {
    const userScopes =
      this.utilityService.accountInformation?.role?.scopeList || [];
    return this.aiServiceResolver.getAvailableServices(userScopes);
  }
}
