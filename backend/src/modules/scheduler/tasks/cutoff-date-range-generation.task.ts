import { Injectable, Inject } from '@nestjs/common';
import { BaseTask } from './base.task';
import { PrismaService } from '@common/prisma.service';
import { CutoffConfigurationService } from '@modules/hr/configuration/cutoff-configuration/cutoff-configuration.service';
import { CutoffType, CutoffPeriodType, Cutoff } from '@prisma/client';
import * as moment from 'moment';

interface ExecutionDetail {
  phase: string;
  message: string;
  data?: any;
  timestamp: Date;
}

interface CutoffDate {
  dateRangeCode: string;
  dateRange: string;
  fromDate: any;
  toDate: any;
  releaseDate: any;
  cutoffPeriodType: CutoffPeriodType;
}

interface CutoffConfigWeekly {
  dayCutoffPeriod: string;
}

interface CutoffConfigMonthly {
  cutoffPeriod: number;
}

interface CutoffConfigSemiMonthly {
  firstCutoffPeriod: number;
  lastCutoffPeriod: number;
}

@Injectable()
export class CutoffDateRangeGenerationTask extends BaseTask {
  private executionDetails: ExecutionDetail[] = [];

  constructor(
    @Inject() private readonly prisma: PrismaService,
    @Inject()
    private readonly cutoffConfigurationService: CutoffConfigurationService,
  ) {
    super();
  }

  getName(): string {
    return 'cutoff-date-range-generation';
  }

  getDescription(): string {
    return 'Ensures cutoff date ranges exist 1 day in advance';
  }

  private addExecutionDetail(phase: string, message: string, data?: any) {
    const detail: ExecutionDetail = {
      phase,
      message,
      data,
      timestamp: new Date(),
    };
    this.executionDetails.push(detail);
    this.logger.log(`[${phase}] ${message}`);
  }

  async execute(config: Record<string, any>): Promise<string> {
    const startTime = Date.now();
    this.executionDetails = [];
    await this.logStart();

    this.addExecutionDetail(
      'INITIALIZATION',
      'Starting cutoff date range generation for all companies',
      {
        config,
        startTime: new Date(startTime),
      },
    );

    try {
      // Fetch all active companies
      const companies = await this.prisma.company.findMany({
        where: {
          // Add any filters if needed (e.g., active companies only)
        },
        orderBy: {
          companyName: 'asc',
        },
      });

      this.addExecutionDetail(
        'COMPANIES_FOUND',
        `Found ${companies.length} companies to process`,
      );

      const companyResults = {
        processed: 0,
        skipped: 0,
        failed: 0,
        totalCutoffsProcessed: 0,
        totalRangesCreated: 0,
        details: [] as any[],
      };

      // Process each company
      for (const company of companies) {
        try {
          this.addExecutionDetail(
            'PROCESS_COMPANY',
            `Processing company: ${company.companyName}`,
            {
              companyId: company.id,
              companyName: company.companyName,
            },
          );

          const result = await this.processCompanyCutoffs(company);

          companyResults.processed++;
          companyResults.totalCutoffsProcessed += result.cutoffsProcessed;
          companyResults.totalRangesCreated += result.rangesCreated;
          companyResults.details.push(result);

          this.addExecutionDetail(
            'COMPANY_COMPLETE',
            `Completed processing for ${company.companyName}`,
            {
              companyId: company.id,
              cutoffsProcessed: result.cutoffsProcessed,
              rangesCreated: result.rangesCreated,
            },
          );
        } catch (error) {
          companyResults.failed++;
          const errorDetail = {
            companyId: company.id,
            companyName: company.companyName,
            error: error.message,
            cutoffsProcessed: 0,
            rangesCreated: 0,
          };
          companyResults.details.push(errorDetail);

          this.addExecutionDetail(
            'COMPANY_ERROR',
            `Error processing company ${company.companyName}`,
            {
              companyId: company.id,
              error: error.message,
              stack: error.stack,
            },
          );
        }
      }

      const duration = Date.now() - startTime;
      this.addExecutionDetail(
        'COMPLETE',
        'Cutoff date range generation completed for all companies',
        {
          duration,
          companiesProcessed: companyResults.processed,
          companiesFailed: companyResults.failed,
          totalCutoffsProcessed: companyResults.totalCutoffsProcessed,
          totalRangesCreated: companyResults.totalRangesCreated,
          executionDetails: this.executionDetails.length,
        },
      );

      await this.logComplete(duration);
      return JSON.stringify(
        {
          summary: companyResults,
          executionDetails: this.executionDetails,
        },
        null,
        2,
      );
    } catch (error) {
      this.addExecutionDetail(
        'FATAL_ERROR',
        'Fatal error in cutoff date range generation',
        {
          error: error.message,
          stack: error.stack,
        },
      );
      await this.logError(error);
      throw error;
    }
  }

