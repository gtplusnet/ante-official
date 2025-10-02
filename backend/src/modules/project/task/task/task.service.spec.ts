// Add mock for references - must be before imports
jest.mock(
  '../../../../reference/task-priority.reference',
  () => ({
    default: [
      { key: 'LOW', label: 'Low', color: 'blue', textColor: 'white' },
      { key: 'MEDIUM', label: 'Medium', color: 'yellow', textColor: 'black' },
      { key: 'HIGH', label: 'High', color: 'red', textColor: 'white' },
    ],
  }),
  { virtual: true },
);

jest.mock(
  '../../../../reference/task-difficulty.reference',
  () => ({
    default: [
      { key: '0', label: '0 - Very Easy', color: 'green', textColor: 'white' },
      { key: '1', label: '1 - Easy', color: 'lightgreen', textColor: 'black' },
    ],
  }),
  { virtual: true },
);

jest.mock(
  '../../../../reference/board-lane.reference',
  () => ({
    default: [
      { key: 'BACKLOG', label: 'Backlog' },
      { key: 'TODO', label: 'To Do' },
      { key: 'IN_PROGRESS', label: 'In Progress' },
      { key: 'DONE', label: 'Done' },
    ],
  }),
  { virtual: true },
);

jest.mock(
  '../../../../reference/notification-type.reference',
  () => ({
    default: [],
  }),
  { virtual: true },
);

import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { SocketService } from '@modules/communication/socket/socket/socket.service';
import { ProjectService } from '@modules/project/project/project/project.service';
import { BoardLaneService } from '@modules/project/board/board-lane/board-lane.service';
import { NotificationService } from '@modules/communication/notification/notification/notification.service';
import { UserOrgService } from '@modules/user/user-org/user-org.service';
import { DiscussionService } from '@modules/communication/discussion/discussion/discussion.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('TaskService - Approval Task Response', () => {
  let service: TaskService;
  let _prismaService: PrismaService;
  let _utilityService: UtilityService;

  const mockTask = {
    id: 1,
    title: 'Test Approval Task',
    description: 'Test Description',
    taskType: 'APPROVAL',
    ApprovalMetadata: {
      id: 1,
      taskId: 1,
      sourceModule: 'HR_FILING',
      sourceId: '123',
      actions: ['approve', 'reject'],
      approvalLevel: 1,
      maxApprovalLevel: 2,
      sourceData: {
        filingType: { label: 'Leave Request' },
        date: '2024-01-01',
      },
    },
    assignedTo: null,
    createdBy: { id: 'user1' },
    boardLane: {
      id: 1,
      key: 'BACKLOG',
      name: 'Backlog',
      description: 'Tasks in backlog',
      order: 1,
    },
    project: null,
    dueDate: null,
    isRead: false,
    priorityLevel: 'MEDIUM',
    roleGroup: null,
    assignedByDifficultySet: '0',
    assignedToDifficultySet: '0',
    isOpen: true,
    isPastDue: false,
    permissions: {},
    // Other required fields...
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: PrismaService,
          useValue: {
            task: {
              findUnique: jest.fn().mockResolvedValue(mockTask),
            },
          },
        },
        {
          provide: UtilityService,
          useValue: {
            formatData: jest.fn((data, type) => {
              // Mock the formatData to include taskType and approvalMetadata
              if (type === 'task') {
                return {
                  ...data,
                  taskType: data.taskType,
                  approvalMetadata: data.ApprovalMetadata,
                };
              }
              return data;
            }),
            formatDate: jest.fn((date) => ({
              raw: date,
              formatted: date?.toString() || null,
            })),
            accountInformation: { id: 'user1', role: { level: 1 } },
          },
        },
        {
          provide: SocketService,
          useValue: {},
        },
        {
          provide: ProjectService,
          useValue: {},
        },
        {
          provide: BoardLaneService,
          useValue: {},
        },
        {
          provide: NotificationService,
          useValue: {},
        },
        {
          provide: UserOrgService,
          useValue: {},
        },
        {
          provide: DiscussionService,
          useValue: {
            createDiscussion: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    _prismaService = module.get<PrismaService>(PrismaService);
    _utilityService = module.get<UtilityService>(UtilityService);
  });

  it('should return task with taskType and approvalMetadata', async () => {
    const result: any = await service.getTaskInformation(1);

    console.log('Task service response:', JSON.stringify(result, null, 2));

    expect(result).toHaveProperty('taskType');
    expect(result.taskType).toBe('APPROVAL');
    expect(result).toHaveProperty('approvalMetadata');
    expect(result.approvalMetadata).toHaveProperty('sourceModule', 'HR_FILING');
  });

  it('should format approval metadata correctly', async () => {
    const result: any = await service.getTaskInformation(1);

    expect(result.approvalMetadata).toEqual({
      id: 1,
      taskId: 1,
      sourceModule: 'HR_FILING',
      sourceId: '123',
      actions: ['approve', 'reject'],
      approvalLevel: 1,
      maxApprovalLevel: 2,
      sourceData: {
        filingType: { label: 'Leave Request' },
        date: '2024-01-01',
      },
    });
  });
});
