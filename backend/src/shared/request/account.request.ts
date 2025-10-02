export interface AccountCreateRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  contactNumber: string;
  email: string;
  username: string;
  password: string;
  roleID: string;
  parentAccountId?: string;
  image?: string;
  sourceUrl?: string;
}
