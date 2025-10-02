import { DateFormat } from './utility.format';

export interface CompanyDataResponse {
  id: number;
  companyName: string;
  domainPrefix: string;
  businessType: string;
  industry: string;
  businessTypeData?: { label: string; value: string } | null;
  industryData?: { label: string; value: string } | null;
  registrationNo: string;
  website: string;
  email: string;
  phone: string;
  tinNo: string;
  address: string;
  logoUrl: string;
  disabledModules?: string[];
  createdAt: DateFormat;
  updatedAt: DateFormat;
}
