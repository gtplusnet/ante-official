import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleShiftSeeder } from './schedule-shift.seeder';
import { PrismaService } from '@common/prisma.service';
import { ShiftType, ShiftPurpose } from '@prisma/client';

describe('ScheduleShiftSeeder', () => {
  let seeder: ScheduleShiftSeeder;
  let prismaService: PrismaService;

  // Mock data
  const mockCompanyId = 1;
  const mockCompany = {
    id: mockCompanyId,
    companyName: 'Test Company',
    isActive: true,
  };

  const mockRestDayShift = {
    id: 1,
    shiftCode: 'REST-DAY',
    breakHours: 0,
    targetHours: 0,
    shiftType: ShiftType.REST_DAY,
    purpose: ShiftPurpose.REGULAR,
    companyId: mockCompanyId,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    filingId: null,
  };

  const mockRegularShift = {
    id: 2,
    shiftCode: 'REGULAR-9TO6',
    breakHours: 1,
    targetHours: 8,
    shiftType: ShiftType.TIME_BOUND,
    purpose: ShiftPurpose.REGULAR,
    companyId: mockCompanyId,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    filingId: null,
  };

  const mockShiftTime = {
    id: 1,
    shiftId: 2,
    startTime: '09:00',
    endTime: '18:00',
    isBreakTime: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSchedule = {
    id: 1,
    scheduleCode: 'REGULAR-SCHEDULE',
    mondayShiftId: 2,
    tuesdayShiftId: 2,
    wednesdayShiftId: 2,
    thursdayShiftId: 2,
    fridayShiftId: 2,
    saturdayShiftId: 1,
    sundayShiftId: 1,
    companyId: mockCompanyId,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock transaction object
  const mockTransaction = {
    shift: {
      create: jest.fn(),
    },
    shiftTime: {
      create: jest.fn(),
    },
    schedule: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: {
            company: {
              findUnique: jest.fn(),
            },
            schedule: {
              count: jest.fn(),
              findMany: jest.fn(),
            },
            shift: {
              count: jest.fn(),
              findMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    seeder = new ScheduleShiftSeeder(prismaService);
  });

  describe('Properties', () => {
    it('should have correct type', () => {
      expect(seeder.type).toBe('schedule_and_shift');
    });

    it('should have correct name', () => {
      expect(seeder.name).toBe('Schedule and Shift');
    });

    it('should have correct description', () => {
      expect(seeder.description).toBe(
        'Creates default schedule (9AM-6PM Mon-Fri, weekends off) and shifts for a company',
      );
    });
  });

  describe('canSeed', () => {
    it('should return true when company exists and has no schedules or shifts', async () => {
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany as any);
      jest.spyOn(prismaService.schedule, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.shift, 'count').mockResolvedValue(0);

      const result = await seeder.canSeed(mockCompanyId);

      expect(result).toBe(true);
      expect(prismaService.company.findUnique).toHaveBeenCalledWith({
        where: { id: mockCompanyId },
      });
      expect(prismaService.schedule.count).toHaveBeenCalledWith({
        where: { companyId: mockCompanyId, isDeleted: false },
      });
      expect(prismaService.shift.count).toHaveBeenCalledWith({
        where: { companyId: mockCompanyId, isDeleted: false },
      });
    });

    it('should return false when company does not exist', async () => {
      jest.spyOn(prismaService.company, 'findUnique').mockResolvedValue(null);

      const result = await seeder.canSeed(mockCompanyId);

      expect(result).toBe(false);
      expect(prismaService.company.findUnique).toHaveBeenCalledWith({
        where: { id: mockCompanyId },
      });
      expect(prismaService.schedule.count).not.toHaveBeenCalled();
      expect(prismaService.shift.count).not.toHaveBeenCalled();
    });

    it('should return false when company has existing schedules', async () => {
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany as any);
      jest.spyOn(prismaService.schedule, 'count').mockResolvedValue(1);
      jest.spyOn(prismaService.shift, 'count').mockResolvedValue(0);

      const result = await seeder.canSeed(mockCompanyId);

      expect(result).toBe(false);
    });

    it('should return false when company has existing shifts', async () => {
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany as any);
      jest.spyOn(prismaService.schedule, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.shift, 'count').mockResolvedValue(1);

      const result = await seeder.canSeed(mockCompanyId);

      expect(result).toBe(false);
    });

    it('should return false when company has both schedules and shifts', async () => {
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany as any);
      jest.spyOn(prismaService.schedule, 'count').mockResolvedValue(1);
      jest.spyOn(prismaService.shift, 'count').mockResolvedValue(1);

      const result = await seeder.canSeed(mockCompanyId);

      expect(result).toBe(false);
    });
  });

  describe('seed', () => {
    beforeEach(() => {
      mockTransaction.shift.create
        .mockResolvedValueOnce(mockRestDayShift)
        .mockResolvedValueOnce(mockRegularShift);
      mockTransaction.shiftTime.create.mockResolvedValue(mockShiftTime);
      mockTransaction.schedule.create.mockResolvedValue(mockSchedule);
    });

    it('should successfully seed shifts and schedules', async () => {
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany as any);
      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (fn: any) => {
          return fn(mockTransaction);
        });

      const result = await seeder.seed(mockCompanyId);

      expect(result.totalRecords).toBe(4);
      expect(result.processedRecords).toBe(4);
      expect(result.errors).toEqual([]);
      expect(result.details).toBeDefined();
      expect(result.details?.shifts).toHaveLength(2);
      expect(result.details?.schedules).toHaveLength(1);
      expect(result.details?.shiftTimes).toHaveLength(1);

      // Verify REST-DAY shift creation
      expect(mockTransaction.shift.create).toHaveBeenCalledWith({
        data: {
          shiftCode: 'REST-DAY',
          breakHours: 0,
          targetHours: 0,
          shiftType: 'REST_DAY',
          purpose: 'REGULAR',
          companyId: mockCompanyId,
          isDeleted: false,
        },
      });

      // Verify REGULAR shift creation
      expect(mockTransaction.shift.create).toHaveBeenCalledWith({
        data: {
          shiftCode: 'REGULAR-9TO6',
          breakHours: 1,
          targetHours: 8,
          shiftType: 'TIME_BOUND',
          purpose: 'REGULAR',
          companyId: mockCompanyId,
          isDeleted: false,
        },
      });

      // Verify ShiftTime creation
      expect(mockTransaction.shiftTime.create).toHaveBeenCalledWith({
        data: {
          shiftId: mockRegularShift.id,
          startTime: '09:00',
          endTime: '18:00',
          isBreakTime: false,
        },
      });

      // Verify Schedule creation
      expect(mockTransaction.schedule.create).toHaveBeenCalledWith({
        data: {
          scheduleCode: 'REGULAR-SCHEDULE',
          mondayShiftId: mockRegularShift.id,
          tuesdayShiftId: mockRegularShift.id,
          wednesdayShiftId: mockRegularShift.id,
          thursdayShiftId: mockRegularShift.id,
          fridayShiftId: mockRegularShift.id,
          saturdayShiftId: mockRestDayShift.id,
          sundayShiftId: mockRestDayShift.id,
          companyId: mockCompanyId,
          isDeleted: false,
        },
      });
    });

    it('should throw error when company does not exist', async () => {
      jest.spyOn(prismaService.company, 'findUnique').mockResolvedValue(null);

      await expect(seeder.seed(mockCompanyId)).rejects.toThrow(
        `Failed to seed schedule and shifts for company ${mockCompanyId}: Company with ID ${mockCompanyId} not found`,
      );
    });

    it('should handle transaction errors properly', async () => {
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany as any);
      const transactionError = new Error('Transaction failed');
      jest
        .spyOn(prismaService, '$transaction')
        .mockRejectedValue(transactionError);

      await expect(seeder.seed(mockCompanyId)).rejects.toThrow(
        `Failed to seed schedule and shifts for company ${mockCompanyId}: Transaction failed`,
      );
    });

    it('should return correct metadata structure', async () => {
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany as any);
      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (fn: any) => {
          return fn(mockTransaction);
        });

      const result = await seeder.seed(mockCompanyId);

      // Check metadata structure
      expect(result.details?.shifts[0]).toEqual({
        code: 'REST-DAY',
        id: mockRestDayShift.id,
        type: 'REST_DAY',
      });

      expect(result.details?.shifts[1]).toEqual({
        code: 'REGULAR-9TO6',
        id: mockRegularShift.id,
        type: 'TIME_BOUND',
        hours: 8,
      });

      expect(result.details?.schedules[0]).toEqual({
        code: 'REGULAR-SCHEDULE',
        id: mockSchedule.id,
        pattern: 'Mon-Fri: REGULAR, Sat-Sun: REST',
      });

      expect(result.details?.shiftTimes[0]).toEqual({
        shiftId: mockRegularShift.id,
        timeSlot: '09:00-18:00',
      });
    });
  });

  describe('validate', () => {
    it('should return true when company has schedules and shifts', async () => {
      jest.spyOn(prismaService.schedule, 'count').mockResolvedValue(1);
      jest.spyOn(prismaService.shift, 'count').mockResolvedValue(2);

      const result = await seeder.validate(mockCompanyId);

      expect(result).toBe(true);
      expect(prismaService.schedule.count).toHaveBeenCalledWith({
        where: { companyId: mockCompanyId, isDeleted: false },
      });
      expect(prismaService.shift.count).toHaveBeenCalledWith({
        where: { companyId: mockCompanyId, isDeleted: false },
      });
    });

    it('should return false when company has no schedules', async () => {
      jest.spyOn(prismaService.schedule, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.shift, 'count').mockResolvedValue(2);

      const result = await seeder.validate(mockCompanyId);

      expect(result).toBe(false);
    });

    it('should return false when company has no shifts', async () => {
      jest.spyOn(prismaService.schedule, 'count').mockResolvedValue(1);
      jest.spyOn(prismaService.shift, 'count').mockResolvedValue(0);

      const result = await seeder.validate(mockCompanyId);

      expect(result).toBe(false);
    });

    it('should return false when company has no schedules and no shifts', async () => {
      jest.spyOn(prismaService.schedule, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.shift, 'count').mockResolvedValue(0);

      const result = await seeder.validate(mockCompanyId);

      expect(result).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockRejectedValue(dbError);

      await expect(seeder.canSeed(mockCompanyId)).rejects.toThrow(dbError);
    });

    it('should handle partial transaction failure', async () => {
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany as any);

      const partialTransaction = {
        ...mockTransaction,
        schedule: {
          create: jest
            .fn()
            .mockRejectedValue(new Error('Schedule creation failed')),
        },
      };

      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (fn: any) => {
          return fn(partialTransaction);
        });

      await expect(seeder.seed(mockCompanyId)).rejects.toThrow(
        'Failed to seed schedule and shifts for company 1: Schedule creation failed',
      );
    });

    it('should handle invalid company ID gracefully', async () => {
      const invalidCompanyId = -1;
      jest.spyOn(prismaService.company, 'findUnique').mockResolvedValue(null);

      const result = await seeder.canSeed(invalidCompanyId);
      expect(result).toBe(false);
    });
  });
});
