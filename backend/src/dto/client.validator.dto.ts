import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

import { Prisma } from '@prisma/client';
export class CreateClientDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  contactNumber: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  locationId: Prisma.LocationWhereUniqueInput;
}
