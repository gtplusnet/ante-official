import { IsString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';

import { ImportTimeFromImageRequest } from '../../../../shared/request/import-time-from-image.request';
import { BiometricModel } from '../../../../shared/enums/biometric-model.enum';

export class ImportTimeFromImageDTO implements ImportTimeFromImageRequest {
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @IsString()
  remarks: string;

  @IsNotEmpty()
  @IsString()
  imageData: string; // base64 string

  @IsOptional()
  @IsEnum(BiometricModel)
  importMethod?: BiometricModel;
}
