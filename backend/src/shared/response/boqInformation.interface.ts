import { BillOfQuantityStatus } from '@prisma/client';

export interface BoqInformationInterface {
  id: number;
  contractId: string;
  revision: number;
  subject: string;
  totalMaterialCost: number;
  contractLocation: string;
  totalLaborCost: number;
  totalDirectCost: number;
  totalCost: number;
  expirationDate: any;
  isDeleted: boolean;
  isDraft: boolean;
  createdAt: any;
  updatedAt: any;
  lastKeyUsed: number;
  status: BillOfQuantityStatus;
}
