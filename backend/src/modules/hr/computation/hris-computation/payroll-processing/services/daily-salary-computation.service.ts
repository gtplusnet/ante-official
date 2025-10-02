import { Injectable, Inject } from '@nestjs/common';
import {
  EmployeeSalaryComputationPerDay,
  EmployeeTimekeeping,
} from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { PayrollContext } from '../interfaces/payroll-service.interfaces';
import { PayrollRatesService } from './payroll-rates.service';

@Injectable()
export class DailySalaryComputationService {
  @Inject() private readonly prismaService: PrismaService;
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly payrollRatesService: PayrollRatesService;

  async computeDaily(context: PayrollContext): Promise<void> {
    await Promise.all(
      context.employeeTimekeeping.map(async (employeeTimekeeping) => {
        return await this.computeDailySalaryComputationDatabase(
          employeeTimekeeping,
          context,
        );
      }),
    );
  }

  private async computeDailySalaryComputationDatabase(
    employeeTimekeeping: EmployeeTimekeeping,
    context: PayrollContext,
  ): Promise<void> {
    const rates = await this.payrollRatesService.getRatesByTimekeeping(
      employeeTimekeeping,
      context,
    );

    const paramRateUpdates = {
      rateRestDay: rates.rateRestDay,
      rateOvertime: rates.rateOvertime,
      rateNightDifferential: rates.rateNightDifferential,
      rateNightDifferentialOvertime: rates.rateNightDifferentialOvertime,
      rateRegularHoliday: rates.rateRegularHoliday,
      rateSpecialHoliday: rates.rateSpecialHoliday,
    };

    let employeeSalaryComputationPerDay: EmployeeSalaryComputationPerDay =
      await this.prismaService.employeeSalaryComputationPerDay.upsert({
        where: {
          timekeepingId: employeeTimekeeping.id,
        },
        create: {
          timekeepingId: employeeTimekeeping.id,
          ...paramRateUpdates,
        },
        update: {
          ...paramRateUpdates,
        },
      });

    employeeSalaryComputationPerDay = await this.computeDaySalary(
      employeeSalaryComputationPerDay,
      employeeTimekeeping,
      context,
    );
    await this.updateDaySalary(employeeSalaryComputationPerDay);

    context.employeeSalaryComputationPerDayBreakdown.push(
      employeeSalaryComputationPerDay,
    );
  }

