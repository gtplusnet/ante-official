import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { SentEmailController } from './sent-email.controller';
import { SentEmailService } from './sent-email.service';

@Module({
  imports: [CommonModule],
  controllers: [SentEmailController],
  providers: [SentEmailService],
  exports: [SentEmailService],
})
export class SentEmailModule {}
