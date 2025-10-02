import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  PayrollFilingType,
  PayrollFilingStatus,
  ShiftType,
} from '@prisma/client';
import { ShiftDataResponse, ShiftTimeDataResponse } from '@shared/response';
import ShiftTypeReference from '../../../../reference/shift-type.reference';
import * as moment from 'moment';

@Injectable()
export class ScheduleAdjustmentService {
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly utilityService: UtilityService;

  /**
   * Get approved schedule adjustment shift for a specific employee and date
   */
  async getScheduleAdjustmentShift(
    accountId: string,
    date: Date,
  ): Promise<ShiftDataResponse | null> {
    // Find approved schedule adjustment filing for the specific date
    const filing = await this.prisma.payrollFiling.findFirst({
      where: {
        accountId: accountId,
        filingType: PayrollFilingType.SCHEDULE_ADJUSTMENT,
        status: PayrollFilingStatus.APPROVED,
        date: {
          gte: moment(date).startOf('day').toDate(),
          lte: moment(date).endOf('day').toDate(),
        },
      },
      include: {
        shift: {
          include: {
            shiftTime: {
              orderBy: {
                startTime: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        approvedAt: 'desc', // Get the most recently approved one if multiple exist
      },
    });

    if (!filing || !filing.shift) {
      return null;
    }

    // Format the shift data to match ShiftDataResponse
    const shift = filing.shift;

    // Calculate work hours and format shift times
    let totalWorkHours = 0;
    let shiftBreakHours = 0;
    let targetHours = 0;

    const parsedFormattedShiftTime: ShiftTimeDataResponse[] =
      shift.shiftTime.map((time) => {
        const startTime = this.utilityService.formatTime(time.startTime);
        const endTime = this.utilityService.formatTime(time.endTime);
        const workHours = endTime.hours - startTime.hours;

        if (!time.isBreakTime) {
          totalWorkHours += workHours;
        } else {
          shiftBreakHours += workHours;
        }

        return {
          isNightShift: false, // TODO: Implement night shift detection logic
          workHours: this.utilityService.formatHours(workHours),
          startTime: startTime,
          endTime: endTime,
          isBreakTime: time.isBreakTime,
        };
      });

    // Calculate target hours based on shift type
    if (
      shift.shiftType === ShiftType.FLEXITIME ||
      shift.shiftType === ShiftType.EXTRA_DAY ||
      shift.shiftType === ShiftType.REST_DAY
    ) {
      totalWorkHours = shift.targetHours;
      targetHours = shift.targetHours + shift.breakHours;
    } else {
      totalWorkHours = totalWorkHours - shift.breakHours;
      targetHours = totalWorkHours + shift.breakHours + shiftBreakHours;
    }

    // Get shift type reference
    const shiftType = ShiftTypeReference.find(
      (type) => type.key === shift.shiftType,
    );

    // Get start and end times from first and last shift time
    const startTime =
      shift.shiftTime.length > 0
        ? this.utilityService.formatTime(shift.shiftTime[0].startTime)
        : null;
    const endTime =
      shift.shiftTime.length > 0
        ? this.utilityService.formatTime(
            shift.shiftTime[shift.shiftTime.length - 1].endTime,
          )
        : null;

    const shiftDataResponse: ShiftDataResponse = {
      id: shift.id,
      shiftCode: shift.shiftCode,
      targetHours: this.utilityService.formatHours(targetHours),
      breakHours: this.utilityService.formatHours(shift.breakHours),
      totalWorkHours: this.utilityService.formatHours(totalWorkHours),
      shiftBreakHours: this.utilityService.formatHours(shiftBreakHours),
      shiftType: shiftType,
      shiftTime: parsedFormattedShiftTime,
      nextDayShiftTime: [], // Schedule adjustments don't cross days
      startTime: startTime,
      endTime: endTime,
    };

    return shiftDataResponse;
  }
}
