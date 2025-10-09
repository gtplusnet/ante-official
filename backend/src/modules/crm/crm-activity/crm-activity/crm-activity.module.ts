import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { CRMActivityController } from './crm-activity.controller';
import { CRMActivityService } from './crm-activity.service';

@Module({
  imports: [CommonModule],
  controllers: [CRMActivityController],
  providers: [CRMActivityService],
  exports: [CRMActivityService],
})
export class CRMActivityModule {}
