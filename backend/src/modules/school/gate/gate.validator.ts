import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateGateDto {
  @IsString()
  @IsNotEmpty()
  gateName: string;
}

export class UpdateGateDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  gateName: string;
}

export class DeleteGateDto {
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  ids: string[];
}

export class GateTableRequestDto {
  @IsString()
  @IsOptional()
  search?: string;
}
