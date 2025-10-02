import { Supplier } from './supplier.interface';

export interface SupplierPaymentDetails {
  id: number;
  supplierId: number;
  term: string;
  percentage: number;
  days: number;
  lateFees: number;
  notes?: string;
  additionalDetails?: string;
  supplier?: Supplier;
}
