import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class TagTimerDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  taskId: number;
}
