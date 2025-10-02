import { SupplierPaymentDetails } from './payment-details.interface';

export interface Supplier {
  id: number;
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  description?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  SupplierPaymentDetails?: SupplierPaymentDetails[];
}
