import { IsNotEmpty } from 'class-validator';

export class ScopeTreeDTO {
  @IsNotEmpty()
  readonly roleID: string;
}

export class ScopeListDTO {
  @IsNotEmpty()
  readonly roleGroupId: string;
}
