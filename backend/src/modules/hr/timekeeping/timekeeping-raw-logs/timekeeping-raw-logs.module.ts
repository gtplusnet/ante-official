import { Module } from '@nestjs/common';
import { TimekeepingRawLogsController } from './timekeeping-raw-logs.controller';
import { TimekeepingRawLogsService } from './timekeeping-raw-logs.service';
import { CommonModule } from '@common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [TimekeepingRawLogsController],
  providers: [TimekeepingRawLogsService],
  exports: [TimekeepingRawLogsService],
})
export class TimekeepingRawLogsModule {}