  private async processCompanyCutoffs(company: {
    id: number;
    companyName: string;
  }): Promise<{
    companyId: number;
    companyName: string;
    cutoffsProcessed: number;
    rangesCreated: number;
    skipped: number;
  }> {
    const result = {
      companyId: company.id,
      companyName: company.companyName,
      cutoffsProcessed: 0,
      rangesCreated: 0,
      skipped: 0,
    };

    // Tomorrow's date for checking coverage
    const tomorrow = moment().add(1, 'day').startOf('day');

    // Get all cutoffs for the company
    const cutoffs = await this.prisma.cutoff.findMany({
      where: {
        companyId: company.id,
        isDeleted: false,
      },
    });

    this.addExecutionDetail(
      'CUTOFFS_FOUND',
      `Found ${cutoffs.length} cutoffs for ${company.companyName}`,
      {
        companyId: company.id,
        cutoffCount: cutoffs.length,
      },
    );

    for (const cutoff of cutoffs) {
      try {
        result.cutoffsProcessed++;

        // Check if tomorrow is already covered for THIS SPECIFIC cutoff
        const tomorrowCovered = await this.prisma.cutoffDateRange.findFirst({
          where: {
            cutoffId: cutoff.id,
            startDate: { lte: tomorrow.toDate() },
            endDate: { gte: tomorrow.toDate() },
          },
        });

        if (tomorrowCovered) {
          this.addExecutionDetail(
            'CUTOFF_TOMORROW_COVERED',
            `Tomorrow is already covered for cutoff ${cutoff.cutoffCode} (${company.companyName})`,
            {
              companyId: company.id,
              cutoffId: cutoff.id,
              cutoffCode: cutoff.cutoffCode,
              cutoffDateRangeId: tomorrowCovered.id,
              startDate: tomorrowCovered.startDate,
              endDate: tomorrowCovered.endDate,
            },
          );
          continue; // Skip this cutoff as it's already covered
        }

        // Generate dates using tomorrow as base date
        let futureDates: CutoffDate[] = [];

        try {
          futureDates = await this.getCutoffDatesForDate(
            cutoff,
            tomorrow.format('YYYY-MM-DD'),
          );
        } catch (dateError) {
          this.addExecutionDetail(
            'DATE_GENERATION_ERROR',
            `Error generating dates for cutoff ${cutoff.cutoffCode} (${company.companyName})`,
            {
              companyId: company.id,
              error: dateError.message,
              cutoffType: cutoff.cutoffType,
              cutoffConfig: cutoff.cutoffConfig,
            },
          );
          continue;
        }

        // Find and create the period that covers tomorrow
        for (const cutoffDate of futureDates) {
          const fromDate = moment(cutoffDate.fromDate.raw);
          const toDate = moment(cutoffDate.toDate.raw);

          if (
            fromDate.isSameOrBefore(tomorrow) &&
            toDate.isSameOrAfter(tomorrow)
          ) {
            const exists = await this.prisma.cutoffDateRange.findUnique({
              where: { id: cutoffDate.dateRangeCode },
            });

            if (!exists) {
              await this.prisma.cutoffDateRange.create({
                data: {
                  id: cutoffDate.dateRangeCode,
                  cutoffId: cutoff.id,
                  startDate: new Date(cutoffDate.fromDate.raw),
                  endDate: new Date(cutoffDate.toDate.raw),
                  processingDate: new Date(cutoffDate.releaseDate.raw),
                  cutoffPeriodType: cutoffDate.cutoffPeriodType,
                  status: 'TIMEKEEPING',
                },
              });

              result.rangesCreated++;
              this.addExecutionDetail(
                'CREATED_RANGE',
                `Created date range for ${company.companyName} - ${cutoff.cutoffCode}`,
                {
                  companyId: company.id,
                  dateRangeCode: cutoffDate.dateRangeCode,
                  dateRange: cutoffDate.dateRange,
                  cutoffType: cutoff.cutoffType,
                },
              );
            } else {
              this.addExecutionDetail(
                'RANGE_EXISTS',
                `Date range already exists for ${company.companyName} - ${cutoff.cutoffCode}`,
                {
                  companyId: company.id,
                  dateRangeCode: cutoffDate.dateRangeCode,
                },
              );
            }
            break; // Only need one future period per cutoff
          }
        }
      } catch (error) {
        this.addExecutionDetail(
          'CUTOFF_ERROR',
          `Error processing cutoff ${cutoff.cutoffCode} for ${company.companyName}`,
          {
            companyId: company.id,
            cutoffId: cutoff.id,
            error: error.message,
          },
        );
      }
    }

    return result;
  }

