import {
  AccountDataResponse,
  CompanyDataResponse,
  DateFormat,
  RoleDataResponse,
} from '../../../../shared/response';

export class AccountSocketDataInterface implements AccountDataResponse {
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
  image: string;
  isDeveloper?: boolean;
  socket?: any;
  createdAt: DateFormat;
  updatedAt: DateFormat;
}
