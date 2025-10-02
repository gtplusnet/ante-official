import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { EmailConfigController } from './email-config.controller';
import { EmailConfigService } from './email-config.service';

@Module({
  imports: [CommonModule],
  controllers: [EmailConfigController],
  providers: [EmailConfigService],
  exports: [EmailConfigService],
})
export class EmailConfigModule {}
