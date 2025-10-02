export interface BrandDataResponse {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  companyId: number;
  createdAt: string;
  updatedAt: string;
}

export interface BrandSelectBoxResponse {
  id: number;
  name: string;
}
