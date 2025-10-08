import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ScopeService } from '@modules/project/scope/scope/scope.service';
import { ClientService } from '@modules/crm/client/client/client.service';
import { winstonConfig } from '@common/logger';
import { BoqService } from '@modules/project/boq/boq/boq.service';
import { SocketService } from '@modules/communication/socket/socket/socket.service';
import { TopicService } from '@modules/communication/topic/topic/topic.service';
import { WarehouseService } from '@modules/inventory/warehouse/warehouse/warehouse.service';
import { CommonModule } from '@common/common.module';
import { LocationService } from '@modules/location/location/location/location.service';
import { CRMActivityModule } from '@modules/crm/crm-activity/crm-activity/crm-activity.module';

@Module({
  imports: [CommonModule, CRMActivityModule],
  controllers: [ProjectController],
  providers: [
    ProjectService,
    // Services not provided by CommonModule
    ScopeService,
    ClientService,
    BoqService,
    SocketService,
    TopicService,
    WarehouseService,
    LocationService,
    { provide: 'winston', useValue: winstonConfig },
  ],
  exports: [ProjectService],
})
export class ProjectModule {}
