import { IsArray, IsString } from 'class-validator';

export class CreateMultipleOwnersDto {
  @IsArray()
  @IsString({ each: true })
  accountIds: string[];
}
