import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { ShiftType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ShiftCreateRequest,
  ShiftTimeRequest,
  ShiftUpdateRequest,
} from '../../../../shared/request';

export class ShiftTimeDTO implements ShiftTimeRequest {
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  endTime: string;

  @IsBoolean()
  @IsOptional()
  isBreakTime?: boolean;
}

export class ShiftCreateDTO implements ShiftCreateRequest {
  @IsNotEmpty()
  @IsString()
  shiftCode: string;

  @IsString()
  @IsEnum(ShiftType)
  shiftType: ShiftType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShiftTimeDTO)
  shiftTime: ShiftTimeDTO[];

  @IsNotEmpty()
  @IsNumber()
  breakHours: number;

  @IsOptional()
  @IsNumber()
  targetHours?: number;
}

export class ShiftUpdateDTO
  extends ShiftCreateDTO
  implements ShiftUpdateRequest
{
  @IsOptional()
  @IsNumber()
  id?: number;
}
