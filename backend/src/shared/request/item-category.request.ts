export interface CreateItemCategoryRequest {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
  parentId?: number | null;
}

export interface UpdateItemCategoryRequest {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  parentId?: number | null;
}

export interface QueryItemCategoryRequest {
  id?: number;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
