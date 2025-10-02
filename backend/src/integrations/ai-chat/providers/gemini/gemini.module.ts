import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { CommonModule } from '@common/common.module';
import { GeminiTaskService } from './services/gemini-task.service';
import { GeminiProjectService } from './services/gemini-project.service';

@Module({
  imports: [CommonModule],
  providers: [GeminiService, GeminiTaskService, GeminiProjectService],
  exports: [GeminiService],
})
export class GeminiProviderModule {}
