import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { DeveloperRoleController } from './developer-role.controller';
import { DeveloperRoleService } from './developer-role.service';
import { RoleGroupService } from '@modules/role/role-group/role-group.service';

@Module({
  imports: [CommonModule],
  controllers: [RoleController, DeveloperRoleController],
  providers: [RoleService, DeveloperRoleService, RoleGroupService],
  exports: [RoleService, DeveloperRoleService],
})
export class RoleModule {}
