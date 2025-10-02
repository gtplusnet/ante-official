import { ApprovalStatus, BoqType } from '@prisma/client';

export interface BoqItemInterface {
  id: number;
  boqId: number;
  itemId: string | null;
  key: number;
  type: BoqType;
  numerals: string;
  description: string;
  quantity: number;
  quantityPurchased: number;
  materialUnit: string;
  materialUnitCost: number;
  materialTotalCost: number;
  laborUnitCost: number;
  laborUnitCostDisplay: number;
  laborTotalCost: number;
  laborPercentageCost: number;
  directCost: number;
  directCostWithProfit: number;
  subTotal: number;
  subTotalWithProfit: number;
  profitMargin: number;
  profitMarginPercentage: number;
  totalWithProfit: number;
  generation: number;
  order: number;
  parentId: number | null;
  children?: BoqItemInterface[];
  approvalStatus: ApprovalStatus;
  color: string;
  isQuantityTakeOff: boolean;
  isQuantityTakeOffItem: boolean;
  quantityTakeOffTotal: number;

  // with profit margin
  materialUnitCostWithProfit: number;
  materialTotalCostWithProfit: number;
  laborUnitCostWithProfit: number;
  laborTotalCostWithProfit: number;
}
