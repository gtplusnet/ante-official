export interface SimpleItemCreateRequest {}

export interface ItemTableSelectRequest {
  itemId: string;
  itemName: string;
  quantity: number;
  description: string;
  rate: number;
  amount: number;
  stockCount?: number;
  boqKey?: number;
}
