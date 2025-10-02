import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { SectionController } from './section.controller';
import { SectionService } from './section.service';

@Module({
  imports: [CommonModule],
  controllers: [SectionController],
  providers: [SectionService],
  exports: [SectionService],
})
export class SectionModule {}