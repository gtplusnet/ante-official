import {
  LocationBarangay,
  LocationMunicipality,
  LocationProvince,
  LocationRegion,
} from '@prisma/client';
import { DateFormat } from './utility.format';

export interface LocationDataResponse {
  id: string;
  name: string;
  region: LocationRegion;
  province: LocationProvince;
  municipality: LocationMunicipality;
  barangay: LocationBarangay;
  zipCode: string;
  landmark?: string;
  description?: string;
  street?: string;
  isDeleted: boolean;
  createdAt: DateFormat;
  updatedAt: DateFormat;
}
