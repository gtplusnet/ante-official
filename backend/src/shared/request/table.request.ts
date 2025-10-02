export interface TableParams {
  page: number;
  perPage: number;
}

export interface TableFilterRequest {
  [key: string]: any;
}

export interface TableSettings {
  sort: string;
  order: 'asc' | 'desc';
  filters: TableFilterRequest;
  params: TableParams;
  perPage: number;
  defaultOrderBy: string;
  defaultOrderType: 'asc' | 'desc';
}

export interface TableRequest {
  page: number;
  perPage: number;
  sort?: string;
  sortType?: 'asc' | 'desc';
  filters?: Record<string, any>[];
  searchKeyword?: string;
  searchBy?: string;
}
