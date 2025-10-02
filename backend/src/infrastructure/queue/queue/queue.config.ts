import { QueueType } from '@prisma/client';
import { EmployeeImportationQueueService } from './employee-importation-queue/employee-importation-queue.service';
import { TimekeepingProcessQueueService } from './timekeeping-process-queue/timekeeping-process-queue.service';
import { PayrollProcessQueueService } from './payroll-process-queue/payroll-process-queue.service';
import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class QueueConfig implements OnModuleInit {
  private queueServiceMap;

  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit() {
    this.startMapping();
  }

  private startMapping() {
    this.queueServiceMap = {
      [QueueType.EMPLOYEE_IMPORTATION]: this.moduleRef.get(
        EmployeeImportationQueueService,
        { strict: false },
      ),
      [QueueType.TIMEKEEPING_PROCESSING]: this.moduleRef.get(
        TimekeepingProcessQueueService,
        { strict: false },
      ),
      [QueueType.PAYROLL_PROCESSING]: this.moduleRef.get(
        PayrollProcessQueueService,
        { strict: false },
      ),
    };
  }

  public getQueueService(queueType: QueueType) {
    const service = this.queueServiceMap[queueType];

    if (!service) {
      throw new BadRequestException(
        `Queue type ${queueType} is not supported.`,
      );
    }

    return service;
  }
}
