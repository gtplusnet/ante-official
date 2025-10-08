import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

// Recurrence DTO
export class RecurrenceDto {
  @IsString()
  recurrenceType: string; // daily, weekly, monthly, yearly, custom

  @IsNumber()
  frequency: number;

  @IsString()
  @IsOptional()
  interval?: string;

  @IsArray()
  @IsOptional()
  byDay?: string[];

  @IsArray()
  @IsOptional()
  byMonthDay?: number[];

  @IsArray()
  @IsOptional()
  byMonth?: number[];

  @IsNumber()
  @IsOptional()
  count?: number;

  @IsDateString()
  @IsOptional()
  until?: string;

  @IsArray()
  @IsOptional()
  exceptions?: string[];
}

// Reminder DTO
export class ReminderDto {
  @IsString()
  method: string; // popup, email, notification

  @IsNumber()
  minutes: number;
}

// Attendee DTO
export class AttendeeDto {
  @IsString()
  accountId: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  isOrganizer?: boolean;

  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;
}

// Create Event DTO
export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsDateString()
  startDateTime: string;

  @IsDateString()
  endDateTime: string;

  @IsBoolean()
  allDay: boolean;

  @IsString()
  colorCode: string;

  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @IsString()
  visibility: string; // public, private

  @IsArray()
  @IsOptional()
  attendeeIds?: string[];

  @ValidateNested()
  @Type(() => RecurrenceDto)
  @IsOptional()
  recurrence?: RecurrenceDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReminderDto)
  @IsOptional()
  reminders?: ReminderDto[];
}

// Update Event DTO
export class UpdateEventDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsDateString()
  @IsOptional()
  startDateTime?: string;

  @IsDateString()
  @IsOptional()
  endDateTime?: string;

  @IsBoolean()
  @IsOptional()
  allDay?: boolean;

  @IsString()
  @IsOptional()
  colorCode?: string;

  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @IsString()
  @IsOptional()
  visibility?: string;

  @IsArray()
  @IsOptional()
  attendeeIds?: string[];

  @ValidateNested()
  @Type(() => RecurrenceDto)
  @IsOptional()
  recurrence?: RecurrenceDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReminderDto)
  @IsOptional()
  reminders?: ReminderDto[];
}

// Quick Update DTO (for drag/drop and resize)
export class QuickUpdateEventDto {
  @IsDateString()
  startDateTime: string;

  @IsDateString()
  endDateTime: string;
}

// Get Events Query DTO
export class GetEventsQueryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsArray()
  @IsOptional()
  categoryIds?: number[];

  @IsString()
  @IsOptional()
  visibility?: string;
}
