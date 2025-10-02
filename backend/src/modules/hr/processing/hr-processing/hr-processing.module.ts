import { Module } from '@nestjs/common';
import { HrProcessingController } from './hr-processing.controller';
import { HrProcessingService } from './hr-processing.service';
import { CommonModule } from '@common/common.module';
import { HrisComputationModule } from '@modules/hr/computation/hris-computation/hris-computation.module';
import { HrConfigurationModule } from '@modules/hr/configuration/hr-configuration/hr-configuration.module';
import { QueueModule } from '@infrastructure/queue/queue/queue.module';
import { SocketModule } from '@modules/communication/socket/socket/socket.module';
import { PostedPayrollModule } from '../posted-payroll/posted-payroll.module';
import { EmployeeSalaryAdjustmentModule } from '../employee-salary-adjustment/employee-salary-adjustment.module';
import { ApprovalModule } from '@modules/approval/approval.module';
import { ApprovalService } from '@modules/approval/approval.service';
import { PayrollApprovalStrategy } from '../strategies/payroll-approval.strategy';
import { NotificationModule } from '@modules/communication/notification/notification/notification.module';
import { EmailApprovalModule } from '@modules/communication/email-approval/email-approval.module';
import { PayrollApprovalController } from '../payroll-approval/payroll-approval.controller';
import { PayrollReportGeneratorService } from '../services/payroll-report-generator.service';
import { BankExportModule } from '../bank-export/bank-export.module';

@Module({
  imports: [
    QueueModule,
    CommonModule,
    HrisComputationModule,
    HrConfigurationModule,
    SocketModule,
    PostedPayrollModule,
    EmployeeSalaryAdjustmentModule,
    ApprovalModule,
    NotificationModule,
    EmailApprovalModule,
    BankExportModule,
  ],
  controllers: [HrProcessingController, PayrollApprovalController],
  providers: [
    HrProcessingService,
    PayrollApprovalStrategy,
    PayrollReportGeneratorService,
  ],
  exports: [
    HrProcessingService,
    PayrollApprovalStrategy,
    PayrollReportGeneratorService,
  ],
})
export class HrProcessingModule {
  constructor(
    private readonly approvalService: ApprovalService,
    private readonly payrollApprovalStrategy: PayrollApprovalStrategy,
  ) {
    // Register the payroll approval strategy
    this.approvalService.registerStrategy(
      'PAYROLL',
      this.payrollApprovalStrategy,
    );
  }
}
