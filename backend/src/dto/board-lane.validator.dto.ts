import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class BoardLaneCreateDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsNumber()
  @IsOptional()
  readonly order?: number;

  @IsNotEmpty()
  @IsString()
  readonly description: string;
}

export class BoardLaneOrderDto {
  names: string[];
}

export class ReorderSingleLaneDto {
  name: string;
  newPosition: number;
}

export class BoardLaneUpdateDto {
  @IsNotEmpty()
  @IsNumber()
  readonly id: number;

  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsNotEmpty()
  @IsString()
  readonly description: string;
}

export class BoardLaneDeleteDto {
  @IsNotEmpty()
  @IsNumber()
  readonly id: number;
}

export class BoardLaneIdDto {
  @IsNotEmpty()
  readonly id: number;
}
