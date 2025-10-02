import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class StartTimerDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  taskId: number;
}