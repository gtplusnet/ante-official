export interface CreateBrandRequest {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateBrandRequest {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface QueryBrandRequest {
  id?: number;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
