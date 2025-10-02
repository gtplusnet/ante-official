import { Injectable, Inject } from '@nestjs/common';
import { EmployeeTimekeeping, DeductionPeriod } from '@prisma/client';
import { UtilityService } from '@common/utility.service';
import { PayrollProcessingRateResponse } from '../../../../../../shared/response';
import {
  PayrollContext,
  SalaryRates,
} from '../interfaces/payroll-service.interfaces';

@Injectable()
export class PayrollRatesService {
  @Inject() private readonly utilityService: UtilityService;

  async getSalaryRates(
    context: PayrollContext,
    workHours = 8,
  ): Promise<SalaryRates> {
    const monthlyRate = context.employeeData.contractDetails.monthlyRate.raw;
    const shiftingWorkingDaysPerWeek =
      context.employeeData.payrollGroup.shiftingWorkingDaysPerWeek;

    let dailyRate: number;
    let totalWorkDaysInYear: number;

    if (shiftingWorkingDaysPerWeek === 0) {
      // AUTO mode: Calculate based on actual working days in a year
      const mondayCountYear = this.utilityService.getHowManyDayPerYear(
        'monday',
        context.dateBasis.raw,
      );
      const tuesdayCountYear = this.utilityService.getHowManyDayPerYear(
        'tuesday',
        context.dateBasis.raw,
      );
      const wednesdayCountYear = this.utilityService.getHowManyDayPerYear(
        'wednesday',
        context.dateBasis.raw,
      );
      const thursdayCountYear = this.utilityService.getHowManyDayPerYear(
        'thursday',
        context.dateBasis.raw,
      );
      const fridayCountYear = this.utilityService.getHowManyDayPerYear(
        'friday',
        context.dateBasis.raw,
      );
      const saturdayCountYear = this.utilityService.getHowManyDayPerYear(
        'saturday',
        context.dateBasis.raw,
      );
      const sundayCountYear = this.utilityService.getHowManyDayPerYear(
        'sunday',
        context.dateBasis.raw,
      );

      const isMondayWorkDay = context.employeeData.schedule.dayScheduleDetails
        .mondayShift.shiftType.isWorkDay
        ? mondayCountYear
        : 0;
      const isTuesdayWorkDay = context.employeeData.schedule.dayScheduleDetails
        .tuesdayShift.shiftType.isWorkDay
        ? tuesdayCountYear
        : 0;
      const isWednesdayWorkDay = context.employeeData.schedule
        .dayScheduleDetails.wednesdayShift.shiftType.isWorkDay
        ? wednesdayCountYear
        : 0;
      const isThursdayWorkDay = context.employeeData.schedule.dayScheduleDetails
        .thursdayShift.shiftType.isWorkDay
        ? thursdayCountYear
        : 0;
      const isFridayWorkDay = context.employeeData.schedule.dayScheduleDetails
        .fridayShift.shiftType.isWorkDay
        ? fridayCountYear
        : 0;
      const isSaturdayWorkDay = context.employeeData.schedule.dayScheduleDetails
        .saturdayShift.shiftType.isWorkDay
        ? saturdayCountYear
        : 0;
      const isSundayWorkDay = context.employeeData.schedule.dayScheduleDetails
        .sundayShift.shiftType.isWorkDay
        ? sundayCountYear
        : 0;

      totalWorkDaysInYear =
        isMondayWorkDay +
        isTuesdayWorkDay +
        isWednesdayWorkDay +
        isThursdayWorkDay +
        isFridayWorkDay +
        isSaturdayWorkDay +
        isSundayWorkDay;
      dailyRate = Number(((monthlyRate * 12) / totalWorkDaysInYear).toFixed(2));
    } else {
      // MANUAL mode: Calculate based on working days per week
      const monthlyWorkingDays = this.getMonthlyWorkingDays(
        shiftingWorkingDaysPerWeek,
      );
      dailyRate = Number((monthlyRate / monthlyWorkingDays).toFixed(2));
      totalWorkDaysInYear = shiftingWorkingDaysPerWeek * 52; // Approximate annual days
    }

    const cutoffRate = Number(
      (monthlyRate / context.cutoffType.divisor).toFixed(2),
    );
    const hourlyRate = Number((dailyRate / workHours).toFixed(2));

    return {
      monthlyRate: monthlyRate,
      dailyRate,
      cutoffRate,
      hourlyRate,
      totalWorkDaysInYear,
      dailyRateComputationMethod:
        shiftingWorkingDaysPerWeek === 0 ? 'AUTO' : 'MANUAL',
      monthlyWorkingDays:
        shiftingWorkingDaysPerWeek === 0
          ? undefined
          : this.getMonthlyWorkingDays(shiftingWorkingDaysPerWeek),
      workingDaysPerWeek:
        shiftingWorkingDaysPerWeek === 0
          ? undefined
          : shiftingWorkingDaysPerWeek,
    };
  }

  private getMonthlyWorkingDays(daysPerWeek: number): number {
    const mapping: { [key: number]: number } = {
      1: 4, // 1 day/week ≈ 4 days/month
      2: 9, // 2 days/week ≈ 9 days/month
      3: 13, // 3 days/week ≈ 13 days/month
      4: 17, // 4 days/week ≈ 17 days/month
      5: 22, // 5 days/week ≈ 22 days/month
      6: 26, // 6 days/week ≈ 26 days/month
      7: 30, // 7 days/week ≈ 30 days/month
    };
    return mapping[daysPerWeek] || 22;
  }