  private async getCutoffDatesForDate(
    cutoff: Cutoff,
    baseDate: string,
  ): Promise<CutoffDate[]> {
    const cutoffConfig = JSON.parse(cutoff.cutoffConfig.toString());

    // Normalize config for consistency
    const normalizedConfig = this.normalizeCutoffConfig(
      cutoffConfig,
      cutoff.cutoffType,
    );

    switch (cutoff.cutoffType) {
      case CutoffType.MONTHLY:
        return await this.getCutoffDateMonthlyForDate(
          cutoff.id,
          normalizedConfig,
          cutoff.releaseProcessingDays,
          baseDate,
        );
      case CutoffType.WEEKLY:
        return await this.getCutoffDateWeeklyForDate(
          cutoff.id,
          normalizedConfig,
          cutoff.releaseProcessingDays,
          baseDate,
        );
      case CutoffType.SEMIMONTHLY:
        return await this.getCutoffDateSemiMonthlyForDate(
          cutoff.id,
          normalizedConfig,
          cutoff.releaseProcessingDays,
          baseDate,
        );
      default:
        throw new Error(`Unknown cutoff type: ${cutoff.cutoffType}`);
    }
  }

  private formatDate(dateValue: string | Date): any {
    const dateTime = moment(dateValue).format('MM/DD/YYYY (hh:mm A)');
    const dateStandard = moment(dateValue).format('YYYY-MM-DD');
    const time = moment(dateValue).format('hh:mm A');
    const time24 = moment(dateValue).format('HH:mm');
    const date = moment(dateValue).format('MM/DD/YYYY');
    const dateFull = moment(dateValue).format('MMMM D, YYYY');
    const timeAgo = moment(dateValue).fromNow();
    const day = moment(dateValue).format('dddd');
    const daySmall = moment(dateValue).format('ddd');
    const raw = moment(dateValue).toISOString();

    return {
      dateTime,
      dateStandard,
      time,
      time24,
      date,
      dateFull,
      timeAgo,
      day,
      daySmall,
      raw,
    };
  }