  private async computeDaySalary(
    employeeSalaryComputationPerDay: EmployeeSalaryComputationPerDay,
    employeeTimekeeping: EmployeeTimekeeping,
    context: PayrollContext,
  ): Promise<EmployeeSalaryComputationPerDay> {
    const salaryRates = await this.payrollRatesService.getSalaryRates(
      context,
      8,
    );

    const monthlyRate = salaryRates.monthlyRate;
    let dailyRate = salaryRates.dailyRate;
    let hourlyRate = salaryRates.hourlyRate;

    // If day is not approved - no daily rate
    if (!employeeTimekeeping.isDayApproved) {
      dailyRate = 0;
      hourlyRate = 0;
    }

    // Set work day counts
    employeeSalaryComputationPerDay.totalWorkDaysInYear =
      salaryRates.totalWorkDaysInYear;
    employeeSalaryComputationPerDay.yearCountMonday =
      this.utilityService.getHowManyDayPerYear('monday', context.dateBasis.raw);
    employeeSalaryComputationPerDay.yearCountTuesday =
      this.utilityService.getHowManyDayPerYear(
        'tuesday',
        context.dateBasis.raw,
      );
    employeeSalaryComputationPerDay.yearCountWednesday =
      this.utilityService.getHowManyDayPerYear(
        'wednesday',
        context.dateBasis.raw,
      );
    employeeSalaryComputationPerDay.yearCountThursday =
      this.utilityService.getHowManyDayPerYear(
        'thursday',
        context.dateBasis.raw,
      );
    employeeSalaryComputationPerDay.yearCountFriday =
      this.utilityService.getHowManyDayPerYear('friday', context.dateBasis.raw);
    employeeSalaryComputationPerDay.yearCountSaturday =
      this.utilityService.getHowManyDayPerYear(
        'saturday',
        context.dateBasis.raw,
      );
    employeeSalaryComputationPerDay.yearCountSunday =
      this.utilityService.getHowManyDayPerYear('sunday', context.dateBasis.raw);

    // Set work day flags
    employeeSalaryComputationPerDay.isMondayWorkDay =
      context.employeeData.schedule.dayScheduleDetails.mondayShift.shiftType.isWorkDay;
    employeeSalaryComputationPerDay.isTuesdayWorkDay =
      context.employeeData.schedule.dayScheduleDetails.tuesdayShift.shiftType.isWorkDay;
    employeeSalaryComputationPerDay.isWednesdayWorkDay =
      context.employeeData.schedule.dayScheduleDetails.wednesdayShift.shiftType.isWorkDay;
    employeeSalaryComputationPerDay.isThursdayWorkDay =
      context.employeeData.schedule.dayScheduleDetails.thursdayShift.shiftType.isWorkDay;
    employeeSalaryComputationPerDay.isFridayWorkDay =
      context.employeeData.schedule.dayScheduleDetails.fridayShift.shiftType.isWorkDay;
    employeeSalaryComputationPerDay.isSaturdayWorkDay =
      context.employeeData.schedule.dayScheduleDetails.saturdayShift.shiftType.isWorkDay;
    employeeSalaryComputationPerDay.isSundayWorkDay =
      context.employeeData.schedule.dayScheduleDetails.sundayShift.shiftType.isWorkDay;

    // Set rates
    employeeSalaryComputationPerDay.monthlyRate = Number(
      monthlyRate.toFixed(2),
    );
    employeeSalaryComputationPerDay.cutoffRate = Number(
      (monthlyRate / context.cutoffType.divisor).toFixed(2),
    );
    employeeSalaryComputationPerDay.dailyRate = Number(dailyRate.toFixed(2));
    employeeSalaryComputationPerDay.hourlyRate = Number(hourlyRate.toFixed(2));

    // Calculate deductions
    employeeSalaryComputationPerDay.deductionLate = Number(
      ((employeeTimekeeping.lateMinutes / 60) * hourlyRate).toFixed(2),
    );
    employeeSalaryComputationPerDay.deductionUndertime = Number(
      ((employeeTimekeeping.undertimeMinutes / 60) * hourlyRate).toFixed(2),
    );
    employeeSalaryComputationPerDay.deductionAbsent =
      dailyRate * employeeTimekeeping.absentCount;

    employeeSalaryComputationPerDay.totalDeduction = Number(
      this.sumAll([
        employeeSalaryComputationPerDay.deductionLate,
        employeeSalaryComputationPerDay.deductionUndertime,
        employeeSalaryComputationPerDay.deductionAbsent,
      ]).toFixed(2),
    );

    // Earning - night differential
    employeeSalaryComputationPerDay.earningNightDifferentialRaw = Number(
      (
        (employeeTimekeeping.nightDifferentialMinutes / 60) *
        hourlyRate
      ).toFixed(2),
    );
    employeeSalaryComputationPerDay.earningNightDifferential = Number(
      (
        employeeSalaryComputationPerDay.earningNightDifferentialRaw *
        employeeSalaryComputationPerDay.rateNightDifferential
      ).toFixed(2),
    );

    // Earning - overtime
    employeeSalaryComputationPerDay.earningOvertimeRaw = Number(
      ((employeeTimekeeping.overtimeMinutesApproved / 60) * hourlyRate).toFixed(
        2,
      ),
    );
    employeeSalaryComputationPerDay.earningOvertime = Number(
      (
        employeeSalaryComputationPerDay.earningOvertimeRaw *
        employeeSalaryComputationPerDay.rateOvertime
      ).toFixed(2),
    );

    // Earning - night differential overtime
    employeeSalaryComputationPerDay.earningNightDifferentialOvertimeRaw =
      Number(
        (
          (employeeTimekeeping.nightDifferentialOvertimeApproved / 60) *
          hourlyRate
        ).toFixed(2),
      );
    employeeSalaryComputationPerDay.earningNightDifferentialOvertime = Number(
      (
        employeeSalaryComputationPerDay.earningNightDifferentialOvertimeRaw *
        employeeSalaryComputationPerDay.rateNightDifferentialOvertime
      ).toFixed(2),
    );

    // Basic pay
    employeeSalaryComputationPerDay.basicPay = Number(
      (dailyRate - employeeSalaryComputationPerDay.totalDeduction).toFixed(2),
    );

    // Earning - rest day
    employeeSalaryComputationPerDay.earningRestDay = Number(
      (
        employeeSalaryComputationPerDay.basicPay *
        employeeSalaryComputationPerDay.rateRestDay
      ).toFixed(2),
    );

    // Earnings - special holiday (only if eligible)
    if (employeeTimekeeping.isEligibleHoliday) {
      employeeSalaryComputationPerDay.earningSpecialHoliday = Number(
        (
          employeeSalaryComputationPerDay.basicPay *
          employeeSalaryComputationPerDay.rateSpecialHoliday
        ).toFixed(2),
      );
    } else {
      employeeSalaryComputationPerDay.earningSpecialHoliday = 0;
    }

    // Earnings - regular holiday (only if eligible)
    if (employeeTimekeeping.isEligibleHoliday) {
      employeeSalaryComputationPerDay.earningRegularHoliday = Number(
        (
          employeeSalaryComputationPerDay.dailyRate *
          employeeSalaryComputationPerDay.rateRegularHoliday
        ).toFixed(2),
      );
    } else {
      employeeSalaryComputationPerDay.earningRegularHoliday = 0;
    }

    // Total additional earnings
    const totalAdditionalEarnings = this.sumAll([
      employeeSalaryComputationPerDay.earningOvertime,
      employeeSalaryComputationPerDay.earningNightDifferential,
      employeeSalaryComputationPerDay.earningNightDifferentialOvertime,
      employeeSalaryComputationPerDay.earningRegularHoliday,
      employeeSalaryComputationPerDay.earningSpecialHoliday,
      employeeSalaryComputationPerDay.earningRestDay,
    ]);

    employeeSalaryComputationPerDay.totalAdditionalEarnings = Number(
      totalAdditionalEarnings.toFixed(2),
    );

    return employeeSalaryComputationPerDay;
  }

  private async updateDaySalary(
    employeeSalaryComputationPerDay: EmployeeSalaryComputationPerDay,
  ): Promise<void> {
    await this.prismaService.employeeSalaryComputationPerDay.update({
      where: {
        timekeepingId: employeeSalaryComputationPerDay.timekeepingId,
      },
      data: {
        ...employeeSalaryComputationPerDay,
      },
    });
  }

  private sumAll(numbers: number[]): number {
    return Number(numbers.reduce((acc, num) => acc + num, 0).toFixed(2));
  }
}
