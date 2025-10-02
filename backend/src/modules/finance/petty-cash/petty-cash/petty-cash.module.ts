import { Module, forwardRef } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { PettyCashService } from './petty-cash.service';
import { PettyCashController } from './petty-cash.controller';
import { WorkflowModule } from '@modules/workflow/workflow.module';
import { OpenAIProviderModule } from '../../../../integrations/ai-chat/providers/openai/openai.module';

@Module({
  imports: [
    CommonModule,
    forwardRef(() => WorkflowModule),
    OpenAIProviderModule,
  ],
  controllers: [PettyCashController],
  providers: [PettyCashService],
  exports: [PettyCashService],
})
export class PettyCashModule {}
