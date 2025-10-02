import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { AttendanceConflictsService } from './attendance-conflicts.service';
import { AttendanceConflictsController } from './attendance-conflicts.controller';

@Module({
  imports: [CommonModule],
  providers: [AttendanceConflictsService],
  controllers: [AttendanceConflictsController],
  exports: [AttendanceConflictsService],
})
export class AttendanceConflictsModule {}
