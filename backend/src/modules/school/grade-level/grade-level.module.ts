import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { GradeLevelController } from './grade-level.controller';
import { GradeLevelService } from './grade-level.service';

@Module({
  imports: [CommonModule],
  controllers: [GradeLevelController],
  providers: [GradeLevelService],
  exports: [GradeLevelService],
})
export class GradeLevelModule {}