  async getRatesByTimekeeping(
    employeeTimekeeping: EmployeeTimekeeping,
    context: PayrollContext,
  ): Promise<PayrollProcessingRateResponse> {
    const payrollGroup = context.employeeData.payrollGroup;

    let rateOvertime =
      payrollGroup.overtimeRateFactors.workDay.nonHoliday.withOvertime;
    let rateRestDay = 0;
    let rateNightDifferential =
      payrollGroup.overtimeRateFactors.workDay.nonHoliday.withNightDifferential;
    let rateNightDifferentialOvertime =
      payrollGroup.overtimeRateFactors.workDay.nonHoliday
        .withNightDifferentialAndOvertime;
    let rateRegularHoliday =
      payrollGroup.overtimeRateFactors.workDay.regularHoliday.noOvertime;
    let rateSpecialHoliday =
      payrollGroup.overtimeRateFactors.workDay.specialHoliday.noOvertime;

    if (employeeTimekeeping.specialHolidayCount > 0) {
      rateOvertime =
        payrollGroup.overtimeRateFactors.workDay.specialHoliday.withOvertime;
      rateNightDifferential =
        payrollGroup.overtimeRateFactors.workDay.specialHoliday
          .withNightDifferential;
      rateNightDifferentialOvertime =
        payrollGroup.overtimeRateFactors.workDay.specialHoliday
          .withNightDifferentialAndOvertime;
    }

    if (employeeTimekeeping.regularHolidayCount > 0) {
      rateOvertime =
        payrollGroup.overtimeRateFactors.workDay.regularHoliday.withOvertime;
      rateNightDifferential =
        payrollGroup.overtimeRateFactors.workDay.regularHoliday
          .withNightDifferential;
      rateNightDifferentialOvertime =
        payrollGroup.overtimeRateFactors.workDay.regularHoliday
          .withNightDifferentialAndOvertime;
    }

    if (employeeTimekeeping.isRestDay) {
      rateRestDay =
        payrollGroup.overtimeRateFactors.restDay.nonHoliday.noOvertime;
      rateOvertime =
        payrollGroup.overtimeRateFactors.restDay.nonHoliday.withOvertime;
      rateNightDifferential =
        payrollGroup.overtimeRateFactors.restDay.nonHoliday
          .withNightDifferential;
      rateNightDifferentialOvertime =
        payrollGroup.overtimeRateFactors.restDay.nonHoliday
          .withNightDifferentialAndOvertime;
      rateRegularHoliday =
        payrollGroup.overtimeRateFactors.restDay.regularHoliday.noOvertime;
      rateSpecialHoliday =
        payrollGroup.overtimeRateFactors.restDay.specialHoliday.noOvertime;

      if (employeeTimekeeping.regularHolidayCount > 0) {
        rateRestDay =
          payrollGroup.overtimeRateFactors.restDay.regularHoliday.noOvertime;
        rateOvertime =
          payrollGroup.overtimeRateFactors.restDay.regularHoliday.withOvertime;
        rateNightDifferential =
          payrollGroup.overtimeRateFactors.restDay.regularHoliday
            .withNightDifferential;
        rateNightDifferentialOvertime =
          payrollGroup.overtimeRateFactors.restDay.regularHoliday
            .withNightDifferentialAndOvertime;
      }

      if (employeeTimekeeping.specialHolidayCount > 0) {
        rateRestDay =
          payrollGroup.overtimeRateFactors.restDay.specialHoliday.noOvertime;
        rateOvertime =
          payrollGroup.overtimeRateFactors.restDay.specialHoliday.withOvertime;
        rateNightDifferential =
          payrollGroup.overtimeRateFactors.restDay.specialHoliday
            .withNightDifferential;
        rateNightDifferentialOvertime =
          payrollGroup.overtimeRateFactors.restDay.specialHoliday
            .withNightDifferentialAndOvertime;
      }
    }

    // Special holiday rate
    rateRegularHoliday =
      rateRegularHoliday * employeeTimekeeping.regularHolidayCount;
    rateSpecialHoliday =
      rateSpecialHoliday * employeeTimekeeping.specialHolidayCount;

    return {
      rateRestDay,
      rateOvertime,
      rateNightDifferential,
      rateNightDifferentialOvertime,
      rateRegularHoliday,
      rateSpecialHoliday,
    };
  }

  async computeDivisor(
    deductionPeriod: DeductionPeriod,
    context: PayrollContext,
  ): Promise<number> {
    let divisor = 1;

    if (deductionPeriod === DeductionPeriod.EVERY_PERIOD) {
      divisor = 2;
    } else if (
      deductionPeriod === DeductionPeriod.FIRST_PERIOD ||
      deductionPeriod === DeductionPeriod.LAST_PERIOD
    ) {
      const cutoffDateRange = context.timekeepingCutoffData.cutoffDateRange;
      divisor = cutoffDateRange.cutoffPeriodType === deductionPeriod ? 1 : 0;
    } else {
      divisor = 0;
    }

    return divisor;
  }
}
