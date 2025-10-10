export interface BranchCreateRequest {
  id?: number;
  branchCode: string;
  branchName: string;
  branchLocationId: string;
  parentId?: number;
  mainWarehouseId?: string;
}
