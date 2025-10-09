import { Module } from '@nestjs/common';
import { LeadCompanyController } from './lead-company.controller';
import { LeadCompanyService } from './lead-company.service';
import { CommonModule } from '@common/common.module';
import { CRMActivityModule } from '../../crm-activity/crm-activity/crm-activity.module';

@Module({
  imports: [CommonModule, CRMActivityModule],
  controllers: [LeadCompanyController],
  providers: [LeadCompanyService],
  exports: [LeadCompanyService],
})
export class LeadCompanyModule {}
