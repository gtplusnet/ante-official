import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class CreateProjectAccomplishmentDTO {
  @IsNumber()
  @IsNotEmpty()
  projectId: number;

  @IsString()
  title: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  percentage: number;

  @IsDateString()
  @IsNotEmpty()
  accomplishmentDate: Date;

  @IsNumber()
  @IsOptional()
  attachmentId: number;

  @IsString()
  @IsOptional()
  description: string;
}

export class UpdateWorkAccomplishmentDTO extends CreateProjectAccomplishmentDTO {
  @IsNumber()
  @IsNotEmpty()
  accomplishmentId?: number;
}
