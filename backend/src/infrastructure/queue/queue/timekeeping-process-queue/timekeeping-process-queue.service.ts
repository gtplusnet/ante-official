import { Inject, Injectable } from '@nestjs/common';
import { QueueAbstract } from '../queue.abstract';
import { UtilityService } from '@common/utility.service';
import { PrismaService } from '@common/prisma.service';
import { TimekeepingGroupingService } from '@modules/hr/computation/hris-computation/timekeeping-grouping/timekeeping-grouping.service';
import { TimekeepingComputationService } from '@modules/hr/computation/hris-computation/timekeeping-computation/timekeeping-computation.service';
import { ModuleRef } from '@nestjs/core';
import { EmployeeListService } from '@modules/hr/employee/employee-list/employee-list.service';
import { QueueLogMongoService } from '@common/services/queue-log-mongo.service';
import { QueueMongoService } from '@common/services/queue-mongo.service';
import { DateFormat } from '../../../../shared/response';
import * as moment from 'moment';

@Injectable()
export class TimekeepingProcessQueueService extends QueueAbstract {
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly moduleRef: ModuleRef;
  @Inject() private readonly employeeListService: EmployeeListService;
  @Inject() private readonly queueMongoService: QueueMongoService;
  @Inject() private readonly queueLogMongoService: QueueLogMongoService;

  async processPendingQueue(queueData): Promise<void> {
    const cutoffDateRangeId = queueData.queueSettings['cutoffDateRangeId'];
    const processOnlyUncomputed =
      queueData.queueSettings['processOnlyUncomputed'] ?? false;
    const processFromDate = queueData.queueSettings['processFromDate'];
    const processUpToDate = queueData.queueSettings['processUpToDate'];

    this.utilityService.log(
      `Initializing computation of timekeeping -- Queue #${queueData.id} started. The cutoff date range is ${cutoffDateRangeId}.`,
    );
    this.utilityService.log(
      `Options: processOnlyUncomputed=${processOnlyUncomputed}, processFromDate=${processFromDate}, processUpToDate=${processUpToDate}`,
    );

    // Get the cutoff date range information
    const cutoffDataRange = await this.prisma.cutoffDateRange.findUnique({
      where: {
        id: cutoffDateRangeId,
      },
    });

    // Get list of employees for the given cutoff date range (ALL companies)
    const employeeList =
      await this.employeeListService.getEmployeeListByPayrollByCutoffForAllCompanies(
        cutoffDataRange.cutoffId,
      );

    if (!employeeList) {
      this.utilityService.error(
        `No employees found for cutoff date range ID ${cutoffDataRange.id}.`,
      );
      return;
    }

    // Filter only active employees
    const activeEmployees = employeeList.filter((emp) => emp.isActive);
    this.utilityService.log(
      `Found ${activeEmployees.length} active employees out of ${employeeList.length} total employees`,
    );

    // Record on queue log
    await Promise.all(
      activeEmployees.map(async (employee) => {
        const accountInformation = await this.prisma.account.findUnique({
          where: {
            id: employee.accountId,
          },
          include: {
            company: true, // Include company info
          },
        });

        const capitalize = (s: string) =>
          s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        const fullName = `${capitalize(accountInformation.firstName)} ${capitalize(accountInformation.lastName)}`;
        const companyName =
          accountInformation.company?.companyName || 'No Company';

        return this.queueLogMongoService.create({
          queueId: String(queueData.id),
          params: {
            employeeAccountId: employee.accountId,
            cutoffDateRangeId: cutoffDataRange.id,
            companyId: accountInformation.company?.id || null, // Store companyId for background processing
            processOnlyUncomputed,
            processFromDate,
            processUpToDate,
          },
          message: `Processing Timekeeping of ${fullName} (${companyName})`,
        });
      }),
    );

    await this.queueMongoService.update(String(queueData.id), {
      totalCount: activeEmployees.length,
    });

    this.utilityService.log(
      `Done Initializing computation of timekeeping -- Queue #${queueData.id} finished.`,
    );
  }

