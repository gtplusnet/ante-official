import { AccountDataResponse } from '../../../shared/response';

export interface AIMessage {
  role: string;
  content: string;
  parts?: { text: string }[];
}

export interface AIProviderResponse {
  content: string;
  provider: string;
  model?: string;
}

export interface AIProvider {
  readonly name: string;
  readonly supportedModels: string[];

  /**
   * Send a chat message to the AI provider
   * @param messages - Array of messages in the conversation
   * @param accountInformation - Current user account information
   * @param model - Optional model name to use
   * @returns Promise with AI response
   */
  chat(
    messages: AIMessage[],
    accountInformation: AccountDataResponse,
    model?: string,
  ): Promise<AIProviderResponse>;

  /**
   * Simple question-answer interface
   * @param questions - Array of questions to ask
   * @param model - Optional model name to use
   * @returns Promise with AI response
   */
  ask(questions: string[], model?: string): Promise<string>;

  /**
   * Check if the provider is available and configured
   * @returns Promise indicating if provider is ready
   */
  isAvailable(): Promise<boolean>;
}
