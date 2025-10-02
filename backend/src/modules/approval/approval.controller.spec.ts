import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';

describe('ApprovalController', () => {
  let controller: ApprovalController;
  let mockApprovalService: jest.Mocked<ApprovalService>;

  beforeEach(async () => {
    mockApprovalService = {
      getApprovalDetails: jest.fn(),
      processApproval: jest.fn(),
      getApprovalHistory: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApprovalController],
      providers: [{ provide: ApprovalService, useValue: mockApprovalService }],
    }).compile();

    controller = module.get<ApprovalController>(ApprovalController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getApprovalDetails', () => {
    it('should get approval details for a task', async () => {
      const mockDetails = {
        taskId: 1,
        status: 'pending',
        approver: 'John Doe',
      };
      mockApprovalService.getApprovalDetails.mockResolvedValue(mockDetails);

      const result = await controller.getApprovalDetails('1');

      expect(result).toBe(mockDetails);
      expect(mockApprovalService.getApprovalDetails).toHaveBeenCalledWith(1);
      expect(mockApprovalService.getApprovalDetails).toHaveBeenCalledTimes(1);
    });

    it('should convert string id to number', async () => {
      const mockDetails = { taskId: 123 };
      mockApprovalService.getApprovalDetails.mockResolvedValue(mockDetails);

      await controller.getApprovalDetails('123');

      expect(mockApprovalService.getApprovalDetails).toHaveBeenCalledWith(123);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockApprovalService.getApprovalDetails.mockRejectedValue(error);

      await expect(controller.getApprovalDetails('1')).rejects.toThrow(error);
    });
  });

  describe('processApproval', () => {
    it('should process approval with action only', async () => {
      mockApprovalService.processApproval.mockResolvedValue();

      const result = await controller.processApproval('1', {
        action: 'approve',
      });

      expect(result).toEqual({ success: true });
      expect(mockApprovalService.processApproval).toHaveBeenCalledWith({
        taskId: 1,
        action: 'approve',
        remarks: undefined,
      });
    });

    it('should process approval with action and remarks', async () => {
      mockApprovalService.processApproval.mockResolvedValue();

      const result = await controller.processApproval('1', {
        action: 'reject',
        remarks: 'Needs more information',
      });

      expect(result).toEqual({ success: true });
      expect(mockApprovalService.processApproval).toHaveBeenCalledWith({
        taskId: 1,
        action: 'reject',
        remarks: 'Needs more information',
      });
    });

    it('should convert string id to number', async () => {
      mockApprovalService.processApproval.mockResolvedValue();

      await controller.processApproval('456', { action: 'approve' });

      expect(mockApprovalService.processApproval).toHaveBeenCalledWith({
        taskId: 456,
        action: 'approve',
        remarks: undefined,
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Processing failed');
      mockApprovalService.processApproval.mockRejectedValue(error);

      await expect(
        controller.processApproval('1', { action: 'approve' }),
      ).rejects.toThrow(error);
    });

    it('should handle empty remarks', async () => {
      mockApprovalService.processApproval.mockResolvedValue();

      await controller.processApproval('1', { action: 'approve', remarks: '' });

      expect(mockApprovalService.processApproval).toHaveBeenCalledWith({
        taskId: 1,
        action: 'approve',
        remarks: '',
      });
    });
  });

  describe('getApprovalHistory', () => {
    it('should get approval history for a module and source', async () => {
      const mockHistory = [
        { id: 1, action: 'approve', date: '2023-01-01' },
        { id: 2, action: 'reject', date: '2023-01-02' },
      ];
      mockApprovalService.getApprovalHistory.mockResolvedValue(mockHistory);

      const result = await controller.getApprovalHistory('project', '123');

      expect(result).toBe(mockHistory);
      expect(mockApprovalService.getApprovalHistory).toHaveBeenCalledWith(
        'project',
        '123',
      );
      expect(mockApprovalService.getApprovalHistory).toHaveBeenCalledTimes(1);
    });

    it('should handle different module types', async () => {
      const mockHistory = [];
      mockApprovalService.getApprovalHistory.mockResolvedValue(mockHistory);

      await controller.getApprovalHistory('manpower', 'emp-456');

      expect(mockApprovalService.getApprovalHistory).toHaveBeenCalledWith(
        'manpower',
        'emp-456',
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('History retrieval failed');
      mockApprovalService.getApprovalHistory.mockRejectedValue(error);

      await expect(
        controller.getApprovalHistory('project', '123'),
      ).rejects.toThrow(error);
    });

    it('should handle numeric source IDs as strings', async () => {
      const mockHistory = [];
      mockApprovalService.getApprovalHistory.mockResolvedValue(mockHistory);

      await controller.getApprovalHistory('task', '999');

      expect(mockApprovalService.getApprovalHistory).toHaveBeenCalledWith(
        'task',
        '999',
      );
    });

    it('should handle UUID source IDs', async () => {
      const mockHistory = [];
      mockApprovalService.getApprovalHistory.mockResolvedValue(mockHistory);
      const uuid = '550e8400-e29b-41d4-a716-446655440000';

      await controller.getApprovalHistory('document', uuid);

      expect(mockApprovalService.getApprovalHistory).toHaveBeenCalledWith(
        'document',
        uuid,
      );
    });
  });

  describe('integration', () => {
    it('should work with all methods', async () => {
      mockApprovalService.getApprovalDetails.mockResolvedValue({ id: 1 });
      mockApprovalService.processApproval.mockResolvedValue();
      mockApprovalService.getApprovalHistory.mockResolvedValue([]);

      await controller.getApprovalDetails('1');
      await controller.processApproval('1', { action: 'approve' });
      await controller.getApprovalHistory('module', '1');

      expect(mockApprovalService.getApprovalDetails).toHaveBeenCalled();
      expect(mockApprovalService.processApproval).toHaveBeenCalled();
      expect(mockApprovalService.getApprovalHistory).toHaveBeenCalled();
    });
  });
});
