export enum BoqInsertReferenceMethod {
  INSIDE = 'inside',
  AFTER = 'after',
  BEFORE = 'before',
  FIRST = 'first',
  LAST = 'last',
}

export interface BoqInsertValue {
  itemId: string;
  description: string;
  materialUnitCost: number;
  materialUnit: string;
  quantity: number;
  manPowerCost: number;
  laborUnitCost: number;
  laborPercentageCost?: number;
  profitMarginPercentage?: number;
  isQuantityTakeOffItem?: boolean;
}

export interface BoqInsertData {
  insertReferenceMethod: BoqInsertReferenceMethod;
  insertReferenceId: number;
  insertValue: BoqInsertValue;
}

export interface BoqUpdateData {
  updateId: number;
  updateValue: BoqInsertValue;
}

export interface BoqMoveData {
  moveReferenceMethod: BoqInsertReferenceMethod;
  moveFromReferenceId: number;
  moveToReferenceId: number;
}
