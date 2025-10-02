import { IsNotEmpty } from 'class-validator';
export class TableQueryDTO {
  @IsNotEmpty()
  readonly page: number;

  @IsNotEmpty()
  readonly perPage: number;
  readonly search?: string;
  readonly isLead?: boolean;
  readonly format?: string;
  readonly status?: string;

  readonly employeeAccountId?: string;
  readonly cutoffDateRangeId?: string;
}

export class TableBodyDTO {
  readonly filters: Array<Record<string, any>>;
  readonly settings: Record<string, any>;
  readonly searchKeyword?: string;
  readonly searchBy?: string;
}
