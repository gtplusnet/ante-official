export enum PhilhealthComputationType {
  DEFAULT = 'default',
}

export interface PhilhealthConfigurationReponse {
  dateStart: string;
  dateStartRaw?: Date;
  computationType: PhilhealthComputationType;
  label: string;
  minimumContribution: number;
  maximumContribution: number;
  percentage: number;
}
