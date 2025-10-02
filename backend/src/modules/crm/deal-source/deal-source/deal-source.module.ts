import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { DealSourceController } from './deal-source.controller';
import { DealSourceService } from './deal-source.service';

@Module({
  imports: [CommonModule],
  controllers: [DealSourceController],
  providers: [DealSourceService],
  exports: [DealSourceService],
})
export class DealSourceModule {}
