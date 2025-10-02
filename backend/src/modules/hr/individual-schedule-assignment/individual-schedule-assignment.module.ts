import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { IndividualScheduleAssignmentController } from './individual-schedule-assignment.controller';
import { IndividualScheduleAssignmentService } from './individual-schedule-assignment.service';

@Module({
  imports: [CommonModule],
  controllers: [IndividualScheduleAssignmentController],
  providers: [IndividualScheduleAssignmentService],
  exports: [IndividualScheduleAssignmentService],
})
export class IndividualScheduleAssignmentModule {}
