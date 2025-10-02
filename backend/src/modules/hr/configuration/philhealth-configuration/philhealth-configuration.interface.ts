import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class GetPhilhealthBracketDTO {
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  salary: number;
}
