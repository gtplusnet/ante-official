import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  IsObject,
  IsNotEmpty,
  Matches,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkflowTemplateValidator {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z_]+$/, {
    message: 'Code must be lowercase with underscores only',
  })
  @MaxLength(50)
  code: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateWorkflowTemplateValidator {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateWorkflowStageValidator {
  @IsNumber()
  workflowId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z_]+$/, {
    message: 'Key must be uppercase with underscores only',
  })
  @MaxLength(50)
  key: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color' })
  color: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Text color must be a valid hex color',
  })
  textColor: string;

  @IsNumber()
  sequence: number;

  @IsBoolean()
  @IsOptional()
  isInitial?: boolean;

  @IsBoolean()
  @IsOptional()
  isFinal?: boolean;
}

export class UpdateWorkflowStageValidator {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color' })
  color?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Text color must be a valid hex color',
  })
  textColor?: string;

  @IsNumber()
  @IsOptional()
  sequence?: number;

  @IsBoolean()
  @IsOptional()
  isInitial?: boolean;

  @IsBoolean()
  @IsOptional()
  isFinal?: boolean;
}

export class CreateWorkflowTransitionValidator {
  @IsNumber()
  fromStageId: number;

  @IsNumber()
  @IsOptional()
  toStageId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  buttonName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Button color must be a valid hex color',
  })
  buttonColor?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  dialogType?: string;

  @IsObject()
  @IsOptional()
  customDialogConfig?: any;

  @IsString()
  @IsOptional()
  conditionType?: string;

  @IsObject()
  @IsOptional()
  conditionData?: any;
}

export class UpdateWorkflowTransitionValidator {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  buttonName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Button color must be a valid hex color',
  })
  buttonColor?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  dialogType?: string;

  @IsObject()
  @IsOptional()
  customDialogConfig?: any;

  @IsString()
  @IsOptional()
  conditionType?: string;

  @IsObject()
  @IsOptional()
  conditionData?: any;
}

class ReorderStageItem {
  @IsNumber()
  id: number;

  @IsNumber()
  sequence: number;
}

export class ReorderStagesValidator {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderStageItem)
  stages: ReorderStageItem[];
}

export class CloneWorkflowValidator {
  @IsNumber()
  sourceWorkflowId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z_]+$/, {
    message: 'Code must be lowercase with underscores only',
  })
  @MaxLength(50)
  code: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
