import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { AccountDataResponse } from '../../../../shared/response';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  AIProvider,
  AIMessage,
  AIProviderResponse,
} from '../../interfaces/ai-provider.interface';

// Add a type for message content
export type OpenAIMessageContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface OpenAIUserMessage {
  role: 'user';
  content: OpenAIMessageContent[];
}

@Injectable()
export class OpenAIService implements AIProvider {
  private openai: OpenAI;
  readonly name = 'openai';
  readonly supportedModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly utilityService: UtilityService,
  ) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * Check if the provider is available and configured
   */
  async isAvailable(): Promise<boolean> {
    return !!process.env.OPENAI_API_KEY;
  }

  /**
   * Simple question-answer interface
   * @param questions - Array of questions to ask
   * @param model - Optional model name to use
   */
  async ask(questions: string[], model = 'gpt-4o'): Promise<string> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      questions.map((q) => ({
        role: 'user',
        content: q,
      }));

    const result = await this.openai.chat.completions.create({
      model,
      messages,
    });

    return result.choices[0]?.message?.content || '';
  }

  /**
   * Send a chat message to OpenAI
   * @param messages - Array of messages in the conversation
   * @param accountInformation - Current user account information
   * @param model - Optional model name to use
   */
  async chat(
    messages: AIMessage[],
    accountInformation: AccountDataResponse,
    model = 'gpt-4o',
  ): Promise<AIProviderResponse> {
    // Convert AIMessage format to OpenAI format
    const openAIMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

    // Add system context
    const systemMessage: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
      role: 'system',
      content: `You are Ante AI, a helpful assistant for task and project management. You are assisting ${accountInformation.fullName || accountInformation.email} (role: ${accountInformation.role?.name || 'Unknown'}).`,
    };

    const result = await this.openai.chat.completions.create({
      model,
      messages: [systemMessage, ...openAIMessages],
    });

    return {
      content: result.choices[0]?.message?.content || '',
      provider: this.name,
      model,
    };
  }

  /**
   * Ask OpenAI a question and return the answer.
   * @param messages - an array of OpenAIUserMessage objects
   * @returns the answer from OpenAI
   */
  async askOpenAI(
    messages: OpenAIUserMessage[],
    modelName = 'gpt-4o',
  ): Promise<string> {
    const result = await this.openai.chat.completions.create({
      model: modelName,
      messages,
    });
    return result.choices[0]?.message?.content || '';
  }
}
