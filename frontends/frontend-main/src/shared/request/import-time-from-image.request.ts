import { BiometricModel } from '../enums/biometric-model.enum';

export interface ImportTimeFromImageRequest {
  fileName: string;
  remarks: string;
  imageData: string; // base64 string
  importMethod?: BiometricModel;
}
