import { Module } from '@nestjs/common';
import { LeadCompanyController } from './lead-company.controller';
import { LeadCompanyService } from './lead-company.service';
import { CommonModule } from '@common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [LeadCompanyController],
  providers: [LeadCompanyService],
  exports: [LeadCompanyService],
})
export class LeadCompanyModule {}
