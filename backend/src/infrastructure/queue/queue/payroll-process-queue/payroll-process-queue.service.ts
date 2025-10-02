import { Inject, Injectable } from '@nestjs/common';
import { QueueAbstract } from '../queue.abstract';
import { QueueLogs } from '@prisma/client';
import { UtilityService } from '@common/utility.service';
import { PrismaService } from '@common/prisma.service';
import { PayrollProcessingService } from '@modules/hr/computation/hris-computation/payroll-processing/payroll-processing.service';
import { ModuleRef } from '@nestjs/core';
import { QueueLogMongoService } from '@common/services/queue-log-mongo.service';
import { QueueMongoService } from '@common/services/queue-mongo.service';

@Injectable()
export class PayrollProcessQueueService extends QueueAbstract {
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly moduleRef: ModuleRef;
  @Inject() private readonly queueLogMongoService: QueueLogMongoService;
  @Inject() private readonly queueMongoService: QueueMongoService;

  async processPendingQueue(queueData: any): Promise<void> {
    const cutoffDateRangeId = queueData.queueSettings['cutoffDateRangeId'];
    this.utilityService.log(
      `Initializing of salary computation -- Queue #${queueData._id} started. The cutoff date range is ${cutoffDateRangeId}.`,
    );

    const employeeTimekeepingCutoff =
      await this.prisma.employeeTimekeepingCutoff.findMany({
        where: {
          cutoffDateRangeId: cutoffDateRangeId,
        },
        include: {
          account: true,
        },
      });

    for (const timekeepingCutoff of employeeTimekeepingCutoff) {
      await this.queueLogMongoService.create({
        queueId: String(queueData._id),
        params: { employeeTimekeepingCutoffId: timekeepingCutoff.id },
        message:
          'Processing Salary of ' +
          timekeepingCutoff.account.firstName +
          ' ' +
          timekeepingCutoff.account.lastName,
      });
    }

    await this.queueMongoService.update(String(queueData._id), {
      totalCount: employeeTimekeepingCutoff.length,
    });
    this.utilityService.log(
      `Initialization of salary computation -- Queue #${queueData._id} finished.`,
    );
  }

  async processQueueLog(queueLog: QueueLogs): Promise<void> {
    const params = queueLog.params;
    const employeeTimekeepingCutoffId = params['employeeTimekeepingCutoffId'];
    const payrollProcessingService = await this.moduleRef.create(
      PayrollProcessingService,
    );
    payrollProcessingService.setTimekeepingCutoffId(
      employeeTimekeepingCutoffId,
    );
    await payrollProcessingService.computeSalary();
  }
}
