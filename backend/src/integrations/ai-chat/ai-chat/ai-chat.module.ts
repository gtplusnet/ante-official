import { Module } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { AiChatController } from './ai-chat.controller';
import { CommonModule } from '@common/common.module';
import { GeminiProviderModule } from '../providers/gemini/gemini.module';
import { OpenAIProviderModule } from '../providers/openai/openai.module';
import { AIServiceResolverService } from '../services/ai-service-resolver.service';

@Module({
  imports: [CommonModule, GeminiProviderModule, OpenAIProviderModule],
  providers: [AiChatService, AIServiceResolverService],
  controllers: [AiChatController],
  exports: [AiChatService, AIServiceResolverService],
})
export class AiChatModule {}
