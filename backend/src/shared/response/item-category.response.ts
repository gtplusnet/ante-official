export interface ItemCategoryDataResponse {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  parentId: number | null;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  parent?: ItemCategoryDataResponse;
  children?: ItemCategoryDataResponse[];
  childrenCount?: number;
  itemCount?: number;
}

export interface ItemCategorySelectBoxResponse {
  id: number | null;
  name: string;
  code: string;
  parentId: number | null;
}
