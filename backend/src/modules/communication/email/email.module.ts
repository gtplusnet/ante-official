import { Module, forwardRef } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { EmailService } from './email.service';
import { EmailStorageService } from './email-storage.service';
import { EmailController } from './email.controller';
import { EmailConfigModule } from '../email-config/email-config.module';
import { SentEmailModule } from '../sent-email/sent-email.module';

@Module({
  imports: [CommonModule, EmailConfigModule, forwardRef(() => SentEmailModule)],
  controllers: [EmailController],
  providers: [EmailService, EmailStorageService],
  exports: [EmailService, EmailStorageService],
})
export class EmailModule {}
