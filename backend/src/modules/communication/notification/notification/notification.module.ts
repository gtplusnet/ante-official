import { Module, forwardRef } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { SocketModule } from '@modules/communication/socket/socket/socket.module';
import { CommonModule } from '@common/common.module';

@Module({
  imports: [forwardRef(() => SocketModule), CommonModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
