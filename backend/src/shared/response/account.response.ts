import { DateFormat } from './utility.format';
import { CompanyDataResponse } from './company.response';
import { RoleDataResponse } from './role.response';

export interface AccountDataResponse {
  id: string;
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName?: string;
  contactNumber: string;
  username: string;
  roleID: string;
  role: RoleDataResponse;
  company: CompanyDataResponse | null;
  parentAccountId: string | null;
  status: string;
  image: string | null;
  createdAt: DateFormat;
  updatedAt: DateFormat;
  isDeveloper?: boolean;
  isDeleted?: boolean;
  isEmailVerified?: boolean;
  dateOfBirth?: Date | null;
  gender?: string | null;
  civilStatus?: string | null;
  street?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  postalCode?: string | null;
  zipCode?: string | null;
  country?: string | null;
}

export interface AccountUser {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  image?: string;
}

export interface MiniAccountDataResponse {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  /** Profile photo URL */
  image?: string;
}
