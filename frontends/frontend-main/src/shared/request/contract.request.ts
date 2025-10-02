import { EmploymentStatus } from '@/types/prisma-enums';
export { EmploymentStatus };

export interface ContractCreateRequest {
  accountId: string;
  contractData: ContractDataCreateRequest;
}

export interface ContractDataCreateRequest {
  monthlyRate: number;
  employmentStatus: EmploymentStatus;
  startDate: string;
  endDate?: string | null;
  contractFileId?: number;
}

export interface ContractEditRequest {
  contractId: number;
  contractData: {
    monthlyRate: number;
    employmentStatus: EmploymentStatus;
    startDate: string;
    endDate?: string | null;
    contractFileId?: number;
  };
}
