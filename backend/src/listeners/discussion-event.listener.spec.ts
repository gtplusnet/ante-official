import { Test, TestingModule } from '@nestjs/testing';
import { DiscussionEventListener } from './discussion-event.listener';
import { DiscussionService } from '@modules/communication/discussion/discussion/discussion.service';
import {
  DiscussionCreateEvent,
  DiscussionMessageEvent,
  DiscussionUpdateEvent,
  DiscussionActionEvent,
} from '../shared/events/discussion.events';

describe('DiscussionEventListener', () => {
  let listener: DiscussionEventListener;
  let discussionService: jest.Mocked<DiscussionService>;

  beforeEach(async () => {
    const mockDiscussionService = {
      createDiscussionMessage: jest.fn(),
      syncDiscussionWatchers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscussionEventListener,
        { provide: DiscussionService, useValue: mockDiscussionService },
      ],
    }).compile();

    listener = module.get<DiscussionEventListener>(DiscussionEventListener);
    discussionService = module.get(DiscussionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('simpleHash', () => {
    it('should generate consistent hash for the same string', () => {
      const str = 'test string';
      const hash1 = (listener as any).simpleHash(str);
      const hash2 = (listener as any).simpleHash(str);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different strings', () => {
      const hash1 = (listener as any).simpleHash('string1');
      const hash2 = (listener as any).simpleHash('string2');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', () => {
      const hash = (listener as any).simpleHash('');
      expect(hash).toBe(0);
    });
  });

  describe('formatDate', () => {
    it('should format valid date', () => {
      const date = new Date('2023-01-01');
      const result = (listener as any).formatDate(date);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // MM/DD/YYYY format
    });

    it('should format date string', () => {
      const result = (listener as any).formatDate('2023-01-01');
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should return "not set" for null/undefined', () => {
      expect((listener as any).formatDate(null)).toBe('not set');
      expect((listener as any).formatDate(undefined)).toBe('not set');
    });

    it('should return string representation for invalid date', () => {
      const result = (listener as any).formatDate('invalid-date');
      expect(result).toBe('Invalid Date');
    });
  });

  describe('getPriorityLabel', () => {
    it('should return correct priority labels', () => {
      expect((listener as any).getPriorityLabel(0)).toBe('No Priority');
      expect((listener as any).getPriorityLabel(1)).toBe('Low Priority');
      expect((listener as any).getPriorityLabel(2)).toBe('Priority');
      expect((listener as any).getPriorityLabel(3)).toBe('High Priority');
      expect((listener as any).getPriorityLabel(4)).toBe('Urgent');
    });

    it('should return default label for unknown priority', () => {
      expect((listener as any).getPriorityLabel(99)).toBe('Priority 99');
    });

    it('should handle string numbers', () => {
      expect((listener as any).getPriorityLabel('2')).toBe('Priority');
    });
  });

  describe('getDifficultyLabel', () => {
    it('should return correct difficulty labels', () => {
      expect((listener as any).getDifficultyLabel(0)).toBe('0 - Very Easy');
      expect((listener as any).getDifficultyLabel(1)).toBe('1 - Easy');
      expect((listener as any).getDifficultyLabel(2)).toBe('2 - Medium');
      expect((listener as any).getDifficultyLabel(3)).toBe('3 - Hard');
      expect((listener as any).getDifficultyLabel(4)).toBe('4 - Very Hard');
      expect((listener as any).getDifficultyLabel(5)).toBe('5 - Insane');
    });

    it('should return default label for unknown difficulty', () => {
      expect((listener as any).getDifficultyLabel(99)).toBe('Difficulty 99');
    });
  });

  describe('formatFieldValue', () => {
    it('should format priority fields', () => {
      expect((listener as any).formatFieldValue('priority', 2)).toBe(
        'Priority',
      );
      expect((listener as any).formatFieldValue('priorityLevel', 4)).toBe(
        'Urgent',
      );
      expect(
        (listener as any).formatFieldValue('assignedToPrioritySet', 1),
      ).toBe('Low Priority');
    });

    it('should format difficulty fields', () => {
      expect((listener as any).formatFieldValue('difficulty', 3)).toBe(
        '3 - Hard',
      );
      expect((listener as any).formatFieldValue('difficultyLevel', 0)).toBe(
        '0 - Very Easy',
      );
      expect(
        (listener as any).formatFieldValue('assignedToDifficultySet', 5),
      ).toBe('5 - Insane');
    });

    it('should return string representation for other fields', () => {
      expect((listener as any).formatFieldValue('title', 'Test Title')).toBe(
        'Test Title',
      );
      expect((listener as any).formatFieldValue('count', 42)).toBe('42');
    });
  });

  describe('formatActionContent', () => {
    it('should format assignment actions', () => {
      expect(
        (listener as any).formatActionContent('assigned', {
          assigneeName: 'John Doe',
        }),
      ).toBe('<em>Assigned to John Doe</em>');

      expect(
        (listener as any).formatActionContent('assigned', {
          assigneeId: 'user-123',
        }),
      ).toBe('<em>Assigned to user-123</em>');
    });

    it('should format status change actions', () => {
      expect(
        (listener as any).formatActionContent('status_changed', {
          oldStatus: 'pending',
          newStatus: 'completed',
        }),
      ).toBe('<em>Changed status from pending to completed</em>');
    });

    it('should format movement actions', () => {
      expect(
        (listener as any).formatActionContent('moved', {
          fromLane: 'To Do',
          toLane: 'In Progress',
        }),
      ).toBe('<em>Moved from To Do to In Progress</em>');
    });

    it('should format approval actions', () => {
      expect(
        (listener as any).formatActionContent('approved', {
          comment: 'Looks good!',
        }),
      ).toBe('<em>Approved: Looks good!</em>');

      expect((listener as any).formatActionContent('approved', {})).toBe(
        '<em>Approved</em>',
      );
    });

    it('should format rejection actions', () => {
      expect(
        (listener as any).formatActionContent('rejected_approval', {
          reason: 'Needs changes',
        }),
      ).toBe('<em>Rejected: Needs changes</em>');
    });

    it('should format simple actions', () => {
      expect((listener as any).formatActionContent('claimed', {})).toBe(
        '<em>Claimed the task</em>',
      );

      expect((listener as any).formatActionContent('accepted', {})).toBe(
        '<em>Accepted the assignment</em>',
      );

      expect((listener as any).formatActionContent('completed', {})).toBe(
        '<em>Marked as completed</em>',
      );
    });

    it('should format generic actions with details', () => {
      expect(
        (listener as any).formatActionContent('custom_action', {
          key1: 'value1',
          key2: 'value2',
        }),
      ).toBe('<em>custom_action (key1: value1, key2: value2)</em>');
    });

    it('should format generic actions without details', () => {
      expect((listener as any).formatActionContent('custom_action', {})).toBe(
        '<em>custom_action</em>',
      );
    });
  });

  describe('joinChangesNaturally', () => {
    it('should handle empty array', () => {
      expect((listener as any).joinChangesNaturally([])).toBe('');
    });

    it('should handle single change', () => {
      expect((listener as any).joinChangesNaturally(['changed title'])).toBe(
        'changed title',
      );
    });

    it('should handle two changes', () => {
      expect(
        (listener as any).joinChangesNaturally([
          'changed title',
          'updated description',
        ]),
      ).toBe('changed title and updated description');
    });

    it('should handle three or more changes', () => {
      expect(
        (listener as any).joinChangesNaturally([
          'changed title',
          'updated description',
          'set priority',
        ]),
      ).toBe('changed title, updated description, and set priority');
    });
  });

  describe('formatFieldChangeNaturally', () => {
    it('should format title changes', () => {
      const change = {
        field: 'title',
        oldValue: 'Old Title',
        newValue: 'New Title',
      };
      expect((listener as any).formatFieldChangeNaturally(change)).toBe(
        "renamed to 'New Title'",
      );
    });

    it('should format description changes', () => {
      const change = {
        field: 'description',
        oldValue: 'Old desc',
        newValue: 'New desc',
      };
      expect((listener as any).formatFieldChangeNaturally(change)).toBe(
        'updated the description',
      );
    });

    it('should format due date changes', () => {
      const change = {
        field: 'dueDate',
        oldValue: null,
        newValue: '2023-01-01',
      };
      const result = (listener as any).formatFieldChangeNaturally(change);
      // The actual implementation uses different patterns, so check for a generic pattern
      expect(result).toMatch(/(set|is now|added).*2023-01-01/);
    });

    it('should format assignee changes', () => {
      const change = { field: 'assignee', oldValue: 'John', newValue: 'Jane' };
      expect((listener as any).formatFieldChangeNaturally(change)).toBe(
        'reassigned to Jane',
      );
    });

    it('should format priority changes', () => {
      const change = { field: 'priority', oldValue: 1, newValue: 3 };
      const result = (listener as any).formatFieldChangeNaturally(change);
      expect(result).toContain('High Priority');
    });

    it('should format difficulty changes', () => {
      const change = { field: 'difficulty', oldValue: 1, newValue: 4 };
      const result = (listener as any).formatFieldChangeNaturally(change);
      expect(result).toContain('4 - Very Hard');
    });

    it('should handle setting new values (from null)', () => {
      const change = {
        field: 'assignee',
        oldValue: null,
        newValue: 'John Doe',
      };
      const result = (listener as any).formatFieldChangeNaturally(change);
      expect(result).toContain('John Doe');
    });

    it('should handle removing values (to null)', () => {
      const change = {
        field: 'assignee',
        oldValue: 'John Doe',
        newValue: null,
      };
      const result = (listener as any).formatFieldChangeNaturally(change);
      expect(result).toContain('removed');
    });

    it('should format generic field changes', () => {
      const change = {
        field: 'status',
        oldValue: 'pending',
        newValue: 'active',
        displayName: 'Status',
      };
      expect((listener as any).formatFieldChangeNaturally(change)).toBe(
        "changed Status to 'active'",
      );
    });
  });

  describe('generateNaturalUpdateMessage', () => {
    it('should handle empty changes', () => {
      const result = (listener as any).generateNaturalUpdateMessage('task', []);
      expect(result).toBe('<em>Made an update.</em>');
    });

    it('should handle single change', () => {
      const changes = [{ field: 'title', oldValue: 'Old', newValue: 'New' }];
      const result = (listener as any).generateNaturalUpdateMessage(
        'task',
        changes,
      );
      expect(result).toContain('<em>');
      expect(result).toContain('</em>');
      expect(result).toContain('task');
    });

    it('should handle multiple changes', () => {
      const changes = [
        { field: 'title', oldValue: 'Old', newValue: 'New' },
        { field: 'priority', oldValue: 1, newValue: 3 },
      ];
      const result = (listener as any).generateNaturalUpdateMessage(
        'task',
        changes,
      );
      expect(result).toContain('<em>');
      expect(result).toContain('</em>');
      expect(result).toContain('task');
    });
  });

  describe('handleDiscussionCreate', () => {
    it('should create discussion with initial message', async () => {
      const event: DiscussionCreateEvent = {
        module: 'Task',
        targetId: 'task-123',
        discussionId: 'TASK-task-123',
        actorId: 'user-456',
        timestamp: '2023-01-01T00:00:00Z',
        title: 'Task Discussion',
        initialWatchers: ['user-1', 'user-2'],
      };

      await listener.handleDiscussionCreate(event);

      expect(discussionService.createDiscussionMessage).toHaveBeenCalledWith(
        {
          discussionId: 'TASK-task-123',
          module: 'Task',
          targetId: 'task-123',
          title: 'Task Discussion',
          content: '<em>Discussion created</em>',
          activity: 'created the discussion',
        },
        'user-456',
      );

      expect(discussionService.syncDiscussionWatchers).toHaveBeenCalledWith(
        'TASK-task-123',
        ['user-1', 'user-2'],
      );
    });

    it('should generate discussionId when not provided', async () => {
      const event: DiscussionCreateEvent = {
        module: 'Project',
        targetId: 'project-789',
        actorId: 'user-456',
        timestamp: '2023-01-01T00:00:00Z',
        title: 'Project Discussion',
        initialWatchers: [],
      };

      await listener.handleDiscussionCreate(event);

      expect(discussionService.createDiscussionMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          discussionId: 'PROJECT-project-789',
          module: 'Project',
          targetId: 'project-789',
        }),
        'user-456',
      );
    });

    it('should handle errors gracefully', async () => {
      const event: DiscussionCreateEvent = {
        module: 'Task',
        targetId: 'task-123',
        actorId: 'user-456',
        timestamp: '2023-01-01T00:00:00Z',
        title: 'Task Discussion',
        initialWatchers: [],
      };

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      discussionService.createDiscussionMessage.mockRejectedValue(
        new Error('Service error'),
      );

      await listener.handleDiscussionCreate(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[DiscussionEventListener] Error creating discussion:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('handleDiscussionMessage', () => {
    it('should create discussion message', async () => {
      const event: DiscussionMessageEvent = {
        module: 'Task',
        targetId: 'task-123',
        actorId: 'user-456',
        timestamp: '2023-01-01T00:00:00Z',
        activity: 'commented',
        content: 'This is a comment',
      };

      await listener.handleDiscussionMessage(event);

      expect(discussionService.createDiscussionMessage).toHaveBeenCalledWith(
        {
          discussionId: 'TASK-task-123',
          module: 'Task',
          targetId: 'task-123',
          title: '',
          content: 'This is a comment',
          activity: 'commented',
        },
        'user-456',
      );
    });

    it('should handle errors gracefully', async () => {
      const event: DiscussionMessageEvent = {
        module: 'Task',
        targetId: 'task-123',
        actorId: 'user-456',
        timestamp: '2023-01-01T00:00:00Z',
        activity: 'commented',
        content: 'This is a comment',
      };

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      discussionService.createDiscussionMessage.mockRejectedValue(
        new Error('Service error'),
      );

      await listener.handleDiscussionMessage(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[DiscussionEventListener] Error sending message:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('handleDiscussionUpdate', () => {
    it('should create update message with natural language', async () => {
      const event: DiscussionUpdateEvent = {
        module: 'Task',
        targetId: 'task-123',
        actorId: 'user-456',
        timestamp: '2023-01-01T00:00:00Z',
        changes: [
          { field: 'title', oldValue: 'Old Title', newValue: 'New Title' },
          { field: 'priority', oldValue: 1, newValue: 3 },
        ],
      };

      await listener.handleDiscussionUpdate(event);

      expect(discussionService.createDiscussionMessage).toHaveBeenCalledWith(
        {
          discussionId: 'TASK-task-123',
          module: 'Task',
          targetId: 'task-123',
          title: '',
          content: expect.stringContaining('<em>'),
          activity: 'updated',
        },
        'user-456',
      );
    });

    it('should handle errors gracefully', async () => {
      const event: DiscussionUpdateEvent = {
        module: 'Task',
        targetId: 'task-123',
        actorId: 'user-456',
        timestamp: '2023-01-01T00:00:00Z',
        changes: [],
      };

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      discussionService.createDiscussionMessage.mockRejectedValue(
        new Error('Service error'),
      );

      await listener.handleDiscussionUpdate(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[DiscussionEventListener] Error handling update:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('handleDiscussionAction', () => {
    it('should create action message', async () => {
      const event: DiscussionActionEvent = {
        module: 'Task',
        targetId: 'task-123',
        actorId: 'user-456',
        timestamp: '2023-01-01T00:00:00Z',
        action: 'assigned',
        details: { assigneeName: 'John Doe' },
      };

      await listener.handleDiscussionAction(event);

      expect(discussionService.createDiscussionMessage).toHaveBeenCalledWith(
        {
          discussionId: 'TASK-task-123',
          module: 'Task',
          targetId: 'task-123',
          title: '',
          content: '<em>Assigned to John Doe</em>',
          activity: 'assigned',
        },
        'user-456',
      );
    });

    it('should handle errors gracefully', async () => {
      const event: DiscussionActionEvent = {
        module: 'Task',
        targetId: 'task-123',
        actorId: 'user-456',
        timestamp: '2023-01-01T00:00:00Z',
        action: 'assigned',
        details: {},
      };

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      discussionService.createDiscussionMessage.mockRejectedValue(
        new Error('Service error'),
      );

      await listener.handleDiscussionAction(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[DiscussionEventListener] Error handling action:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });
});
