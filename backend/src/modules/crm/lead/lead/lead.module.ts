import { Module } from '@nestjs/common';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';
import { CommonModule } from '@common/common.module';
import { ClientService } from '@modules/crm/client/client/client.service';
import { LocationService } from '@modules/location/location/location/location.service';
import { CRMActivityModule } from '@modules/crm/crm-activity/crm-activity/crm-activity.module';

@Module({
  imports: [CommonModule, CRMActivityModule],
  controllers: [LeadController],
  providers: [LeadService, ClientService, LocationService],
  exports: [LeadService],
})
export class LeadModule {}
