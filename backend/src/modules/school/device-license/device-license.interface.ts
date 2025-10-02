import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export class DeviceLicenseGenerateDTO {
  @IsNumber()
  @Min(1)
  @Max(100)
  quantity: number;

  @IsUUID()
  gateId: string;
}

export class DeviceLicenseUpdateDTO {
  @IsNumber()
  id: number;

  @IsUUID()
  @IsOptional()
  gateId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class DeviceLicenseTableDTO {
  @IsString()
  @IsOptional()
  searchKeyword?: string;

  @IsString()
  @IsOptional()
  searchBy?: string;

  @IsUUID()
  @IsOptional()
  gateId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isConnected?: boolean;
}

export class DeviceConnectionDTO {
  @IsString()
  licenseKey: string;

  @IsString()
  deviceName: string;

  @IsString()
  macAddress: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsOptional()
  deviceInfo?: any;
}

export class DeviceLicenseRegenerateDTO {
  @IsNumber()
  id: number;
}

export class DeviceLicenseDeleteDTO {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}
