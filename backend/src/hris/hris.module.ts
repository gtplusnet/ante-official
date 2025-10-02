import { forwardRef, Module } from '@nestjs/common';
import { EmployeeListController } from '@modules/hr/employee/employee-list/employee-list.controller';
import { EmployeeImportationController } from '@modules/hr/employee/employee-importation/employee-importation.controller';
import { EmployeeImportController } from '@modules/hr/employee/employee-import/employee-import.controller';
import { EmployeeCurrentController } from '@modules/hr/employee/employee-current/employee-current.controller';
import { EmployeeTimekeepingController } from '@modules/hr/timekeeping/employee-timekeeping/employee-timekeeping.controller';
import { AttendanceConflictsController } from '@modules/hr/timekeeping/attendance-conflicts/attendance-conflicts.controller';
import { IndividualScheduleAssignmentController } from '@modules/hr/individual-schedule-assignment/individual-schedule-assignment.controller';
import { EmployeeListService } from '@modules/hr/employee/employee-list/employee-list.service';
import { EmployeeCurrentService } from '@modules/hr/employee/employee-current/employee-current.service';
import { AccountService } from '@modules/account/account/account.service';
import { UploadPhotoService } from '@infrastructure/file-upload/upload-photo/upload-photo.service';
import { CommonModule } from '@common/common.module';
import { HrConfigurationModule } from '@modules/hr/configuration/hr-configuration/hr-configuration.module';
import { EmployeeImportationService } from '@modules/hr/employee/employee-importation/employee-importation.service';
import { EmployeeImportService } from '@modules/hr/employee/employee-import/employee-import.service';
import { BranchService } from '@modules/location/branch/branch/branch.service';
import { QueueModule } from '@infrastructure/queue/queue/queue.module';
import { LocationService } from '@modules/location/location/location/location.service';
import { EmployeeTimekeepingService } from '@modules/hr/timekeeping/employee-timekeeping/employee-timekeeping.service';
import { AttendanceConflictsService } from '@modules/hr/timekeeping/attendance-conflicts/attendance-conflicts.service';
import { HrisComputationModule } from '@modules/hr/computation/hris-computation/hris-computation.module';
import { SocketModule } from '@modules/communication/socket/socket/socket.module';
import { HrFilingModule } from '@modules/hr/filing/hr-filing/hr-filing.module';
import { AttendanceConflictsModule } from '@modules/hr/timekeeping/attendance-conflicts/attendance-conflicts.module';
import { EmployeeDocumentService } from '@modules/hr/employee/employee-document/employee-document.service';
import { FileUploadService } from '@infrastructure/file-upload/file-upload/file-upload.service';
import { IndividualScheduleAssignmentModule } from '@modules/hr/individual-schedule-assignment/individual-schedule-assignment.module';
import { TeamModule } from '@modules/hr/team/team.module';

@Module({
  imports: [
    CommonModule,
    forwardRef(() => HrConfigurationModule),
    forwardRef(() => QueueModule),
    forwardRef(() => HrisComputationModule),
    forwardRef(() => SocketModule),
    forwardRef(() => HrFilingModule),
    AttendanceConflictsModule,
    IndividualScheduleAssignmentModule,
    TeamModule,
  ],
  controllers: [
    EmployeeListController,
    EmployeeCurrentController,
    EmployeeImportationController,
    EmployeeImportController,
    EmployeeTimekeepingController,
    AttendanceConflictsController,
    IndividualScheduleAssignmentController,
  ],
  providers: [
    EmployeeListService,
    EmployeeCurrentService,
    AccountService,
    UploadPhotoService,
    EmployeeImportationService,
    EmployeeImportService,
    BranchService,
    LocationService,
    EmployeeTimekeepingService,
    AttendanceConflictsService,
    EmployeeDocumentService,
    FileUploadService,
  ],
  exports: [EmployeeListService, EmployeeTimekeepingService],
})
export class HrisModule {}
