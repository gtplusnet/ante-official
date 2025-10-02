import { Injectable } from '@nestjs/common';
import { BaseTask } from './base.task';
import { PrismaService } from '@common/prisma.service';
import { QueueService } from '@infrastructure/queue/queue/queue.service';
import { QueueType, CutoffDateRangeStatus } from '@prisma/client';
import * as moment from 'moment';

interface ExecutionDetail {
  phase: string;
  message: string;
  data?: any;
  timestamp: Date;
}

@Injectable()
export class TimekeepingDailyProcessingTask extends BaseTask {
  private executionDetails: ExecutionDetail[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {
    super();
  }

  getName(): string {
    return 'timekeeping-daily-processing';
  }

  getDescription(): string {
    return 'Processes uncomputed timekeeping dates and detects attendance conflicts';
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
    this.executionDetails = []; // Reset details
    await this.logStart();

    this.addExecutionDetail(
      'INITIALIZATION',
      'Starting timekeeping daily processing',
      {
        config,
        startTime: new Date(startTime),
      },
    );

    try {
      // Calculate date boundaries for optimization
      const today = moment().startOf('day');
      const yesterday = moment().subtract(1, 'day').startOf('day');

      // Count total active (non-deleted) cutoffs before filtering for metrics
      const totalCutoffsCount = await this.prisma.cutoffDateRange.count({
        where: {
          status: CutoffDateRangeStatus.TIMEKEEPING,
          cutoff: {
            isDeleted: false,
          },
        },
      });

      // Get only relevant cutoff date ranges that could need processing
      const currentCutoffRanges = await this.prisma.cutoffDateRange.findMany({
        where: {
          status: CutoffDateRangeStatus.TIMEKEEPING,
          // Only fetch cutoffs that overlap with our processing window
          startDate: {
            lte: yesterday.toDate(), // Started before or on yesterday
          },
          endDate: {
            gte: yesterday.toDate(), // Ends after or on yesterday
          },
          // Exclude deleted cutoffs
          cutoff: {
            isDeleted: false,
          },
        },
        include: {
          cutoff: {
            include: {
              company: true, // Include company info
            },
          },
        },
      });

      this.addExecutionDetail(
        'FETCH_CUTOFFS',
        `Found ${currentCutoffRanges.length} relevant cutoff date ranges`,
        {
          totalCutoffs: currentCutoffRanges.length,
          cutoffsByCompany: this.groupCutoffsByCompany(currentCutoffRanges),
          performanceMetrics: {
            totalCutoffsInSystem: totalCutoffsCount,
            relevantCutoffs: currentCutoffRanges.length,
            filteredOut: totalCutoffsCount - currentCutoffRanges.length,
            queryOptimization: 'Date-filtered query to reduce database load',
            dateFilter: `Cutoffs overlapping with ${yesterday.format('YYYY-MM-DD')}`,
          },
        },
      );

      const processedCutoffs: any[] = [];
      const skippedCutoffs: any[] = [];

      // Process each cutoff range
      for (const cutoffRange of currentCutoffRanges) {
        try {
          const cutoffStart = moment(cutoffRange.startDate).startOf('day');
          const cutoffEnd = moment(cutoffRange.endDate).startOf('day');

          const cutoffInfo = {
            id: cutoffRange.id,
            company: cutoffRange.cutoff.company?.companyName || 'Unknown',
            cutoffCode: cutoffRange.cutoff.cutoffCode,
            startDate: cutoffStart.format('YYYY-MM-DD'),
            endDate: cutoffEnd.format('YYYY-MM-DD'),
          };

          // Skip if entire cutoff range is in the past
          if (cutoffEnd.isBefore(today)) {
            const skipReason = `Entire cutoff period is in the past (${cutoffStart.format('YYYY-MM-DD')} to ${cutoffEnd.format('YYYY-MM-DD')})`;
            this.addExecutionDetail(
              'SKIP_CUTOFF',
              `Skipping cutoff ${cutoffRange.id}`,
              {
                ...cutoffInfo,
                reason: skipReason,
              },
            );
            skippedCutoffs.push({ ...cutoffInfo, reason: skipReason });
            continue;
          }

          // Skip if cutoff hasn't started yet
          if (cutoffStart.isAfter(yesterday)) {
            const skipReason = 'Cutoff period has not started yet';
            this.addExecutionDetail(
              'SKIP_CUTOFF',
              `Skipping cutoff ${cutoffRange.id}`,
              {
                ...cutoffInfo,
                reason: skipReason,
              },
            );
            skippedCutoffs.push({ ...cutoffInfo, reason: skipReason });
            continue;
          }

          // Process only dates within cutoff range and up to yesterday
          const processFromDate = cutoffStart;
          const processUpToDate = moment.min(yesterday, cutoffEnd);

          // Check if there are unprocessed dates in this valid range
          const checkResult = await this.checkUnprocessedDatesDetailed(
            cutoffRange.id,
            processFromDate.format('YYYY-MM-DD'),
            processUpToDate.format('YYYY-MM-DD'),
          );

          this.addExecutionDetail(
            'CHECK_UNPROCESSED',
            `Checked cutoff ${cutoffRange.id}`,
            {
              ...cutoffInfo,
              employeeCount: checkResult.employeeCount,
              expectedRecords: checkResult.expectedRecords,
              computedRecords: checkResult.computedRecords,
              unprocessedRecords: checkResult.unprocessedRecords,
              hasUnprocessedDates: checkResult.hasUnprocessedDates,
              debug: {
                expectedVsComputed: `${checkResult.expectedRecords} vs ${checkResult.computedRecords}`,
                shouldSkip: !checkResult.hasUnprocessedDates,
              },
            },
          );

          if (!checkResult.hasUnprocessedDates) {
            const skipReason =
              checkResult.employeeCount === 0
                ? 'No employees assigned to this cutoff'
                : 'All dates are already processed';
            skippedCutoffs.push({ ...cutoffInfo, reason: skipReason });
            continue;
          }

          // Calculate processing metrics
          const dayCount = processUpToDate.diff(processFromDate, 'days') + 1;
          const detectConflicts = config.detectConflicts ?? true;
          const processOnlyUncomputed = config.processOnlyUncomputed ?? true;

          // Add detailed queue creation decision
          this.addExecutionDetail(
            'QUEUE_DECISION',
            `Queue creation decision for ${cutoffRange.id}`,
            {
              ...cutoffInfo,
              decisionFactors: {
                dateRangeReason: `Processing ${dayCount} days from ${processFromDate.format('YYYY-MM-DD')} to ${processUpToDate.format('YYYY-MM-DD')}`,
                employeeReason: `${checkResult.employeeCount} active employees need timekeeping computation`,
                recordsReason: `${checkResult.unprocessedRecords} timekeeping records need to be created/computed`,
                conflictDetectionReason: detectConflicts
                  ? 'Attendance conflict detection enabled for missing logs and missing time-outs'
                  : 'Attendance conflict detection disabled',
                processingStrategy: processOnlyUncomputed
                  ? 'Only processing dates without existing computed records'
                  : 'Reprocessing all dates in range',
              },
              businessJustification: [
                'Daily timekeeping records are required for accurate payroll computation',
                'Conflicts must be detected early to allow HR to address attendance issues',
                'Processing happens at end of day to capture all clock-ins/outs for the day',
                `Processing window ensures we don't miss any employee time logs`,
              ],
              queuePriority: {
                reason: 'Standard priority - daily scheduled task',
                urgency: 'Normal - part of regular end-of-day processing',
              },
            },
          );

          // Create queue job for this cutoff range
          const companyName = cutoffRange.cutoff.company?.companyName || 'All';
          const queueName = `Daily Timekeeping Processing - ${companyName} - ${cutoffRange.cutoff.cutoffCode} (${processFromDate.format('MMM DD')} to ${processUpToDate.format('MMM DD, YYYY')})`;

          const queueSettings = {
            cutoffDateRangeId: cutoffRange.id,
            processOnlyUncomputed: config.processOnlyUncomputed ?? true,
            detectConflicts: config.detectConflicts ?? true,
            processFromDate: processFromDate.format('YYYY-MM-DD'),
            processUpToDate: processUpToDate.format('YYYY-MM-DD'),
            conflictTypes: config.conflictTypes || [
              'MISSING_LOG',
              'MISSING_TIME_OUT',
            ],
          };

          const queue = await this.queueService.createQueue({
            name: queueName,
            type: QueueType.TIMEKEEPING_PROCESSING,
            queueSettings,
          });

          this.addExecutionDetail(
            'CREATE_QUEUE',
            `Created queue job for cutoff ${cutoffRange.id}`,
            {
              ...cutoffInfo,
              queueId: queue.id,
              queueName,
              processFromDate: processFromDate.format('YYYY-MM-DD'),
              processUpToDate: processUpToDate.format('YYYY-MM-DD'),
              queueSettings,
              queueReason: `Processing ${checkResult.unprocessedRecords} records for ${checkResult.employeeCount} employees over ${dayCount} days`,
            },
          );

          processedCutoffs.push({
            ...cutoffInfo,
            queueId: queue.id,
            queueName,
            dateRange: `${processFromDate.format('YYYY-MM-DD')} to ${processUpToDate.format('YYYY-MM-DD')}`,
            employeeCount: checkResult.employeeCount,
            recordsToProcess: checkResult.unprocessedRecords,
          });
        } catch (error) {
          this.addExecutionDetail(
            'ERROR',
            `Error processing cutoff ${cutoffRange.id}`,
            {
              cutoffId: cutoffRange.id,
              error: error.message,
            },
          );
          this.logger.error(
            `Error processing cutoff ${cutoffRange.id}: ${error.message}`,
          );
        }
      }

      const duration = Date.now() - startTime;

      // Summary
      this.addExecutionDetail(
        'SUMMARY',
        'Timekeeping daily processing completed',
        {
          duration,
          totalCutoffs: currentCutoffRanges.length,
          processedCount: processedCutoffs.length,
          skippedCount: skippedCutoffs.length,
          processedCutoffs,
          skippedCutoffs,
        },
      );

      await this.logComplete(duration);

      // Return detailed execution log
      return JSON.stringify(this.executionDetails, null, 2);
    } catch (error) {
      this.addExecutionDetail(
        'FATAL_ERROR',
        'Fatal error in timekeeping daily processing',
        {
          error: error.message,
          stack: error.stack,
        },
      );
      await this.logError(error);
      throw error;
    }
  }

  private groupCutoffsByCompany(cutoffRanges: any[]): Record<string, number> {
    return cutoffRanges.reduce(
      (acc, cr) => {
        const companyName = cr.cutoff.company?.companyName || 'No Company';
        acc[companyName] = (acc[companyName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private async checkUnprocessedDates(
    cutoffDateRangeId: string,
    startDate: string,
    endDate: string,
  ): Promise<boolean> {
    // Get count of employees with timekeeping cutoff for this range
    const employeeCount = await this.prisma.employeeTimekeepingCutoff.count({
      where: {
        cutoffDateRangeId,
        account: {
          EmployeeData: {
            isActive: true,
          },
        },
      },
    });

    if (employeeCount === 0) {
      return false; // No employees to process
    }

    // Calculate expected number of timekeeping records
    const start = moment(startDate);
    const end = moment(endDate);
    const dayCount = end.diff(start, 'days') + 1;
    const expectedRecords = employeeCount * dayCount;

    // Get actual computed records for active employees only
    // Note: We need to count records that have a computed entry via direct SQL
    // because Prisma's relation is not working as expected for this query
    const computedRecordsResult = await this.prisma.$queryRaw<
      { count: bigint }[]
    >`
      SELECT COUNT(DISTINCT et.id) as count
      FROM "EmployeeTimekeeping" et
      JOIN "EmployeeTimekeepingComputed" etc2 ON et.id = etc2."timekeepingId"
      WHERE et."employeeTimekeepingCutoffId" IN (
        SELECT etc.id 
        FROM "EmployeeTimekeepingCutoff" etc
        JOIN "Account" a ON etc."accountId" = a.id
        JOIN "EmployeeData" ed ON a.id = ed."accountId"
        WHERE etc."cutoffDateRangeId" = ${cutoffDateRangeId}
        AND ed."isActive" = true
      )
      AND et."dateString" >= ${startDate}
      AND et."dateString" <= ${endDate}
    `;

    const computedRecords = Number(computedRecordsResult[0].count);

    // If we have fewer computed records than expected, there are unprocessed dates
    return computedRecords < expectedRecords;
  }

  private async checkUnprocessedDatesDetailed(
    cutoffDateRangeId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    employeeCount: number;
    expectedRecords: number;
    computedRecords: number;
    unprocessedRecords: number;
    hasUnprocessedDates: boolean;
  }> {
    // Get count of employees with timekeeping cutoff for this range
    const employeeCount = await this.prisma.employeeTimekeepingCutoff.count({
      where: {
        cutoffDateRangeId,
        account: {
          EmployeeData: {
            isActive: true,
          },
        },
      },
    });

    if (employeeCount === 0) {
      return {
        employeeCount: 0,
        expectedRecords: 0,
        computedRecords: 0,
        unprocessedRecords: 0,
        hasUnprocessedDates: false,
      };
    }

    // Calculate expected number of timekeeping records
    const start = moment(startDate);
    const end = moment(endDate);
    const dayCount = end.diff(start, 'days') + 1;
    const expectedRecords = employeeCount * dayCount;

    // Get actual computed records for active employees only
    // Note: We need to count records that have a computed entry via direct SQL
    // because Prisma's relation is not working as expected for this query
    const computedRecordsResult = await this.prisma.$queryRaw<
      { count: bigint }[]
    >`
      SELECT COUNT(DISTINCT et.id) as count
      FROM "EmployeeTimekeeping" et
      JOIN "EmployeeTimekeepingComputed" etc2 ON et.id = etc2."timekeepingId"
      WHERE et."employeeTimekeepingCutoffId" IN (
        SELECT etc.id 
        FROM "EmployeeTimekeepingCutoff" etc
        JOIN "Account" a ON etc."accountId" = a.id
        JOIN "EmployeeData" ed ON a.id = ed."accountId"
        WHERE etc."cutoffDateRangeId" = ${cutoffDateRangeId}
        AND ed."isActive" = true
      )
      AND et."dateString" >= ${startDate}
      AND et."dateString" <= ${endDate}
    `;

    const computedRecords = Number(computedRecordsResult[0].count);

    const unprocessedRecords = expectedRecords - computedRecords;
    const hasUnprocessedDates = computedRecords < expectedRecords;

    // Debug logging
    this.logger.log(
      `[DEBUG] Cutoff ${cutoffDateRangeId}: Expected=${expectedRecords}, Computed=${computedRecords}, Unprocessed=${unprocessedRecords}, HasUnprocessed=${hasUnprocessedDates}`,
    );

    return {
      employeeCount,
      expectedRecords,
      computedRecords,
      unprocessedRecords,
      hasUnprocessedDates,
    };
  }
}