  private async getCutoffDateWeeklyForDate(
    id: number,
    cutoffConfig: CutoffConfigWeekly,
    releaseDay: number,
    baseDate: string,
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
    const currentDate = baseDate; // Use provided date instead of current

    // Find the most recent cutoff day (on or before the base date)
    let nextCutoffDate = moment(currentDate).day(cutoffDay);
    if (moment(currentDate).isBefore(nextCutoffDate, 'day')) {
      nextCutoffDate = nextCutoffDate.subtract(1, 'week');
    }

    // Generate a few periods to ensure we cover tomorrow
    for (let i = 0; i < 3; i++) {
      const fromDate = moment(nextCutoffDate).subtract(1, 'week').add(1, 'day');
      const toDate = moment(nextCutoffDate).endOf('day');
      const releaseDate = moment(nextCutoffDate).add(releaseDay, 'day');

      // Determine period type (week of month calculation for future use)
      const _weekOfMonth = Math.ceil(nextCutoffDate.date() / 7);
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
        fromDate: this.formatDate(fromDate.format('YYYY-MM-DD')),
        toDate: this.formatDate(toDate.format('YYYY-MM-DD')),
        releaseDate: this.formatDate(releaseDate.format('YYYY-MM-DD')),
        cutoffPeriodType,
      };

      cutoffDates.push(cutoffDate);

      // Move to the next cutoff date
      nextCutoffDate = moment(nextCutoffDate).add(1, 'week');
    }

