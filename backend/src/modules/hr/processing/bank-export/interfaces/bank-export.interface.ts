export interface IBankEmployee {
  bankAccountNumber: string;
  employeeName: string;
  employeeCode: string;
  branchName: string;
  netPay: number;
}

export interface INoBankEmployee {
  employeeName: string;
  employeeCode: string;
  branchName: string;
  netPay: number;
}

export interface IBankExportData {
  bankKey: string;
  bankLabel: string;
  employeeCount: number;
  totalAmount: number;
  employees: IBankEmployee[];
}

export interface IBankExportResponse {
  noBankEmployees: {
    employeeCount: number;
    totalAmount: number;
    employees: INoBankEmployee[];
  };
  banks: IBankExportData[];
}

export interface IExportResult {
  content: string;
  filename: string;
  contentType: string;
}
