import { Injectable } from '@nestjs/common';
import { BaseSeeder, SeederMetadata } from './base.seeder';
import { PrismaService } from '@common/prisma.service';

// Constants for shift and schedule configuration
const SHIFT_CONSTANTS = {
  REST_DAY_CODE: 'REST-DAY',
  REGULAR_CODE: 'REGULAR-9TO6',
  SCHEDULE_CODE: 'REGULAR-SCHEDULE',
  WORK_START: '09:00',
  WORK_END: '18:00',
  BREAK_HOURS: 1,
  TARGET_HOURS: 8,
} as const;

// Enhanced metadata interface for better type safety
interface ScheduleShiftMetadata extends SeederMetadata {
  details?: {
    shifts: Array<{ code: string; id: number; type: string; hours?: number }>;
    schedules: Array<{ code: string; id: number; pattern?: string }>;
    shiftTimes?: Array<{ shiftId: number; timeSlot: string }>;
  };
}

@Injectable()
export class ScheduleShiftSeeder extends BaseSeeder {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get type(): string {
    return 'schedule_and_shift';
  }

  get name(): string {
    return 'Schedule and Shift';
  }

  get description(): string {
    return 'Creates default schedule (9AM-6PM Mon-Fri, weekends off) and shifts for a company';
  }

  async canSeed(companyId: number): Promise<boolean> {
    // Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return false;
    }

    // Check if company already has schedules
    const existingSchedules = await this.prisma.schedule.count({
      where: { companyId, isDeleted: false },
    });

    // Check if company already has shifts
    const existingShifts = await this.prisma.shift.count({
      where: { companyId, isDeleted: false },
    });

    // Can seed if BOTH schedules AND shifts don't exist
    // We need both to be empty to seed the complete set
    return existingSchedules === 0 && existingShifts === 0;
  }

  async seed(companyId: number): Promise<ScheduleShiftMetadata> {
    const metadata: ScheduleShiftMetadata = {
      totalRecords: 0,
      processedRecords: 0,
      skippedRecords: 0,
      errors: [],
    };

    try {
      // Verify company exists before seeding
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new Error(`Company with ID ${companyId} not found`);
      }

      // Use transaction for atomicity
      await this.prisma.$transaction(async (tx) => {
        // 1. Create REST DAY shift
        const restDayShift = await tx.shift.create({
          data: {
            shiftCode: SHIFT_CONSTANTS.REST_DAY_CODE,
            breakHours: 0,
            targetHours: 0,
            shiftType: 'REST_DAY',
            purpose: 'REGULAR',
            companyId,
            isDeleted: false,
          },
        });
        metadata.processedRecords!++;

        // 2. Create REGULAR shift (9AM-6PM with 1 hour flexible break)
        const regularShift = await tx.shift.create({
          data: {
            shiftCode: SHIFT_CONSTANTS.REGULAR_CODE,
            breakHours: SHIFT_CONSTANTS.BREAK_HOURS, // 1 hour flexible break
            targetHours: SHIFT_CONSTANTS.TARGET_HOURS, // 8 working hours
            shiftType: 'TIME_BOUND',
            purpose: 'REGULAR',
            companyId,
            isDeleted: false,
          },
        });
        metadata.processedRecords!++;

        // 3. Create ShiftTime for regular shift (9:00 AM - 6:00 PM)
        await tx.shiftTime.create({
          data: {
            shiftId: regularShift.id,
            startTime: SHIFT_CONSTANTS.WORK_START,
            endTime: SHIFT_CONSTANTS.WORK_END,
            isBreakTime: false, // This is the main working time, not a break
          },
        });
        metadata.processedRecords!++;

        // 4. Create REGULAR SCHEDULE
        const regularSchedule = await tx.schedule.create({
          data: {
            scheduleCode: SHIFT_CONSTANTS.SCHEDULE_CODE,
            mondayShiftId: regularShift.id,
            tuesdayShiftId: regularShift.id,
            wednesdayShiftId: regularShift.id,
            thursdayShiftId: regularShift.id,
            fridayShiftId: regularShift.id,
            saturdayShiftId: restDayShift.id,
            sundayShiftId: restDayShift.id,
            companyId,
            isDeleted: false,
          },
        });
        metadata.processedRecords!++;

        metadata.totalRecords = 4; // 2 shifts + 1 shift time + 1 schedule
        metadata.details = {
          shifts: [
            {
              code: SHIFT_CONSTANTS.REST_DAY_CODE,
              id: restDayShift.id,
              type: 'REST_DAY',
            },
            {
              code: SHIFT_CONSTANTS.REGULAR_CODE,
              id: regularShift.id,
              type: 'TIME_BOUND',
              hours: SHIFT_CONSTANTS.TARGET_HOURS,
            },
          ],
          schedules: [
            {
              code: SHIFT_CONSTANTS.SCHEDULE_CODE,
              id: regularSchedule.id,
              pattern: 'Mon-Fri: REGULAR, Sat-Sun: REST',
            },
          ],
          shiftTimes: [
            {
              shiftId: regularShift.id,
              timeSlot: `${SHIFT_CONSTANTS.WORK_START}-${SHIFT_CONSTANTS.WORK_END}`,
            },
          ],
        };
      });
    } catch (error) {
      const contextualError = `Failed to seed schedule and shifts for company ${companyId}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      metadata.errors!.push(contextualError);
      throw new Error(contextualError);
    }

    return metadata;
  }

  async validate(companyId: number): Promise<boolean> {
    // Check if the company has at least one schedule and shift
    const scheduleCount = await this.prisma.schedule.count({
      where: { companyId, isDeleted: false },
    });

    const shiftCount = await this.prisma.shift.count({
      where: { companyId, isDeleted: false },
    });

    return scheduleCount > 0 && shiftCount > 0;
  }
}
