import { Module } from '@nestjs/common';
import { PointOfContactController } from './point-of-contact.controller';
import { PointOfContactService } from './point-of-contact.service';
import { CommonModule } from '@common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [PointOfContactController],
  providers: [PointOfContactService],
  exports: [PointOfContactService],
})
export class PointOfContactModule {}
