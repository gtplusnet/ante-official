import {
  PipeTransform,
  Injectable,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { RoleService } from '@modules/role/role/role.service';
import { AccountCreateDTO } from '@modules/account/account/account.validator';

@Injectable()
export class EnsureOneUserPerRoleHeadPipe implements PipeTransform {
  constructor(@Inject(RoleService) private roleService: RoleService) {}

  async transform(value: AccountCreateDTO) {
    const { roleID } = value;
    const hasExistingUser =
      await this.roleService.hasOneUserPerRoleHead(roleID);
    if (hasExistingUser) {
      throw new BadRequestException(
        'User already exist on this role. Role Head must only have one user',
      );
    }

    return value;
  }
}
