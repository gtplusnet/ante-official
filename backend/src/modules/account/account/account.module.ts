import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { DeveloperAccountController } from '../developer-account/developer-account.controller';
import { DeveloperAccountService } from '../developer-account/developer-account.service';
import { ExcelExportModule } from '@infrastructure/excel/excel-export.module';
import { CommonModule } from '@common/common.module';
import { RoleService } from '@modules/role/role/role.service';
import { RoleGroupService } from '@modules/role/role-group/role-group.service';
import { CompanyService } from '@modules/company/company/company.service';
import { AuthModule } from '@modules/auth/auth/auth.module';

@Module({
  imports: [ExcelExportModule, CommonModule, AuthModule],
  providers: [
    AccountService,
    DeveloperAccountService,
    RoleService,
    RoleGroupService,
    CompanyService,
  ],
  controllers: [AccountController, DeveloperAccountController],
  exports: [AccountService],
})
export class AccountModule {}
