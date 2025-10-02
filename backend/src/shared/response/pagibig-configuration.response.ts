export enum PagibigComputationType {
  DEFAULT = 'default',
}

export interface PagibigConfigurationReponse {
  dateStart: string;
  dateStartRaw?: Date;
  computationType: PagibigComputationType;
  label: string;
  employeeMinimumShare: number;
  employeeMinimumPercentage: number;
  percentage: number;
  maximumEmployerShare: number;
  maximumEmployeeShare: number;
  employerShare: number;
  employeeShare: number;
}
