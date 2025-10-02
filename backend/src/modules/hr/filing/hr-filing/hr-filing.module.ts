import { Module, forwardRef } from '@nestjs/common';
import { HrFilingController } from './hr-filing.controller';
import { HrFilingService } from './hr-filing.service';
import { CommonModule } from '@common/common.module';
import { ApprovalModule } from '@modules/approval/approval.module';
import { FilingApprovalStrategy } from './strategies/filing-approval.strategy';
import { NotificationModule } from '@modules/communication/notification/notification/notification.module';
import { EmailApprovalModule } from '@modules/communication/email-approval/email-approval.module';
import { FilingNotificationService } from '../services/filing-notification.service';
import { OvertimeFilingIntegrationService } from '../services/overtime-filing-integration.service';
import { AttendanceBusinessFilingIntegrationService } from '../services/attendance-business-filing-integration.service';
import { ScheduleAdjustmentService } from '../services/schedule-adjustment.service';
import { LeaveTimekeepingIntegrationService } from '../services/leave-timekeeping-integration.service';
import { HrConfigurationModule } from '@modules/hr/configuration/hr-configuration/hr-configuration.module';
import { LeaveConfigurationModule } from '@modules/hr/configuration/leave-configuration/leave-configuration.module';
import {
  OvertimeFilingController,
  LeaveFilingController,
  ScheduleFilingController,
  BusinessFilingController,
  AttendanceFilingController,
} from '../type-specific-filing.controller';

@Module({
  imports: [
    CommonModule,
    forwardRef(() => ApprovalModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => HrConfigurationModule),
    LeaveConfigurationModule,
    EmailApprovalModule,
  ],
  controllers: [
    HrFilingController,
    OvertimeFilingController,
    LeaveFilingController,
    ScheduleFilingController,
    BusinessFilingController,
    AttendanceFilingController,
  ],
  providers: [
    HrFilingService,
    FilingApprovalStrategy,
    FilingNotificationService,
    OvertimeFilingIntegrationService,
    AttendanceBusinessFilingIntegrationService,
    ScheduleAdjustmentService,
    LeaveTimekeepingIntegrationService,
  ],
  exports: [
    HrFilingService,
    OvertimeFilingIntegrationService,
    AttendanceBusinessFilingIntegrationService,
    ScheduleAdjustmentService,
    LeaveTimekeepingIntegrationService,
    FilingNotificationService,
  ],
})
export class HrFilingModule {}
