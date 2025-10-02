export interface CreateBoqRowPayload {
  billOfQuantityId: string;
  parentId?: string;
  type:
    | 'HEADING'
    | 'SUBHEADING'
    | 'ITEM'
    | 'ITEM1'
    | 'ITEM2'
    | 'ITEM3'
    | 'BLANK_ROW';
  particulars: string;
  particularType?: 'INVENTORY' | 'MANPOWER' | 'EQUIPMENT';
  quantity?: number;
  unit?: string;
  materialUnitCost?: number;
  laborUnitCost?: number;
  itemId?: string;
}

export interface BoqNumericFields {
  quantity: number;
  materialUnitCost: number;
  laborUnitCost: number;
  order: number;
}

export interface BoqStringFields {
  particulars: string;
  unit: string;
  itemNumber: string;
}

export type BoqUpdatableFields = BoqNumericFields & BoqStringFields;

export interface BillOfQuantity {
  id: number;
  subject: string;
  contractId: string;
  contractLocation: string;
  expirationDate: Date;
  totalMaterialCost: number;
  totalLaborCost: number;
  totalDirectCost: number;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  isDraft: boolean;
  projectId: number;
  createdById: string | null;
  updatedById: string | null;
  revision: number;
}
