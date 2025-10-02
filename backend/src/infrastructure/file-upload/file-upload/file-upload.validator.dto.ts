import { IsOptional } from 'class-validator';

export class FileUploadParamsDTO {
  @IsOptional()
  projectId?: number;

  @IsOptional()
  taskId?: number;
}
