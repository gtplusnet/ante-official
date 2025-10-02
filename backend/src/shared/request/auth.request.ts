export interface LoginRequest {
  readonly username: string;
  readonly password: string;
}

export interface SignUpRequest {
  readonly companyInformation: SignUpCompany;
  readonly accountInformation: {
    firstName: string;
    lastName: string;
    contactNumber: string;
    email: string;
    username: string;
    password: string;
  };
  readonly sourceUrl?: string;
}

export interface SignUpCompany {
  companyName: string;
  domainPrefix: string;
  businessType: string;
  industry: string;
  registrationNo?: string;
  phone?: string;
  tinNo?: string;
}
