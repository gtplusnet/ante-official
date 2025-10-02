import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { EmailModule } from '../email/email.module';
import { ApprovalModule } from '@modules/approval/approval.module';
import { EmailApprovalController } from './email-approval.controller';
import { ApiEmailApprovalController } from './api-email-approval.controller';
import { EmailApprovalService } from './services/email-approval.service';
import { TemplateEngineService } from './services/template-engine.service';
import { TokenManagerService } from './services/token-manager.service';

@Module({
  imports: [
    CommonModule, // Always include CommonModule for PrismaService, UtilityService, etc.
    EmailModule, // For email sending capabilities
    ApprovalModule, // For ApprovalService to process approvals
  ],
  controllers: [EmailApprovalController, ApiEmailApprovalController],
  providers: [EmailApprovalService, TemplateEngineService, TokenManagerService],
  exports: [
    EmailApprovalService, // Export for use in other modules (PayrollApprovalStrategy, etc.)
  ],
})
export class EmailApprovalModule {}
