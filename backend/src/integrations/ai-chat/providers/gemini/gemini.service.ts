import { BadRequestException, Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AccountDataResponse } from '../../../../shared/response';
import { PrismaService } from '@common/prisma.service';
import { GeminiTaskService } from './services/gemini-task.service';
import { GeminiProjectService } from './services/gemini-project.service';
import { UtilityService } from '@common/utility.service';
import {
  AIProvider,
  AIMessage,
  AIProviderResponse,
} from '../../interfaces/ai-provider.interface';

@Injectable()
export class GeminiService implements AIProvider {
  private gemini: GoogleGenerativeAI;
  readonly name = 'gemini';
  readonly supportedModels = [
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiTaskService: GeminiTaskService,
    private readonly geminiProjectService: GeminiProjectService,
    private readonly utilityService: UtilityService,
  ) {
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  /**
   * Check if the provider is available and configured
   */
  async isAvailable(): Promise<boolean> {
    return !!process.env.GEMINI_API_KEY;
  }

  /**
   * Simple question-answer interface
   * @param questions - Array of questions to ask
   * @param model - Optional model name to use
   */
  async ask(questions: string[], model = 'gemini-2.0-flash'): Promise<string> {
    return this.askGemini(questions, model);
  }

  /**
   * Send a chat message to Gemini
   * @param messages - Array of messages in the conversation
   * @param accountInformation - Current user account information
   * @param model - Optional model name to use
   */
  async chat(
    messages: AIMessage[],
    accountInformation: AccountDataResponse,
    model = 'gemini-2.0-flash',
  ): Promise<AIProviderResponse> {
    // Convert AIMessage format to Gemini format
    const geminiMessages = messages.map((msg) => ({
      role: msg.role,
      parts: msg.parts || [{ text: msg.content }],
    }));

    const response = await this.chatWithGemini(
      geminiMessages,
      accountInformation,
    );

    return {
      content: response,
      provider: this.name,
      model,
    };
  }

  /**
   * Ask Gemini a question and return the answer.
   * @param questions - an array of questions to ask Gemini
   * @returns the answer from Gemini
   */
  async askGemini(
    questions: string[],
    modelName = 'gemini-2.0-flash',
  ): Promise<string> {
    const prompt = questions.map((q) => ({
      role: 'user',
      parts: [{ text: q }],
    }));
    const model = this.gemini.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({ contents: prompt });
    return result.response.text();
  }

  /**
   * Enhanced chatWithGemini that lets Gemini decide if it should use TaskService to fetch today's tasks.
   * @param messages - chat messages
   * @param user - the logged-in user object (must have id)
   */
  async chatWithGemini(
    messages: { role: string; parts: { text: string }[] }[],
    accountInformation: AccountDataResponse,
  ) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new BadRequestException(
        'Request body must have a non-empty "messages" array.',
      );
    }

    const lastMessage = messages[messages.length - 1]?.parts[0]?.text || '';
    const identityPrompt =
      'You are Ante AI, a helpful assistant for task and project management. Always answer as an expert assistant for Ante users.';
    const userName =
      accountInformation.fullName ||
      (
        (accountInformation.firstName || '') +
        ' ' +
        (accountInformation.lastName || '')
      ).trim() ||
      accountInformation.email;
    const userIdentityPrompt = `You are talking to: ${userName} (role: ${accountInformation.role?.name || 'Unknown'}). Always consider the user\'s role and identity in your answers.`;
    const additionalInstructions = this.createAdditionalInstructions();

    const contextPrompts: { role: string; parts: { text: string }[] }[] = [];
    let decision = '';
    let iteration = 0;
    const maxIterations = 10;

    // Define available tools
    const availableTools = [
      {
        key: 'use_task_summary',
        name: 'TaskSummary',
        explanation: "Get a summary of the user's active tasks.",
        fn: this.geminiTaskService.getCurrentTasks.bind(this.geminiTaskService),
        usedKey: 'task_summary',
      },
      {
        key: 'use_project_list',
        name: 'ProjectList',
        explanation: "Get a list of the user's projects.",
        fn: this.geminiProjectService.getProjectContextPrompts.bind(
          this.geminiProjectService,
        ),
        usedKey: 'project_list',
      },
      {
        key: 'use_task_detail',
        name: 'TaskDetail',
        explanation:
          'Get full information about a specific task by title or id. Reply with "use_task_detail:Task Title" or "use_task_detail:TaskId" to use this tool.',
        fn: async (accountInformation, arg) =>
          this.geminiTaskService.getTaskDetailPrompt(accountInformation, arg),
        usedKey: 'task_detail',
      },
    ];

    // Dynamically build the serviceListPrompt:
    const serviceListPrompt =
      `You have access to the following tools:\n` +
      availableTools
        .map(
          (t) =>
            `- ${t.name}: ${t.explanation}\n  (Reply ONLY with \"${t.key}\" to use this tool)`,
        )
        .join('\n') +
      `\nIf you are ready to answer, reply ONLY with \"no_tool\".`;

    do {
      // Build the prompt for tool decision
      const toolDecisionPrompt = [
        { role: 'user', parts: [{ text: identityPrompt }] },
        { role: 'user', parts: [{ text: userIdentityPrompt }] },
        ...contextPrompts,
        { role: 'user', parts: [{ text: serviceListPrompt }] },
        { role: 'user', parts: [{ text: lastMessage }] },
      ];
      const decisionRaw = await this.geminiTaskService.callGeminiWithPrompt(
        this.gemini,
        toolDecisionPrompt,
      );
      // Normalize decision: remove code block formatting, trim whitespace, lowercase
      decision = decisionRaw
        .replace(/```[\s\S]*?```/g, '')
        .replace(/[`\n]/g, '')
        .trim()
        .toLowerCase();
      this.utilityService.log(
        `Loop #${iteration}: Ai has decided to use: ${decision}.`,
      );

      // Check if decision matches any available tool (with optional argument for detail)
      let tool, arg;
      if (decision.includes(':')) {
        const [toolKey, ...rest] = decision.split(':');
        tool = availableTools.find((t) => toolKey === t.key);
        arg = rest.join(':').trim();
      } else {
        tool = availableTools.find((t) => decision === t.key);
      }
      if (tool) {
        if (tool.key === 'use_task_detail' && arg) {
          contextPrompts.push(...(await tool.fn(accountInformation, arg)));
        } else {
          contextPrompts.push(...(await tool.fn(accountInformation)));
        }
      } else {
        // If not a tool, treat as final answer and break
        break;
      }
      iteration++;
    } while (iteration < maxIterations);

    // Final answer prompt
    const finalPrompt = [
      { role: 'user', parts: [{ text: identityPrompt }] },
      { role: 'user', parts: [{ text: userIdentityPrompt }] },
      ...contextPrompts,
      { role: 'user', parts: [{ text: lastMessage }] },
      { role: 'user', parts: [{ text: additionalInstructions }] },
    ];
    return this.geminiTaskService.callGeminiWithPrompt(
      this.gemini,
      finalPrompt,
    );
  }
  createAdditionalInstructions() {
    return `
    - When sending list of data to the users, if it's possible then show the ID as identifier so user can easily identify the data.
    - Don't answer the user in a technical way, always answer in a way that is easy to understand. Remember that the users are not developers.
    `;
  }
}
