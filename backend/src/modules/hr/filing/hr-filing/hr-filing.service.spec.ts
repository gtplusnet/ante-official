import { Test, TestingModule } from '@nestjs/testing';
import { HrFilingService } from './hr-filing.service';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { ApprovalService } from '@modules/approval/approval.service';
import { FilingApprovalStrategy } from './strategies/filing-approval.strategy';
import { ShiftConfigurationService } from '@modules/hr/configuration/shift-configuration/shift-configuration.service';
import { FilingNotificationService } from '../services/filing-notification.service';
import { OvertimeFilingIntegrationService } from '../services/overtime-filing-integration.service';
import { EmployeeLeavePlanService } from '@modules/hr/configuration/leave-configuration/employee-leave-plan.service';
import { EmailApprovalService } from '@modules/communication/email-approval/services/email-approval.service';

describe('HrFilingService', () => {
  let service: HrFilingService;

  const mockPrismaService = {
    files: {
      findUnique: jest.fn(),
    },
    payrollFiling: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
    },
  };

  const mockUtilityService = {
    accountInformation: {
      id: 'test-account-id',
    },
    formatHours: jest.fn(),
  };

  const mockApprovalService = {
    registerStrategy: jest.fn(),
    createApprovalTask: jest.fn(),
  };

  const mockFilingApprovalStrategy = {};

  const mockShiftConfigurationService = {
    findShiftById: jest.fn(),
    getEmployeeShift: jest.fn(),
  };

  const mockFilingNotificationService = {
    notifyApproval: jest.fn(),
    notifyRejection: jest.fn(),
  };

  const mockOvertimeFilingIntegrationService = {
    processOvertime: jest.fn(),
  };

  const mockEmployeeLeavePlanService = {
    validateLeave: jest.fn(),
    getEmployeeLeave: jest.fn(),
  };

  const mockEmailApprovalService = {
    sendApprovalEmail: jest.fn(),
    processEmailApproval: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrFilingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
        {
          provide: ApprovalService,
          useValue: mockApprovalService,
        },
        {
          provide: FilingApprovalStrategy,
          useValue: mockFilingApprovalStrategy,
        },
        {
          provide: ShiftConfigurationService,
          useValue: mockShiftConfigurationService,
        },
        {
          provide: FilingNotificationService,
          useValue: mockFilingNotificationService,
        },
        {
          provide: OvertimeFilingIntegrationService,
          useValue: mockOvertimeFilingIntegrationService,
        },
        {
          provide: EmployeeLeavePlanService,
          useValue: mockEmployeeLeavePlanService,
        },
        {
          provide: EmailApprovalService,
          useValue: mockEmailApprovalService,
        },
      ],
    }).compile();

    service = module.get<HrFilingService>(HrFilingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
