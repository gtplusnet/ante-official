import { Test, TestingModule } from '@nestjs/testing';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { UtilityService } from '@common/utility.service';
import { Response } from 'express';

describe('AiChatController', () => {
  let controller: AiChatController;
  let aiChatService: AiChatService;
  let utilityService: UtilityService;
  let mockResponse: Partial<Response>;

  const mockAiChatService = {
    getOrCreateConversation: jest.fn(),
    getMessagesForAccount: jest.fn(),
    addMessageForAccount: jest.fn(),
    getAvailableProviders: jest.fn(),
    getUserAvailableServices: jest.fn(),
    askProvider: jest.fn(),
  };

  const mockUtilityService = {
    responseHandler: jest.fn(),
    accountInformation: {
      id: 123,
      username: 'testuser',
      email: 'test@example.com',
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiChatController],
      providers: [
        {
          provide: AiChatService,
          useValue: mockAiChatService,
        },
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
      ],
    }).compile();

    controller = module.get<AiChatController>(AiChatController);
    aiChatService = module.get<AiChatService>(AiChatService);
    utilityService = module.get<UtilityService>(UtilityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have ai chat service injected', () => {
    expect(controller['aiChatService']).toBeDefined();
    expect(controller['aiChatService']).toBe(aiChatService);
  });

  it('should have utility service injected', () => {
    expect(controller['utilityService']).toBeDefined();
    expect(controller['utilityService']).toBe(utilityService);
  });

  describe('getOrCreateConversation', () => {
    it('should get or create conversation successfully', async () => {
      const mockConversation = Promise.resolve({
        id: 'conv-123',
        accountId: 123,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      });

      mockAiChatService.getOrCreateConversation.mockReturnValue(
        mockConversation,
      );

      await controller.getOrCreateConversation(mockResponse as Response);

      expect(mockAiChatService.getOrCreateConversation).toHaveBeenCalledWith(
        123,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockConversation,
        mockResponse,
      );
    });

    it('should handle service errors', async () => {
      const mockError = Promise.reject(
        new Error('Failed to create conversation'),
      );
      mockAiChatService.getOrCreateConversation.mockReturnValue(mockError);

      // Add catch to handle the unhandled rejection
      mockError.catch(() => {});

      await controller.getOrCreateConversation(mockResponse as Response);

      expect(mockAiChatService.getOrCreateConversation).toHaveBeenCalledWith(
        123,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });
  });

  describe('getMessages', () => {
    it('should get messages without pagination params', async () => {
      const mockMessages = Promise.resolve({
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            timestamp: '2023-01-01T00:00:00Z',
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Hi there!',
            timestamp: '2023-01-01T00:01:00Z',
          },
        ],
        hasMore: false,
      });

      mockAiChatService.getMessagesForAccount.mockReturnValue(mockMessages);

      await controller.getMessages(mockResponse as Response);

      expect(mockAiChatService.getMessagesForAccount).toHaveBeenCalledWith(
        123,
        undefined,
        undefined,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockMessages,
        mockResponse,
      );
    });

    it('should get messages with limit parameter', async () => {
      const limit = 10;
      const mockMessages = Promise.resolve({
        messages: [],
        hasMore: false,
      });

      mockAiChatService.getMessagesForAccount.mockReturnValue(mockMessages);

      await controller.getMessages(mockResponse as Response, limit);

      expect(mockAiChatService.getMessagesForAccount).toHaveBeenCalledWith(
        123,
        limit,
        undefined,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockMessages,
        mockResponse,
      );
    });

    it('should get messages with limit and before parameters', async () => {
      const limit = 5;
      const before = 'msg-123';
      const mockMessages = Promise.resolve({
        messages: [
          {
            id: 'msg-100',
            role: 'user',
            content: 'Previous message',
            timestamp: '2023-01-01T00:00:00Z',
          },
        ],
        hasMore: true,
      });

      mockAiChatService.getMessagesForAccount.mockReturnValue(mockMessages);

      await controller.getMessages(mockResponse as Response, limit, before);

      expect(mockAiChatService.getMessagesForAccount).toHaveBeenCalledWith(
        123,
        limit,
        before,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockMessages,
        mockResponse,
      );
    });

    it('should get messages with only before parameter', async () => {
      const before = 'msg-456';
      const mockMessages = Promise.resolve({
        messages: [],
        hasMore: false,
      });

      mockAiChatService.getMessagesForAccount.mockReturnValue(mockMessages);

      await controller.getMessages(mockResponse as Response, undefined, before);

      expect(mockAiChatService.getMessagesForAccount).toHaveBeenCalledWith(
        123,
        undefined,
        before,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockMessages,
        mockResponse,
      );
    });

    it('should handle service errors when getting messages', async () => {
      const mockError = Promise.reject(new Error('Failed to get messages'));
      mockAiChatService.getMessagesForAccount.mockReturnValue(mockError);

      // Add catch to handle the unhandled rejection
      mockError.catch(() => {});

      await controller.getMessages(mockResponse as Response, 10, 'msg-123');

      expect(mockAiChatService.getMessagesForAccount).toHaveBeenCalledWith(
        123,
        10,
        'msg-123',
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });
  });

  describe('addMessage', () => {
    it('should add message with specified provider', async () => {
      const role = 'user';
      const content = 'How can I help you?';
      const provider = 'openai';
      const model = 'gpt-4';

      const mockAddedMessage = Promise.resolve({
        id: 'msg-new',
        role,
        content,
        timestamp: '2023-01-01T00:00:00Z',
        provider,
        model,
      });

      mockAiChatService.addMessageForAccount.mockReturnValue(mockAddedMessage);

      await controller.addMessage(
        role,
        content,
        provider,
        model,
        mockResponse as Response,
      );

      expect(mockAiChatService.addMessageForAccount).toHaveBeenCalledWith(
        role,
        content,
        123,
        provider,
        model,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockAddedMessage,
        mockResponse,
      );
    });

    it('should add message with default provider when not specified', async () => {
      const role = 'assistant';
      const content = 'Here is my response';
      const provider = ''; // Empty string should trigger default
      const model = undefined;

      const mockAddedMessage = Promise.resolve({
        id: 'msg-new2',
        role,
        content,
        timestamp: '2023-01-01T00:01:00Z',
        provider: 'gemini',
      });

      mockAiChatService.addMessageForAccount.mockReturnValue(mockAddedMessage);

      await controller.addMessage(
        role,
        content,
        provider,
        model,
        mockResponse as Response,
      );

      expect(mockAiChatService.addMessageForAccount).toHaveBeenCalledWith(
        role,
        content,
        123,
        'gemini', // Should default to gemini
        model,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockAddedMessage,
        mockResponse,
      );
    });

    it('should add message without model specified', async () => {
      const role = 'user';
      const content = 'What is the weather like?';
      const provider = 'gemini';
      const model = undefined;

      const mockAddedMessage = Promise.resolve({
        id: 'msg-new3',
        role,
        content,
        timestamp: '2023-01-01T00:02:00Z',
        provider,
      });

      mockAiChatService.addMessageForAccount.mockReturnValue(mockAddedMessage);

      await controller.addMessage(
        role,
        content,
        provider,
        model,
        mockResponse as Response,
      );

      expect(mockAiChatService.addMessageForAccount).toHaveBeenCalledWith(
        role,
        content,
        123,
        provider,
        model,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockAddedMessage,
        mockResponse,
      );
    });

    it('should handle service errors when adding message', async () => {
      const role = 'user';
      const content = 'Test message';
      const provider = 'gemini';
      const model = 'gemini-pro';

      const mockError = Promise.reject(new Error('Failed to add message'));
      mockAiChatService.addMessageForAccount.mockReturnValue(mockError);

      // Add catch to handle the unhandled rejection
      mockError.catch(() => {});

      await controller.addMessage(
        role,
        content,
        provider,
        model,
        mockResponse as Response,
      );

      expect(mockAiChatService.addMessageForAccount).toHaveBeenCalledWith(
        role,
        content,
        123,
        provider,
        model,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });
  });

  describe('getAvailableProviders', () => {
    it('should get available providers successfully', async () => {
      const mockProviders = Promise.resolve([
        {
          name: 'openai',
          displayName: 'OpenAI',
          models: ['gpt-3.5-turbo', 'gpt-4'],
        },
        {
          name: 'gemini',
          displayName: 'Google Gemini',
          models: ['gemini-pro', 'gemini-pro-vision'],
        },
      ]);

      mockAiChatService.getAvailableProviders.mockReturnValue(mockProviders);

      await controller.getAvailableProviders(mockResponse as Response);

      expect(mockAiChatService.getAvailableProviders).toHaveBeenCalledWith();
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockProviders,
        mockResponse,
      );
    });

    it('should handle service errors when getting providers', async () => {
      const mockError = Promise.reject(new Error('Failed to get providers'));
      mockAiChatService.getAvailableProviders.mockReturnValue(mockError);

      // Add catch to handle the unhandled rejection
      mockError.catch(() => {});

      await controller.getAvailableProviders(mockResponse as Response);

      expect(mockAiChatService.getAvailableProviders).toHaveBeenCalledWith();
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });
  });

  describe('getUserAvailableServices', () => {
    it('should get user available services successfully', async () => {
      const mockServices = [
        { name: 'chat', available: true },
        { name: 'project-analysis', available: true },
        { name: 'task-management', available: false },
      ];

      mockAiChatService.getUserAvailableServices.mockReturnValue(mockServices);

      await controller.getUserAvailableServices(mockResponse as Response);

      expect(mockAiChatService.getUserAvailableServices).toHaveBeenCalledWith();
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        Promise.resolve(mockServices),
        mockResponse,
      );
    });

    it('should handle empty services list', async () => {
      const mockServices = [];
      mockAiChatService.getUserAvailableServices.mockReturnValue(mockServices);

      await controller.getUserAvailableServices(mockResponse as Response);

      expect(mockAiChatService.getUserAvailableServices).toHaveBeenCalledWith();
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        Promise.resolve(mockServices),
        mockResponse,
      );
    });
  });

  describe('askProvider', () => {
    it('should ask provider with questions and specified provider', async () => {
      const questions = ['What is AI?', 'How does machine learning work?'];
      const provider = 'openai';
      const model = 'gpt-4';

      const mockServiceResponse = Promise.resolve({
        provider,
        model,
        responses: [
          'AI is artificial intelligence...',
          'Machine learning is a subset of AI...',
        ],
      });

      mockAiChatService.askProvider.mockReturnValue(mockServiceResponse);

      await controller.askProvider(
        questions,
        provider,
        model,
        mockResponse as Response,
      );

      expect(mockAiChatService.askProvider).toHaveBeenCalledWith(
        questions,
        provider,
        model,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockServiceResponse,
        mockResponse,
      );
    });

    it('should ask provider with default provider when not specified', async () => {
      const questions = ['Tell me a joke'];
      const provider = ''; // Empty should trigger default
      const model = undefined;

      const mockServiceResponse = Promise.resolve({
        provider: 'gemini',
        responses: ['Why did the chicken cross the road?...'],
      });

      mockAiChatService.askProvider.mockReturnValue(mockServiceResponse);

      await controller.askProvider(
        questions,
        provider,
        model,
        mockResponse as Response,
      );

      expect(mockAiChatService.askProvider).toHaveBeenCalledWith(
        questions,
        'gemini', // Should default to gemini
        model,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockServiceResponse,
        mockResponse,
      );
    });

    it('should ask provider with single question', async () => {
      const questions = ['What is the capital of France?'];
      const provider = 'gemini';
      const model = 'gemini-pro';

      const mockServiceResponse = Promise.resolve({
        provider,
        model,
        responses: ['The capital of France is Paris.'],
      });

      mockAiChatService.askProvider.mockReturnValue(mockServiceResponse);

      await controller.askProvider(
        questions,
        provider,
        model,
        mockResponse as Response,
      );

      expect(mockAiChatService.askProvider).toHaveBeenCalledWith(
        questions,
        provider,
        model,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockServiceResponse,
        mockResponse,
      );
    });

    it('should handle empty questions array', async () => {
      const questions = [];
      const provider = 'gemini';
      const model = undefined;

      const mockServiceResponse = Promise.resolve({
        provider,
        responses: [],
      });

      mockAiChatService.askProvider.mockReturnValue(mockServiceResponse);

      await controller.askProvider(
        questions,
        provider,
        model,
        mockResponse as Response,
      );

      expect(mockAiChatService.askProvider).toHaveBeenCalledWith(
        questions,
        provider,
        model,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockServiceResponse,
        mockResponse,
      );
    });

    it('should handle service errors when asking provider', async () => {
      const questions = ['Test question'];
      const provider = 'openai';
      const model = 'gpt-3.5-turbo';

      const mockError = Promise.reject(new Error('Provider unavailable'));
      mockAiChatService.askProvider.mockReturnValue(mockError);

      // Add catch to handle the unhandled rejection
      mockError.catch(() => {});

      await controller.askProvider(
        questions,
        provider,
        model,
        mockResponse as Response,
      );

      expect(mockAiChatService.askProvider).toHaveBeenCalledWith(
        questions,
        provider,
        model,
      );
      expect(mockUtilityService.responseHandler).toHaveBeenCalledWith(
        mockError,
        mockResponse,
      );
    });
  });

  describe('account id handling', () => {
    it('should use account id from utility service in all methods', async () => {
      // Test with different account id
      mockUtilityService.accountInformation.id = 999;

      // Re-create controller with new account id
      const module: TestingModule = await Test.createTestingModule({
        controllers: [AiChatController],
        providers: [
          {
            provide: AiChatService,
            useValue: mockAiChatService,
          },
          {
            provide: UtilityService,
            useValue: mockUtilityService,
          },
        ],
      }).compile();

      const newController = module.get<AiChatController>(AiChatController);

      mockAiChatService.getOrCreateConversation.mockReturnValue(
        Promise.resolve({}),
      );
      mockAiChatService.getMessagesForAccount.mockReturnValue(
        Promise.resolve({}),
      );
      mockAiChatService.addMessageForAccount.mockReturnValue(
        Promise.resolve({}),
      );

      await newController.getOrCreateConversation(mockResponse as Response);
      await newController.getMessages(mockResponse as Response);
      await newController.addMessage(
        'user',
        'test',
        'gemini',
        undefined,
        mockResponse as Response,
      );

      expect(mockAiChatService.getOrCreateConversation).toHaveBeenCalledWith(
        999,
      );
      expect(mockAiChatService.getMessagesForAccount).toHaveBeenCalledWith(
        999,
        undefined,
        undefined,
      );
      expect(mockAiChatService.addMessageForAccount).toHaveBeenCalledWith(
        'user',
        'test',
        999,
        'gemini',
        undefined,
      );
    });
  });
});
