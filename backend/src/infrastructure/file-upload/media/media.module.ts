import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { FileUploadService } from '../file-upload/file-upload.service';
import { CommonModule } from '@common/common.module';
import { AccountModule } from '@modules/account/account/account.module';
import { MediaQueueModule } from '../../queues/media-queue.module';

@Module({
  imports: [CommonModule, AccountModule, MediaQueueModule],
  controllers: [MediaController],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class MediaModule {}
