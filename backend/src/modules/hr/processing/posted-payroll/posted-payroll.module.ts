import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { PostedPayrollService } from './posted-payroll.service';
import { AllowanceHistoryService } from './services/allowance-history.service';
import { DeductionHistoryService } from './services/deduction-history.service';
import { LoanPaymentService } from './services/loan-payment.service';
import { GovernmentPaymentService } from './services/government-payment.service';

@Module({
  imports: [CommonModule],
  providers: [
    PostedPayrollService,
    AllowanceHistoryService,
    DeductionHistoryService,
    LoanPaymentService,
    GovernmentPaymentService,
  ],
  exports: [PostedPayrollService],
})
export class PostedPayrollModule {}
