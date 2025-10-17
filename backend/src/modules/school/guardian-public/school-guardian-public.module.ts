import { Module } from '@nestjs/common';
import { SchoolGuardianPublicController } from './school-guardian-public.controller';
import { SchoolGuardianPublicService } from './school-guardian-public.service';
import { GuardianPublicAuthGuard } from './guards/guardian-public-auth.guard';
import { CommonModule } from '@common/common.module';
import { UploadPhotoService } from '@infrastructure/file-upload/upload-photo/upload-photo.service';

@Module({
  imports: [
    CommonModule,
  ],
  controllers: [SchoolGuardianPublicController],
  providers: [
    SchoolGuardianPublicService,
    GuardianPublicAuthGuard,
    UploadPhotoService,
  ],
  exports: [
    SchoolGuardianPublicService,
    GuardianPublicAuthGuard,
  ],
})
export class SchoolGuardianPublicModule {}