  async processQueueLog(queueLog): Promise<void> {
    const params = queueLog.params;
    const employeeAccountId = params['employeeAccountId'];
    const cutoffDateRangeId = params['cutoffDateRangeId'];
    const processOnlyUncomputed = params['processOnlyUncomputed'] ?? false;
    const processFromDate = params['processFromDate'];
    const processUpToDate = params['processUpToDate'];

    const cutoffDateRange = await this.prisma.cutoffDateRange.findUnique({
      where: {
        id: cutoffDateRangeId,
      },
    });

    // Use the pre-calculated valid date range from the scheduler
    let fromDate: DateFormat;
    let toDate: DateFormat;

    if (processFromDate && processUpToDate) {
      // Use the validated date range from scheduler
      fromDate = this.utilityService.formatDate(new Date(processFromDate));
      toDate = this.utilityService.formatDate(new Date(processUpToDate));

      this.utilityService.log(
        `Processing timekeeping for ${employeeAccountId} from ${processFromDate} to ${processUpToDate}`,
      );
    } else {
      // Fallback to cutoff range (shouldn't happen with new logic)
      fromDate = this.utilityService.formatDate(cutoffDateRange.startDate);
      toDate = this.utilityService.formatDate(cutoffDateRange.endDate);

      this.utilityService.log(
        `WARNING: Using fallback date range for ${employeeAccountId} - this shouldn't happen with updated scheduler`,
      );
    }

    // If not processing only uncomputed, save timekeeping logs first
    if (!processOnlyUncomputed) {
      const timekeepingGroupingService = await this.moduleRef.create(
        TimekeepingGroupingService,
      );
      timekeepingGroupingService.initialize(
        employeeAccountId,
        fromDate,
        toDate,
      );
      await timekeepingGroupingService.saveTimekeepingLogs();
    }

    // Process each date in the range
    let currentDate = moment(fromDate.raw).startOf('day');
    const endDate = moment(toDate.raw).startOf('day');

    while (currentDate.isSameOrBefore(endDate)) {
      const currentDateFormatted = this.utilityService.formatDate(
        currentDate.toDate(),
      );
      const dateString = currentDate.format('YYYY-MM-DD');

      try {
        // Check if timekeeping already exists and is computed
        if (processOnlyUncomputed) {
          const existingTimekeeping =
            await this.prisma.employeeTimekeeping.findFirst({
              where: {
                dateString,
                employeeTimekeepingCutoff: {
                  accountId: employeeAccountId,
                  cutoffDateRangeId,
                },
                // Check if has related computed record
                EmployeeTimekeepingComputed: {
                  some: {},
                },
              },
            });

          if (existingTimekeeping) {
            this.utilityService.log(
              `Skipping ${dateString} for ${employeeAccountId} - already computed`,
            );
            currentDate = currentDate.add(1, 'day');
            continue;
          }
        }

        // If processing only uncomputed and no timekeeping record exists, create it first
        if (processOnlyUncomputed) {
          const existingTimekeeping =
            await this.prisma.employeeTimekeeping.findFirst({
              where: {
                dateString,
                employeeTimekeepingCutoff: {
                  accountId: employeeAccountId,
                  cutoffDateRangeId,
                },
              },
            });

          if (!existingTimekeeping) {
            const timekeepingGroupingService = await this.moduleRef.create(
              TimekeepingGroupingService,
            );
            timekeepingGroupingService.initialize(
              employeeAccountId,
              currentDateFormatted,
              currentDateFormatted,
            );
            await timekeepingGroupingService.saveTimekeepingLogs();
          }
        }

        // Compute timekeeping (conflict detection is now handled inside computeTimekeeping)
        const timekeepingComputationService = await this.moduleRef.create(
          TimekeepingComputationService,
        );
        timekeepingComputationService.setEmployeeAccountId(employeeAccountId);
        timekeepingComputationService.setDate(currentDateFormatted);
        await timekeepingComputationService.computeTimekeeping();
      } catch (error) {
        this.utilityService.error(
          `Error processing ${dateString} for ${employeeAccountId}: ${error.message}`,
        );
      }

      currentDate = currentDate.add(1, 'day');
    }
  }
}
