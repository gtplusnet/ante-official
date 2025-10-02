import { IsNotEmpty, IsDateString, IsString } from 'class-validator';
import { SSSTableRequest, SSSBracketRequest } from '../../../../shared/request';

export class GetSSSTableDTO implements SSSTableRequest {
  @IsNotEmpty()
  @IsDateString()
  date: string;
}

export class GetSSSBracketDTO implements SSSBracketRequest {
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  salary: number;
}
