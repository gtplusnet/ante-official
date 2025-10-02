import { IsString, IsNotEmpty, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ExecuteSeederDTO {
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  companyId: number;

  @IsString()
  @IsNotEmpty()
  seederType: string;
}

export class ExecuteAllSeedersDTO {
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  companyId: number;
}
