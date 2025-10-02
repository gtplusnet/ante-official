import { IsOptional, IsDateString } from 'class-validator';

export class StopTimerDto {
  @IsOptional()
  @IsDateString()
  timeOut?: string;
}