import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class CollaboratorCreateDto {
  @IsNumber()
  @IsOptional()
  @IsNotEmpty()
  taskId: number;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  accountId: string;
}
