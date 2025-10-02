import { Module } from '@nestjs/common';
import { ImageProcessorService } from './image-processor.service';
import { VideoProcessorService } from './video-processor.service';
import { DocumentProcessorService } from './document-processor.service';
import { MediaProcessorService } from './media-processor.service';

@Module({
  providers: [
    ImageProcessorService,
    VideoProcessorService,
    DocumentProcessorService,
    MediaProcessorService,
  ],
  exports: [
    MediaProcessorService,
    ImageProcessorService,
    VideoProcessorService,
    DocumentProcessorService,
  ],
})
export class MediaProcessorModule {}