    return cutoffDates;
  }

  private async getCutoffDateMonthlyForDate(
    id: number,
    cutoffConfig: CutoffConfigMonthly,
    releaseDay: number,
    baseDate: string,
  ): Promise<CutoffDate[]> {
    try {
      const cutoffDates: CutoffDate[] = [];
      const { cutoffPeriod } = cutoffConfig;

      this.logger.log(
        `getCutoffDateMonthlyForDate - cutoffPeriod: ${cutoffPeriod}, baseDate: ${baseDate}`,
      );

      // Create initial date and ensure it's a valid moment object
      let nextCutoffDate = moment(baseDate);

      // Check if cutoffPeriod is valid (0 means last day of month)
      if (
        cutoffPeriod === null ||
        cutoffPeriod === undefined ||
        cutoffPeriod < 0 ||
        cutoffPeriod > 31
      ) {
        throw new Error(`Invalid cutoffPeriod: ${cutoffPeriod}`);
      }

      // Set the date - handle month boundaries and special cases
      if (cutoffPeriod === 0) {
        // 0 means last day of month
        nextCutoffDate = nextCutoffDate.endOf('month').startOf('day');
      } else if (cutoffPeriod > nextCutoffDate.daysInMonth()) {
        // If cutoff period is beyond the days in month, set to last day
        nextCutoffDate = nextCutoffDate.endOf('month').startOf('day');
      } else {
        nextCutoffDate = nextCutoffDate.date(cutoffPeriod);
      }

      if (nextCutoffDate.isBefore(moment(baseDate), 'day')) {
        nextCutoffDate = nextCutoffDate.add(1, 'month');
        // Re-check month boundary after adding month
        if (cutoffPeriod === 0) {
          nextCutoffDate = nextCutoffDate.endOf('month').startOf('day');
        } else if (cutoffPeriod > nextCutoffDate.daysInMonth()) {
          nextCutoffDate = nextCutoffDate.endOf('month').startOf('day');
        } else {
          nextCutoffDate = nextCutoffDate.date(cutoffPeriod);
        }
      }

      // Generate a few periods to ensure we cover tomorrow
      for (let i = 0; i < 3; i++) {
        // Important: Clone nextCutoffDate before any operations to avoid mutations
        const currentCutoffDate = moment(nextCutoffDate);

        // Calculate dates for this period - use clones to avoid mutations
        const fromDate = currentCutoffDate
          .clone()
          .subtract(1, 'month')
          .add(1, 'day')
          .format('YYYY-MM-DD');
        const toDate = currentCutoffDate
          .clone()
          .endOf('day')
          .format('YYYY-MM-DD HH:mm:ss');
        const releaseDate = currentCutoffDate
          .clone()
          .add(releaseDay, 'day')
          .format('YYYY-MM-DD');
        const dateRange = `${moment(fromDate).format('MMMM DD, YYYY')} - ${moment(toDate).format('MMMM DD, YYYY')}`;

        const cutoffDate: CutoffDate = {
          dateRangeCode: await this.createDateRangeCode(id, fromDate, toDate),
          dateRange: dateRange,
          fromDate: this.formatDate(fromDate),
          toDate: this.formatDate(toDate),
          releaseDate: this.formatDate(releaseDate),
          cutoffPeriodType: CutoffPeriodType.LAST_PERIOD,
        };

        cutoffDates.push(cutoffDate);

        // Move to the next cutoff date - now safe to mutate as we're done with calculations
        nextCutoffDate.add(1, 'month');

        // Handle month boundaries for next iteration
        if (cutoffPeriod === 0) {
          nextCutoffDate = nextCutoffDate.endOf('month').startOf('day');
        } else if (cutoffPeriod > nextCutoffDate.daysInMonth()) {
          nextCutoffDate = nextCutoffDate.endOf('month').startOf('day');
        } else {
          nextCutoffDate = nextCutoffDate.date(cutoffPeriod);
        }

        this.logger.log(`Generated period ${i + 1}: ${dateRange}`);
      }

      return cutoffDates;
    } catch (error) {
      this.logger.error(
        `Error in getCutoffDateMonthlyForDate: ${error.message}`,
        error.stack,
      );
      this.logger.error(
        `Input parameters - id: ${id}, releaseDay: ${releaseDay}, baseDate: ${baseDate}`,
      );
      this.logger.error(`cutoffConfig: ${JSON.stringify(cutoffConfig)}`);
      throw error;
    }
  }

  private async getCutoffDateSemiMonthlyForDate(
    id: number,
    cutoffConfig: CutoffConfigSemiMonthly,
    releaseDay: number,
    baseDate: string,
  ): Promise<CutoffDate[]> {
    try {
      const cutoffDates: CutoffDate[] = [];
      const { firstCutoffPeriod, lastCutoffPeriod } = cutoffConfig;
      let currentDate = baseDate; // Use provided date

      // Skip if periods are invalid
      if (
        !firstCutoffPeriod ||
        !lastCutoffPeriod ||
        firstCutoffPeriod === 0 ||
        lastCutoffPeriod === 0
      ) {
        this.logger.warn(
          `Invalid semi-monthly periods: first=${firstCutoffPeriod}, last=${lastCutoffPeriod}`,
        );
        return cutoffDates;
      }

      // Generate a few periods to ensure we cover tomorrow
      for (let i = 0; i < 3; i++) {
        const fromDateData = await this.getCutoffDateSemiMonthlyCompute(
          currentDate,
          firstCutoffPeriod,
          lastCutoffPeriod,
        );
        const fromDate = moment(fromDateData.nextCutoffDate);

        const toDateBasis = moment(fromDate).add(25, 'days');
        const toDateData = await this.getCutoffDateSemiMonthlyCompute(
          toDateBasis.format('YYYY-MM-DD'),
          firstCutoffPeriod,
          lastCutoffPeriod,
        );
        const toDate = moment(toDateData.nextCutoffDate).subtract(1, 'day');
        const releaseDate = moment(toDate)
          .add(releaseDay, 'days')
          .format('YYYY-MM-DD');
        const dateRange = `${moment(fromDate).format('MMMM DD, YYYY')} - ${moment(toDate).format('MMMM DD, YYYY')} (${fromDateData.cutoffPeriodType})`;

        currentDate = moment(fromDate).add(1, 'day').format('YYYY-MM-DD');

        const cutoffDate: CutoffDate = {
          dateRangeCode: await this.createDateRangeCode(
            id,
            fromDate.format('YYYY-MM-DD'),
            toDate.format('YYYY-MM-DD'),
          ),
          dateRange: dateRange,
          fromDate: this.formatDate(fromDate.format('YYYY-MM-DD')),
          toDate: this.formatDate(toDate.format('YYYY-MM-DD')),
          releaseDate: this.formatDate(releaseDate),
          cutoffPeriodType: fromDateData.cutoffPeriodType,
        };

        cutoffDates.push(cutoffDate);
      }

      return cutoffDates;
    } catch (error) {
      this.logger.error(
        `Error in getCutoffDateSemiMonthlyForDate: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async getCutoffDateSemiMonthlyCompute(
    currentDate: string,
    firstCutoffPeriod: number,
    lastCutoffPeriod: number,
  ) {
    try {
      const currentDay = moment(currentDate).date();
      const cutoffPeriodType =
        currentDay > firstCutoffPeriod && currentDay <= lastCutoffPeriod
          ? CutoffPeriodType.FIRST_PERIOD
          : CutoffPeriodType.LAST_PERIOD;
      const cutoffPeriod =
        cutoffPeriodType === CutoffPeriodType.FIRST_PERIOD
          ? firstCutoffPeriod
          : lastCutoffPeriod;

      // Handle special case where cutoffPeriod is 0 (last day of month)
      let nextCutoffDate;
      if (cutoffPeriod === 0) {
        nextCutoffDate = moment(currentDate).endOf('month').startOf('day');
      } else {
        nextCutoffDate = moment(currentDate);
        if (cutoffPeriod > nextCutoffDate.daysInMonth()) {
          nextCutoffDate = nextCutoffDate.endOf('month').startOf('day');
        } else {
          nextCutoffDate = nextCutoffDate.date(cutoffPeriod);
        }
      }

      if (currentDay <= firstCutoffPeriod) {
        nextCutoffDate = nextCutoffDate.subtract(1, 'month');
      }

      return {
        nextCutoffDate: nextCutoffDate.format('YYYY-MM-DD'),
        cutoffPeriodType,
      };
    } catch (error) {
      this.logger.error(
        `Error in getCutoffDateSemiMonthlyCompute: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async createDateRangeCode(
    id: number,
    fromDate: string,
    toDate: string,
  ): Promise<string> {
    const dateRangeCode = `${id}-${moment(fromDate).format('YYYYMMDD')}-${moment(toDate).format('YYYYMMDD')}`;
    return dateRangeCode;
  }

  private normalizeCutoffConfig(config: any, cutoffType: CutoffType): any {
    const normalized = { ...config };

    switch (cutoffType) {
      case CutoffType.WEEKLY:
        // Handle both cutoffDay and dayCutoffPeriod
        if (config.cutoffDay && !config.dayCutoffPeriod) {
          normalized.dayCutoffPeriod = config.cutoffDay;
        }
        break;

      case CutoffType.MONTHLY:
        // Convert string values to numbers
        if (typeof config.cutoffPeriod === 'string') {
          if (
            config.cutoffPeriod === 'Last Day' ||
            config.cutoffPeriod === ''
          ) {
            normalized.cutoffPeriod = 0;
          } else {
            // Extract number from strings like "6th", "22nd", etc.
            const match = config.cutoffPeriod.match(/\d+/);
            normalized.cutoffPeriod = match ? parseInt(match[0]) : 0;
          }
        }
        break;

      case CutoffType.SEMIMONTHLY:
        // Handle lastCutOffPeriod vs lastCutoffPeriod
        if (
          config.lastCutOffPeriod !== undefined &&
          config.lastCutoffPeriod === undefined
        ) {
          normalized.lastCutoffPeriod = config.lastCutOffPeriod;
        }

        // Convert string values to numbers
        ['firstCutoffPeriod', 'lastCutoffPeriod'].forEach((field) => {
          const value = normalized[field];

          if (typeof value === 'string') {
            if (value === 'Last Day' || value === '') {
              normalized[field] = 0;
            } else {
              const match = value.match(/\d+/);
              normalized[field] = match ? parseInt(match[0]) : 0;
            }
          } else if (typeof value === 'object' && value?.key !== undefined) {
            // Handle object format: { key: 12, label: '12th' }
            normalized[field] = value.key;
          }
        });
        break;
    }

    return normalized;
  }
}
