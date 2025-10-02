import {
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Exists } from '@common/validators/exists.validator';
import { ScheduleCreateDayResponse } from '../../../../shared/response/schedule.response';

export class GetScheduleDTO {
  @IsNotEmpty()
  @Exists('schedule', 'id', { message: 'Schedule ID does not exist.' })
  id: string;
}

export class ScheduleCreateDayDTO implements ScheduleCreateDayResponse {
  @IsNotEmpty()
  @IsNumber()
  @Exists('shift', 'id', { message: 'Shift for monday does not exist.' })
  mondayShiftId: number;

  @IsNotEmpty()
  @IsNumber()
  @Exists('shift', 'id', { message: 'Shift for tuesday does not exist.' })
  tuesdayShiftId: number;

  @IsNotEmpty()
  @IsNumber()
  @Exists('shift', 'id', { message: 'Shift for wednesday does not exist.' })
  wednesdayShiftId: number;

  @IsNotEmpty()
  @IsNumber()
  @Exists('shift', 'id', { message: 'Shift for thursday does not exist.' })
  thursdayShiftId: number;

  @IsNotEmpty()
  @IsNumber()
  @Exists('shift', 'id', { message: 'Shift for friday does not exist.' })
  fridayShiftId: number;

  @IsNotEmpty()
  @IsNumber()
  @Exists('shift', 'id', { message: 'Shift for saturday does not exist.' })
  saturdayShiftId: number;

  @IsNotEmpty()
  @IsNumber()
  @Exists('shift', 'id', { message: 'Shift for sunday does not exist.' })
  sundayShiftId: number;
}

export class ScheduleCreateDTO {
  @IsNotEmpty()
  @IsString()
  scheduleCode: string;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ScheduleCreateDayDTO)
  daySchedule: ScheduleCreateDayDTO;
}

export class ScheduleUpdateDTO extends ScheduleCreateDTO {
  @IsNotEmpty()
  @IsNumber()
  @Exists('schedule', 'id', { message: 'Schedule ID does not exist.' })
  id?: number;
}
