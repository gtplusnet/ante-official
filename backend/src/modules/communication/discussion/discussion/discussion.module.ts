import { Module, forwardRef } from '@nestjs/common';
import { DiscussionService } from './discussion.service';
import { DiscussionController } from './discussion.controller';
import { CommonModule } from '@common/common.module';
import { NotificationModule } from '@modules/communication/notification/notification/notification.module';
import { SocketModule } from '@modules/communication/socket/socket/socket.module';

@Module({
  imports: [
    CommonModule,
    forwardRef(() => NotificationModule),
    forwardRef(() => SocketModule),
  ],
  providers: [DiscussionService],
  controllers: [DiscussionController],
  exports: [DiscussionService],
})
export class DiscussionModule {}
