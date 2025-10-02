import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { DealTypeController } from './deal-type.controller';
import { DealTypeService } from './deal-type.service';

@Module({
  imports: [CommonModule],
  controllers: [DealTypeController],
  providers: [DealTypeService],
  exports: [DealTypeService],
})
export class DealTypeModule {}
