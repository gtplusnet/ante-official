import { Test, TestingModule } from '@nestjs/testing';
import { AllowanceConfigurationService } from './allowance-configuration.service';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';

describe('AllowanceConfigurationService', () => {
  let service: AllowanceConfigurationService;

  const mockPrismaService = {
    allowanceConfiguration: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    allowancePlan: {
      updateMany: jest.fn(),
    },
  };

  const mockUtilityService = {
    companyId: 1,
    formatDate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllowanceConfigurationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
      ],
    }).compile();

    service = module.get<AllowanceConfigurationService>(
      AllowanceConfigurationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
