import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { CommonModule } from '@common/common.module';
import { HrisModule } from '../../../hris/hris.module';

@Module({
  imports: [
    CommonModule,
    HrisModule, // For EmployeeListService
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
