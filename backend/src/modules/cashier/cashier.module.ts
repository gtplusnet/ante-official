import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { AccountModule } from '@modules/account/account/account.module';
import { CashierController } from './cashier.controller';
import { CashierService } from './cashier.service';

@Module({
  imports: [CommonModule, AccountModule],
  controllers: [CashierController],
  providers: [CashierService],
  exports: [CashierService],
})
export class CashierModule {}
