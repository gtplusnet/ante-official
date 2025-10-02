export enum pagibigComputationType {
  DEFAULT = 'default',
}

export class PagibigConfiguration {
  key: string;
  dateStart: string;
  computationType: pagibigComputationType;
  label: string;
}

export class GetPagibigBracketDTO {
  salary: number;
  date: string;
}
