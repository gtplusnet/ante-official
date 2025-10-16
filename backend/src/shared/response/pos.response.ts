export class PosChildItemResponse {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  isIncluded: boolean;
  stockCount: number;
}

export class PosItemResponse {
  id: string;
  name: string;
  sku: string;
  description: string;
  sellingPrice: number;
  itemType: string;
  categoryId?: number;
  categoryName?: string;
  brandId?: number;
  brandName?: string;
  enabledInPOS: boolean;
  uom: string;
  companyId?: number;
  branchId?: number;
  stockCount?: number;
  childItems?: PosChildItemResponse[];
}

export class PosItemsListResponse {
  items: PosItemResponse[];
  total: number;
}

export class POSDeviceInitializeResponse {
  success: boolean;
  deviceBound: boolean;
  deviceName: string;
  deviceId: string;
  branchId?: number;
  branchName?: string;
  companyId: number;
  companyName: string;
}

export class CashierLoginResponse {
  sessionToken: string;
  accountId: string;
  cashierCode: string;
  fullName: string;
  email: string;
}

export class CashierLogoutResponse {
  success: boolean;
  message: string;
}
