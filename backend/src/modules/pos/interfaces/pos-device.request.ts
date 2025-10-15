import { Request } from 'express';
import { POSDevice, CashierData, Account, Company, Project } from '@prisma/client';

export interface PosDeviceRequest extends Request {
  device: POSDevice & {
    company: Company;
    branch: Project | null;
  };
  cashier: CashierData & {
    account: Account;
  };
  branchId: number | null;
  companyId: number;
}
