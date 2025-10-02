export interface TableResponse<T> {
  list: T[];
  pagination: number[];
  currentPage: number;
  totalCount: number;
}
