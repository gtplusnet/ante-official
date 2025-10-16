import { IsString, IsOptional, IsObject } from 'class-validator';

/**
 * DTO for updating a specific preference key
 */
export class UpdatePreferenceDto {
  @IsString()
  key: string;

  @IsObject()
  value: any;
}

/**
 * DTO for bulk updating preferences
 */
export class BulkUpdatePreferencesDto {
  @IsObject()
  preferences: Record<string, any>;
}

/**
 * DTO for getting a specific preference
 */
export class GetPreferenceDto {
  @IsString()
  key: string;

  @IsOptional()
  @IsObject()
  defaultValue?: any;
}
