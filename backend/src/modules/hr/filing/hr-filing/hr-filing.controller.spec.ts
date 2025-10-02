import { Test, TestingModule } from '@nestjs/testing';
import { HrFilingController } from './hr-filing.controller';
import { HrFilingService } from './hr-filing.service';
import { UtilityService } from '@common/utility.service';

describe('HrFilingController', () => {
  let controller: HrFilingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HrFilingController],
      providers: [
        {
          provide: HrFilingService,
          useValue: {
            createFiling: jest.fn(),
            updateFiling: jest.fn(),
            getFilingById: jest.fn(),
            getFilings: jest.fn(),
            cancelFiling: jest.fn(),
            approveFiling: jest.fn(),
            rejectFiling: jest.fn(),
          },
        },
        {
          provide: UtilityService,
          useValue: {
            responseHandler: jest.fn(),
            companyId: 1,
          },
        },
      ],
    }).compile();

    controller = module.get<HrFilingController>(HrFilingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
