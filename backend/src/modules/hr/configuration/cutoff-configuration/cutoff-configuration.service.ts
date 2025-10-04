import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import {
  CutoffDate,
  CutoffUpdateDTO,
  GetConfigSelectCutOffDTO,
} from './cutoff-configuration.interface';
import { PrismaService } from '@common/prisma.service';
import {
  Prisma,
  Cutoff,
  CutoffType,
  CutoffPeriodType,
  CutoffDateRange,
  CutoffDateRangeStatus,
} from '@prisma/client';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import {
  CutoffTypeReference,
  CutoffConfigSelectMonthly,
  CutoffConfigSelectSemiMonthly,
  CutoffConfigSelectWeekly,
} from '../../../../reference/cutoff.reference';
import * as moment from 'moment';
import {
  CutoffConfigMonthly,
  CutoffConfigSemiMonthly,
  CutoffConfigWeekly,
  CutoffDataResponse,
} from '../../../../shared/response/cutoff.response';
import CutoffPeriodTypeReference from '../../../../reference/cutoff-period.type-reference';
import {
  CurrencyFormat,
  CutoffDateRangeResponse,
  CutoffDateRangeLiteResponse,
} from '../../../../shared/response';
import { QueueService } from '@infrastructure/queue/queue/queue.service';

@Injectable()
export class CutoffConfigurationService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;
  @Inject() public tableHandlerService: TableHandlerService;
  @Inject(forwardRef(() => QueueService)) public queueService: QueueService;

  async info(id: number): Promise<CutoffDataResponse> {
    id = Number(id);
    const response = await this.prisma.cutoff.findUnique({ where: { id } });
    const formattedResponse = await this.formattedResponse(response);
    return formattedResponse;
  }

  async dateRangeInformation(id: string): Promise<CutoffDateRangeResponse> {
    const data: CutoffDateRange = await this.prisma.cutoffDateRange.findUnique({
      where: { id },
    });
    const formattedResponse = await this.formateDateRangeResponse(data);
    return formattedResponse;
  }

  async getDateRangeList(
    status: CutoffDateRangeStatus,
  ): Promise<CutoffDateRangeResponse[]> {
    const data: CutoffDateRange[] = await this.prisma.cutoffDateRange.findMany({
      where: {
        status,
        cutoff: {
          companyId: this.utilityService.companyId,
          isDeleted: false,
        },
      },
      orderBy: [{ processingDate: 'desc' }, { cutoffId: 'desc' }],
    });
    return await Promise.all(
      data.map(async (dateRange) => {
        return await this.formateDateRangeResponse(dateRange);
      }),
    );
  }

  /**
   * Lightweight version of getDateRangeList optimized for performance
   * Uses single query with join and minimal formatting
   * Returns only essential fields for list views
   */
  async getDateRangeListLite(
    status: CutoffDateRangeStatus,
  ): Promise<CutoffDateRangeLiteResponse[]> {
    // Single query with Cutoff join to avoid N+1
    const data = await this.prisma.cutoffDateRange.findMany({
      where: {
        status,
        cutoff: {
          companyId: this.utilityService.companyId,
          isDeleted: false,
        },
      },
      include: {
        cutoff: true, // Join cutoff data in single query
      },
      orderBy: [{ processingDate: 'desc' }, { cutoffId: 'desc' }],
    });

    // Format responses - minimal formatting, no currency conversion
    return data.map((dateRange) => this.formateDateRangeResponseLite(dateRange));
  }

  /**
   * Lightweight formatter for cutoff date ranges
   * Skips expensive operations like formatCurrency and queue lookups
   */
  private formateDateRangeResponseLite(
    data: CutoffDateRange & { cutoff: Cutoff },
  ): CutoffDateRangeLiteResponse {
    const startDate = this.utilityService.formatDate(data.startDate);
    const endDate = this.utilityService.formatDate(data.endDate);
    const processingDate = this.utilityService.formatDate(data.processingDate);
    const cutoffPeriodType = CutoffPeriodTypeReference.find(
      (type) => type.key === data.cutoffPeriodType,
    );
    const label = `${startDate.dateFull} - ${endDate.dateFull} (${data.cutoff.cutoffCode})`;

    // Calculate active status
    const currentDate = moment();
    const isActive =
      currentDate.isSameOrAfter(moment(data.startDate), 'day') &&
      currentDate.isSameOrBefore(moment(data.endDate), 'day');

    // Determine date range status
    let dateRangeStatus: 'Past Due' | 'Current' | 'On Process';
    if (currentDate.isAfter(moment(data.processingDate), 'day')) {
      dateRangeStatus = 'Past Due';
    } else if (isActive) {
      dateRangeStatus = 'Current';
    } else {
      dateRangeStatus = 'On Process';
    }

    const response: CutoffDateRangeLiteResponse = {
      key: data.id,
      label,
      cutoffId: data.cutoff.id,
      cutoffCode: data.cutoff.cutoffCode,
      startDate,
      endDate,
      processingDate,
      cutoffPeriodType,
      status: data.status,
      isActive,
      dateRangeStatus,
    };

    // Only include non-zero totals (save bandwidth)
    if (data.totalNetPay) response.totalNetPay = data.totalNetPay;
    if (data.totalGrossPay) response.totalGrossPay = data.totalGrossPay;
    if (data.totalBasicPay) response.totalBasicPay = data.totalBasicPay;
    if (data.totalDeduction) response.totalDeduction = data.totalDeduction;
    if (data.totalEarningOvertime)
      response.totalEarningOvertime = data.totalEarningOvertime;

    // Queue flags (no MongoDB queries, just boolean checks)
    if (data.timekeepingProcessingQueueId)
      response.hasTimekeepingQueue = true;
    if (data.payrollProcessingQueueId) response.hasPayrollQueue = true;
    if (data.payslipProcessingQueueId) response.hasPayslipQueue = true;

    return response;
  }

  async getDateRangeListByUserPayrollGroup(
    status: CutoffDateRangeStatus,
    accountId: string,
  ): Promise<CutoffDateRangeResponse[]> {
    // Get the user's payroll group through Account -> EmployeeData -> PayrollGroup
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        EmployeeData: {
          include: {
            payrollGroup: true,
          },
        },
      },
    });

    if (!account?.EmployeeData?.payrollGroup) {
      // If no payroll group found, return all cutoffs for the company (fallback behavior)
      return this.getDateRangeList(status);
    }

    const cutoffId = account.EmployeeData.payrollGroup.cutoffId;

    const data: CutoffDateRange[] = await this.prisma.cutoffDateRange.findMany({
      where: {
        status,
        cutoffId: cutoffId,
        cutoff: {
          companyId: this.utilityService.companyId,
          isDeleted: false,
        },
      },
      orderBy: [{ processingDate: 'desc' }, { cutoffId: 'desc' }],
    });

    return await Promise.all(
      data.map(async (dateRange) => {
        return await this.formateDateRangeResponse(dateRange);
      }),
    );
  }

  async dateRangeById(id: string): Promise<CutoffDateRangeResponse> {
    const data: CutoffDateRange = await this.prisma.cutoffDateRange.findUnique({
      where: { id },
    });
    return await this.formateDateRangeResponse(data);
  }

  async formateDateRangeResponse(
    data: CutoffDateRange,
  ): Promise<CutoffDateRangeResponse> {
    const cutoff = await this.prisma.cutoff.findUnique({
      where: { id: data.cutoffId },
    });
    const startDate = this.utilityService.formatDate(data.startDate);
    const endDate = this.utilityService.formatDate(data.endDate);
    const processingDate = this.utilityService.formatDate(data.processingDate);
    const cutoffPeriodType = CutoffPeriodTypeReference.find(
      (type) => type.key === data.cutoffPeriodType,
    );
    const label = `${startDate.dateFull} - ${endDate.dateFull} (${cutoff.cutoffCode})`;
    const status = data.status;
    const totalGrossPay: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalGrossPay);
    const totalNetPay: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalNetPay);
    const totalBasicPay: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalBasicPay);
    const totalBasicSalary: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalBasicSalary);
    const totalDeductionLate: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalDeductionLate);
    const totalDeductionUndertime: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalDeductionUndertime);
    const totalDeductionAbsent: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalDeductionAbsent);
    const totalDeduction: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalDeduction);
    const totalEarningOvertime: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalEarningOvertime);
    const totalEarningNightDiff: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalEarningNightDiff);
    const totalEarningNightDiffOT: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalEarningNightDiffOT);
    const totalEarningRestDay: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalEarningRestDay);
    const totalEarningRegularHoliday: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalEarningRegularHoliday);
    const totalEarningSpecialHoliday: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalEarningSpecialHoliday);
    const totalAdditionalEarnings: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalAdditionalEarnings);
    const totalAllowance: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalAllowance);
    const totalGovernmentContribution: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContribution,
      );
    const totalLoans: CurrencyFormat = await this.utilityService.formatCurrency(
      data.totalLoans,
    );
    const totalTax: CurrencyFormat = await this.utilityService.formatCurrency(
      data.totalTax,
    );
    const totalBasicPayMonthlyRate: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalBasicPayMonthlyRate);
    const totalDeductionSalaryAdjustmnt: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalDeductionSalaryAdjustmnt,
      );
    const totalEarningSalaryAdjustment: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalEarningSalaryAdjustment,
      );
    const totalTaxableAllowance: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalTaxableAllowance);
    const totalNonTaxableAllowance: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalNonTaxableAllowance);
    const totalEarningsPlusAllowance: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalEarningsPlusAllowance);
    const totalGovernmentContributionSSS: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionSSS,
      );
    const totalGovernmentContributionSSSBasis: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionSSSBasis,
      );
    const totalGovernmentContributionSSSEER: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionSSSEER,
      );
    const totalGovernmentContributionSSSEREC: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionSSSEREC,
      );
    const totalGovernmentContributionSSSEEMPF: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionSSSEEMPF,
      );
    const totalGovernmentContributionSSSEETotal: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionSSSEETotal,
      );
    const totalGovernmentContributionSSSERR: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionSSSERR,
      );
    const totalGovernmentContributionSSSERMPF: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionSSSERMPF,
      );
    const totalGovernmentContributionSSSERTotal: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionSSSERTotal,
      );
    const totalGovernmentContributionSSSMSR: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionSSSMSR,
      );
    const totalGovernmentContributionSSSMSMPF: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionSSSMSMPF,
      );
    const totalGovernmentContributionSSSMSTotal: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionSSSMSTotal,
      );
    const totalGovernmentContributionPhilhealth: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionPhilhealth,
      );
    const totalGovernmentContributionPhilhealthBasis: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionPhilhealthBasis,
      );
    const totalGovernmentContributionPhilhealthPercentage: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionPhilhealthPercentage,
      );
    const totalGovernmentContributionPhilhealthMinimum: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionPhilhealthMinimum,
      );
    const totalGovernmentContributionPhilhealthMaximum: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionPhilhealthMaximum,
      );
    const totalGovernmentContributionPhilhealthEmployeeShare: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionPhilhealthEmployeeShare,
      );
    const totalGovernmentContributionPhilhealthEmployerShare: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionPhilhealthEmployerShare,
      );
    const totalGovernmentContributionPagibig: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionPagibig,
      );
    const totalGovernmentContributionPagibigBasis: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionPagibigBasis,
      );
    const totalGovernmentContributionPagibigPercentage: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionPagibigPercentage,
      );
    const totalGovernmentContributionPagibigMinimumShare: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionPagibigMinimumShare,
      );
    const totalGovernmentContributionPagibigMinimumPercentage: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionPagibigMinimumPercentage,
      );
    const totalGovernmentContributionPagibigMaximumEEShare: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionPagibigMaximumEEShare,
      );
    const totalGovernmentContributionPagibigMaximumERShare: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionPagibigMaximumERShare,
      );
    const totalGovernmentContributionPagibigEmployeeShare: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionPagibigEmployeeShare,
      );
    const totalGovernmentContributionPagibigEmployerShare: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionPagibigEmployerShare,
      );
    const totalGovernmentContributionTax: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalGovernmentContributionTax,
      );
    const totalGrossTaxableIncome: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalGrossTaxableIncome);
    const totalNonTaxableGovernmentContribution: CurrencyFormat =
      await this.utilityService.formatCurrency(
        data.totalNonTaxableGovernmentContribution,
      );
    const totalNonTaxableDeduction: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalNonTaxableDeduction);
    const totalTaxableIncome: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalTaxableIncome);
    const totalTaxOffset: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalTaxOffset);
    const totalTaxPercentage: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalTaxPercentage);
    const totalTaxByPercentage: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalTaxByPercentage);
    const totalTaxFixedAmount: CurrencyFormat =
      await this.utilityService.formatCurrency(data.totalTaxFixedAmount);

    let timekeepingQueueResponse;
    let processQueueResponse;
    let payslipQueueResponse;

    if (data.timekeepingProcessingQueueId) {
      timekeepingQueueResponse = await this.queueService.getQueueInfo(
        data.timekeepingProcessingQueueId,
      );
    }

    if (data.payrollProcessingQueueId) {
      processQueueResponse = await this.queueService.getQueueInfo(
        data.payrollProcessingQueueId,
      );
    }

    if (data.payslipProcessingQueueId) {
      payslipQueueResponse = await this.queueService.getQueueInfo(
        data.payslipProcessingQueueId,
      );
    }

    // Calculate if this date range is active based on current date
    const currentDate = moment();
    const isActive =
      currentDate.isSameOrAfter(moment(data.startDate), 'day') &&
      currentDate.isSameOrBefore(moment(data.endDate), 'day');

    // Determine date range status
    let dateRangeStatus: 'Past Due' | 'Current' | 'On Process';
    if (currentDate.isAfter(moment(data.processingDate), 'day')) {
      dateRangeStatus = 'Past Due';
    } else if (isActive) {
      dateRangeStatus = 'Current';
    } else {
      dateRangeStatus = 'On Process';
    }

    return {
      key: data.id,
      label,
      cutoffId: cutoff.id,
      cutoffCode: cutoff.cutoffCode,
      startDate,
      endDate,
      cutoffPeriodType,
      processingDate,
      status,
      isActive,
      dateRangeStatus,
      totalGrossPay,
      totalNetPay,
      totalBasicPay,
      totalBasicSalary,
      totalDeductionLate,
      totalDeductionUndertime,
      totalDeductionAbsent,
      totalDeduction,
      totalEarningOvertime,
      totalEarningNightDiff,
      totalEarningNightDiffOT,
      totalEarningRestDay,
      totalEarningRegularHoliday,
      totalEarningSpecialHoliday,
      totalAdditionalEarnings,
      totalAllowance,
      totalGovernmentContribution,
      totalLoans,
      totalTax,
      totalBasicPayMonthlyRate,
      totalDeductionSalaryAdjustmnt,
      totalEarningSalaryAdjustment,
      totalTaxableAllowance,
      totalNonTaxableAllowance,
      totalEarningsPlusAllowance,
      totalGovernmentContributionSSS,
      totalGovernmentContributionSSSBasis,
      totalGovernmentContributionSSSEER,
      totalGovernmentContributionSSSEREC,
      totalGovernmentContributionSSSEEMPF,
      totalGovernmentContributionSSSEETotal,
      totalGovernmentContributionSSSERR,
      totalGovernmentContributionSSSERMPF,
      totalGovernmentContributionSSSERTotal,
      totalGovernmentContributionSSSMSR,
      totalGovernmentContributionSSSMSMPF,
      totalGovernmentContributionSSSMSTotal,
      totalGovernmentContributionPhilhealth,
      totalGovernmentContributionPhilhealthBasis,
      totalGovernmentContributionPhilhealthPercentage,
      totalGovernmentContributionPhilhealthMinimum,
      totalGovernmentContributionPhilhealthMaximum,
      totalGovernmentContributionPhilhealthEmployeeShare,
      totalGovernmentContributionPhilhealthEmployerShare,
      totalGovernmentContributionPagibig,
      totalGovernmentContributionPagibigBasis,
      totalGovernmentContributionPagibigPercentage,
      totalGovernmentContributionPagibigMinimumShare,
      totalGovernmentContributionPagibigMinimumPercentage,
      totalGovernmentContributionPagibigMaximumEEShare,
      totalGovernmentContributionPagibigMaximumERShare,
      totalGovernmentContributionPagibigEmployeeShare,
      totalGovernmentContributionPagibigEmployerShare,
      totalGovernmentContributionTax,
      totalGrossTaxableIncome,
      totalNonTaxableGovernmentContribution,
      totalNonTaxableDeduction,
      totalTaxableIncome,
      totalTaxOffset,
      totalTaxPercentage,
      totalTaxByPercentage,
      totalTaxFixedAmount,
      timekeepingQueueResponse,
      processQueueResponse,
      payslipQueueResponse,
    };
  }
  async deleteCutOff(id: number) {
    id = Number(id);
    const cutoff = await this.prisma.cutoff.findUnique({ where: { id } });

    if (!cutoff) {
      throw new NotFoundException('Cutoff not found');
    }

    await this.prisma.cutoff.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });
  }

  async infoWithDateRange(id: number): Promise<{
    cutoffInformation: CutoffDataResponse;
    cutOffDates: CutoffDate[];
    dateRangeSummary: string[];
  }> {
    id = Number(id);
    const response: Cutoff = await this.prisma.cutoff.findUnique({
      where: { id },
    });
    const formattedResponse = await this.formattedResponse(response);
    const dateRanges: CutoffDate[] = await this.getCutoffDates(
      id,
      response.cutoffType,
      JSON.parse(response.cutoffConfig.toString()),
      response.releaseProcessingDays,
    );
    const dateRangesSummary = dateRanges.map(
      (dateRange) => dateRange.dateRange,
    );

    return {
      cutoffInformation: formattedResponse,
      dateRangeSummary: dateRangesSummary,
      cutOffDates: dateRanges,
    };
  }
  async table(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'cutoff');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: this.utilityService.companyId,
      isDeleted: false,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.cutoff,
      query,
      tableQuery,
    );
    const formattedList: CutoffDataResponse[] = await Promise.all(
      baseList.map(async (cutoff: Cutoff) => {
        return await this.formattedResponse(cutoff);
      }),
    );

    return { list: formattedList, pagination, currentPage };
  }
  async populateDateRange() {
    const cutoff: Cutoff[] = await this.prisma.cutoff.findMany({
      where: {
        companyId: this.utilityService.companyId,
      },
    });

    let dates: CutoffDate[] = [];

    for (const cutoffData of cutoff) {
      const cutoffConfig = JSON.parse(cutoffData.cutoffConfig.toString());
      const cutoffDates = await this.getCutoffDates(
        cutoffData.id,
        cutoffData.cutoffType,
        cutoffConfig,
        cutoffData.releaseProcessingDays,
      );

      const cutoffDatesWithId = cutoffDates.map((cutoffDate) => ({
        ...cutoffDate,
        cutoffId: cutoffData.id,
      }));
      dates = [...dates, ...cutoffDatesWithId];
    }

    // OPTIMIZATION: Batch check existing records instead of 109 sequential queries
    const dateRangeCodes = dates.map((d) => d.dateRangeCode);
    const existingRecords = await this.prisma.cutoffDateRange.findMany({
      where: { id: { in: dateRangeCodes } },
      select: { id: true },
    });
    const existingIds = new Set(existingRecords.map((r) => r.id));

    // Filter only missing records
    const missingDates = dates.filter(
      (d) => !existingIds.has(d.dateRangeCode),
    );

    // OPTIMIZATION: Batch insert missing records (if any)
    if (missingDates.length > 0) {
      await this.prisma.cutoffDateRange.createMany({
        data: missingDates.map((cutoffDate) => ({
          id: cutoffDate.dateRangeCode,
          cutoffId: cutoffDate.cutoffId,
          startDate: cutoffDate.fromDate.raw,
          endDate: cutoffDate.toDate.raw,
          processingDate: cutoffDate.releaseDate.raw,
          cutoffPeriodType: cutoffDate.cutoffPeriodType,
        })),
        skipDuplicates: true,
      });
    }
  }
  async createCutOff(data: CutoffUpdateDTO) {
    const createCutoff: Prisma.CutoffCreateInput = {
      cutoffCode: data.cutoffCode,
      cutoffType: data.cutoffType,
      cutoffConfig: JSON.stringify(data.cutoffConfig),
      releaseProcessingDays: data.releaseProcessingDays,
      company: {
        connect: {
          id: this.utilityService.companyId,
        },
      },
    };

    let response;

    if (data.id) {
      response = await this.prisma.cutoff.update({
        where: { id: data.id },
        data: createCutoff,
      });
    } else {
      response = await this.prisma.cutoff.create({ data: createCutoff });
    }

    const formattedResponse = this.formattedResponse(response);

    return formattedResponse;
  }

  async getCutoffType() {
    return CutoffTypeReference;
  }

  async getCutOffConfigSelect(data: GetConfigSelectCutOffDTO) {
    switch (data.cutoffType) {
      case CutoffType.MONTHLY:
        return CutoffConfigSelectMonthly;
      case CutoffType.WEEKLY:
        return CutoffConfigSelectWeekly;
      case CutoffType.SEMIMONTHLY:
        return CutoffConfigSelectSemiMonthly;
    }
  }

  async getCutoffDates(
    id,
    cutoffType: CutoffType,
    cutoffConfig: any,
    releaseDay: number,
  ): Promise<CutoffDate[]> {
    switch (cutoffType) {
      case CutoffType.MONTHLY:
        return await this.getCutoffDateMonthly(id, cutoffConfig, releaseDay);
      case CutoffType.WEEKLY:
        return await this.getCutoffDateWeekly(id, cutoffConfig, releaseDay);
      case CutoffType.SEMIMONTHLY:
        return await this.getCutoffDateSemiMonthly(
          id,
          cutoffConfig,
          releaseDay,
        );
    }
  }
  async getCutoffDateMonthly(
    id: number,
    cutoffConfig: CutoffConfigMonthly,
    releaseDay: number,
  ): Promise<CutoffDate[]> {
    const cutoffDates: CutoffDate[] = [];
    const { cutoffPeriod } = cutoffConfig;

    const currentDate = this.utilityService.currentDate();
    let nextCutoffDate = moment(currentDate).date(cutoffPeriod);

    if (nextCutoffDate.isBefore(currentDate, 'day')) {
      nextCutoffDate = nextCutoffDate.add(1, 'month');
    }

    for (let i = 0; i < 10; i++) {
      const fromDate = moment(nextCutoffDate)
        .subtract(1, 'month')
        .add(1, 'day')
        .format('YYYY-MM-DD');
      const toDate = nextCutoffDate.endOf('day').format('YYYY-MM-DD HH:mm:ss');
      const releaseDate = nextCutoffDate
        .add(releaseDay, 'day')
        .format('YYYY-MM-DD');
      const dateRange = `${moment(fromDate).format('MMMM DD, YYYY')} - ${moment(toDate).format('MMMM DD, YYYY')}`;

      const cutoffDate: CutoffDate = {
        dateRangeCode: await this.createDateRangeCode(id, fromDate, toDate),
        dateRange: dateRange,
        fromDate: this.utilityService.formatDate(fromDate),
        toDate: this.utilityService.formatDate(toDate),
        releaseDate: this.utilityService.formatDate(releaseDate),
        cutoffPeriodType: CutoffPeriodType.LAST_PERIOD,
      };

      cutoffDates.push(cutoffDate);

      // Move to the previous cutoff date
      nextCutoffDate = moment(nextCutoffDate)
        .subtract(1, 'month')
        .date(cutoffPeriod);
    }

    return cutoffDates;
  }

  async getCutoffDateSemiMonthly(
    id: number,
    cutoffConfig: CutoffConfigSemiMonthly,
    releaseDay: number,
  ): Promise<CutoffDate[]> {
    const cutoffDates: CutoffDate[] = [];
    const summaryOutput = [];

    const { firstCutoffPeriod, lastCutoffPeriod } = cutoffConfig;
    let currentDate = this.utilityService.currentDate();

    for (let i = 0; i < 10; i++) {
      const fromDateData = await this.getCutoffDateSemiMonthlyCompute(
        id,
        currentDate,
        firstCutoffPeriod,
        lastCutoffPeriod,
      );
      const fromDate = moment(fromDateData.nextCutoffDate);

      const toDateBasis = moment(fromDate).add(25, 'days');
      const toDateData = await this.getCutoffDateSemiMonthlyCompute(
        id,
        toDateBasis,
        firstCutoffPeriod,
        lastCutoffPeriod,
      );
      const toDate = moment(toDateData.nextCutoffDate).subtract(1, 'day');
      const releaseDate = moment(toDate)
        .add(releaseDay, 'days')
        .format('YYYY-MM-DD');
      const dateRange = `${moment(fromDate).format('MMMM DD, YYYY')} - ${moment(toDate).format('MMMM DD, YYYY')} (${fromDateData.cutoffPeriodType})`;

      currentDate = moment(fromDate).subtract(1, 'day').format('YYYY-MM-DD');

      const cutoffDate: CutoffDate = {
        dateRangeCode: await this.createDateRangeCode(
          id,
          fromDate.format('YYYY-MM-DD'),
          toDate.format('YYYY-MM-DD'),
        ),
        dateRange: dateRange,
        fromDate: this.utilityService.formatDate(fromDate.format('YYYY-MM-DD')),
        toDate: this.utilityService.formatDate(toDate.format('YYYY-MM-DD')),
        releaseDate: this.utilityService.formatDate(releaseDate),
        cutoffPeriodType: fromDateData.cutoffPeriodType,
      };

      cutoffDates.push(cutoffDate);

      summaryOutput.push({
        dateRange,
        toDateBasis: moment(toDateBasis).format('YYYY-MM-DD'),
      });
    }

    return cutoffDates;
  }

  async getCutoffDateSemiMonthlyCompute(
    id: number,
    currentDate,
    firstCutoffPeriod,
    lastCutoffPeriod,
  ) {
    const currentDay = moment(currentDate).date();
    const cutoffPeriodType =
      currentDay > firstCutoffPeriod && currentDay <= lastCutoffPeriod
        ? CutoffPeriodType.FIRST_PERIOD
        : CutoffPeriodType.LAST_PERIOD;
    const cutoffPeriod =
      cutoffPeriodType === CutoffPeriodType.FIRST_PERIOD
        ? firstCutoffPeriod
        : lastCutoffPeriod;

    let nextCutoffDate = moment(currentDate).date(cutoffPeriod);

    if (currentDay <= firstCutoffPeriod) {
      nextCutoffDate = moment(nextCutoffDate).subtract(1, 'month');
    }

    return { nextCutoffDate, cutoffPeriodType };
  }

  async getCutoffDateWeekly(
    id: number,
    cutoffConfig: CutoffConfigWeekly,
    releaseDay: number,
  ): Promise<CutoffDate[]> {
    const cutoffDates: CutoffDate[] = [];
    const dayMap = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    };
    const cutoffDay = dayMap[cutoffConfig.dayCutoffPeriod];
    const currentDate = this.utilityService.currentDate();

    // Find the most recent cutoff day (on or before today)
    let nextCutoffDate = moment(currentDate).day(cutoffDay);
    if (moment(currentDate).isBefore(nextCutoffDate, 'day')) {
      nextCutoffDate = nextCutoffDate.subtract(1, 'week');
    }

    for (let i = 0; i < 10; i++) {
      const fromDate = moment(nextCutoffDate).subtract(1, 'week').add(1, 'day');
      const toDate = moment(nextCutoffDate).endOf('day');
      const releaseDate = moment(nextCutoffDate).add(releaseDay, 'day');

      // Determine period type
      const firstOfMonth = moment(nextCutoffDate)
        .startOf('month')
        .day(cutoffDay);
      if (firstOfMonth.month() !== nextCutoffDate.month()) {
        firstOfMonth.add(1, 'week');
      }
      const lastOfMonth = moment(nextCutoffDate).endOf('month').day(cutoffDay);
      if (lastOfMonth.month() !== nextCutoffDate.month()) {
        lastOfMonth.subtract(1, 'week');
      }

      let cutoffPeriodType;
      if (nextCutoffDate.isSame(firstOfMonth, 'day')) {
        cutoffPeriodType = CutoffPeriodType.FIRST_PERIOD;
      } else if (nextCutoffDate.isSame(lastOfMonth, 'day')) {
        cutoffPeriodType = CutoffPeriodType.LAST_PERIOD;
      } else {
        cutoffPeriodType = CutoffPeriodType.MIDDLE_PERIOD;
      }

      const dateRange = `${fromDate.format('MMMM DD, YYYY')} - ${toDate.format('MMMM DD, YYYY')}`;

      const cutoffDate: CutoffDate = {
        dateRangeCode: await this.createDateRangeCode(
          id,
          fromDate.format('YYYY-MM-DD'),
          toDate.format('YYYY-MM-DD'),
        ),
        dateRange: dateRange,
        fromDate: this.utilityService.formatDate(fromDate.format('YYYY-MM-DD')),
        toDate: this.utilityService.formatDate(toDate.format('YYYY-MM-DD')),
        releaseDate: this.utilityService.formatDate(
          releaseDate.format('YYYY-MM-DD'),
        ),
        cutoffPeriodType,
      };

      cutoffDates.push(cutoffDate);

      // Move to the previous cutoff date
      nextCutoffDate = moment(nextCutoffDate).subtract(1, 'week');
    }

    return cutoffDates;
  }

  async createDateRangeCode(
    id,
    fromDate: string,
    toDate: string,
  ): Promise<string> {
    const dateRangeCode = `${id}-${moment(fromDate).format('YYYYMMDD')}-${moment(toDate).format('YYYYMMDD')}`;
    return dateRangeCode;
  }
  async formattedResponse(response: Cutoff): Promise<CutoffDataResponse> {
    const cutoffConfig = JSON.parse(response.cutoffConfig.toString());

    return {
      id: response.id,
      cutoffCode: response.cutoffCode,
      cutoffType: response.cutoffType,
      cutoffConfig,
      releaseProcessingDays: response.releaseProcessingDays,
    };
  }
}
