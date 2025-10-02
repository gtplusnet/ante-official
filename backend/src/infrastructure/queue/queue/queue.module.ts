import { forwardRef, Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { CommonModule } from '@common/common.module';
import { EmployeeImportationQueueService } from './employee-importation-queue/employee-importation-queue.service';
import { QueueController } from './queue.controller';
import { QueueConfig } from './queue.config';
import { TimekeepingProcessQueueService } from './timekeeping-process-queue/timekeeping-process-queue.service';
import { HrisComputationModule } from '@modules/hr/computation/hris-computation/hris-computation.module';
import { HrConfigurationModule } from '@modules/hr/configuration/hr-configuration/hr-configuration.module';
import { HrFilingModule } from '@modules/hr/filing/hr-filing/hr-filing.module';
import { PayrollProcessQueueService } from './payroll-process-queue/payroll-process-queue.service';
import { MongoDbModule } from '../../mongodb/mongodb.module';
import { AttendanceConflictsModule } from '@modules/hr/timekeeping/attendance-conflicts/attendance-conflicts.module';
import { IndividualScheduleAssignmentModule } from '@modules/hr/individual-schedule-assignment/individual-schedule-assignment.module';
import { TeamModule } from '@modules/hr/team/team.module';
import { SocketModule } from '@modules/communication/socket/socket/socket.module';

@Module({
  imports: [
    CommonModule,
    HrisComputationModule,
    forwardRef(() => HrConfigurationModule),
    forwardRef(() => HrFilingModule),
    MongoDbModule,
    AttendanceConflictsModule,
    IndividualScheduleAssignmentModule,
    TeamModule,
    forwardRef(() => SocketModule),
  ],
  providers: [
    QueueService,
    EmployeeImportationQueueService,
    TimekeepingProcessQueueService,
    QueueConfig,
    PayrollProcessQueueService,
  ],
  exports: [QueueService],
  controllers: [QueueController],
})
export class QueueModule {}
