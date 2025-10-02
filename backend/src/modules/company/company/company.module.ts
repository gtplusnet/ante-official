import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CommonModule } from '@common/common.module';
import { CompanyController } from './company.controller';
import { UploadPhotoService } from '@infrastructure/file-upload/upload-photo/upload-photo.service';

@Module({
  imports: [CommonModule],
  controllers: [CompanyController],
  providers: [CompanyService, UploadPhotoService],
  exports: [CompanyService],
})
export class CompanyModule {}
