import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Exists } from '@common/validators/exists.validator';
import { BranchCreateRequest } from '../../../../shared/request/branch.request';

export class BranchCreateDTO implements BranchCreateRequest {
  @IsOptional()
  @IsNumber()
  @Exists('project', 'id', { message: 'Project ID does not exist.' })
  id?: number;

  @IsNotEmpty()
  @IsString()
  branchCode: string;

  @IsNotEmpty()
  @IsString()
  branchName: string;

  @IsNotEmpty()
  @IsString()
  @Exists('location', 'id', { message: 'Location ID does not exist.' })
  branchLocationId: string;

  @IsOptional()
  @IsNumber()
  @Exists('project', 'id', { message: 'Parent branch does not exist.' })
  parentId?: number;

  @IsOptional()
  @IsString()
  @Exists('warehouse', 'id', { message: 'Warehouse ID does not exist.' })
  mainWarehouseId?: string;
}
