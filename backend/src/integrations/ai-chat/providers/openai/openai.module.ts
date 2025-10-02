import { Module } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { CommonModule } from '@common/common.module';

@Module({
  imports: [CommonModule],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenAIProviderModule {}
