import { AccountDataResponse } from './account.response';
import { FileType } from '@/types/prisma-enums';
export interface FileDataResponse {
  id: number;
  name: string;
  type: FileType;
  url: string;
  size: number;
  uploadedBy: AccountDataResponse;
  fieldName: string;
  originalName: string;
  encoding: string | null;
  mimetype: string;
}
