import { Module, forwardRef } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval.controller';
import { CommonModule } from '@common/common.module';
import { NotificationModule } from '@modules/communication/notification/notification/notification.module';

@Module({
  imports: [CommonModule, forwardRef(() => NotificationModule)],
  controllers: [ApprovalController],
  providers: [ApprovalService],
  exports: [ApprovalService],
})
export class ApprovalModule {}
