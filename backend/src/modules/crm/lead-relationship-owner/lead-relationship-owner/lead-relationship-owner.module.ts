import { Module } from '@nestjs/common';
import { LeadRelationshipOwnerController } from './lead-relationship-owner.controller';
import { LeadRelationshipOwnerService } from './lead-relationship-owner.service';
import { CommonModule } from '@common/common.module';
import { CRMActivityModule } from '../../crm-activity/crm-activity/crm-activity.module';

@Module({
  imports: [CommonModule, CRMActivityModule],
  controllers: [LeadRelationshipOwnerController],
  providers: [LeadRelationshipOwnerService],
  exports: [LeadRelationshipOwnerService],
})
export class LeadRelationshipOwnerModule {}
