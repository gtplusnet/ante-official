import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActionCenterController } from './action-center.controller';
import { ActionCenterService } from './action-center.service';
import { AccountActionMongoService } from './mongodb/account-action-mongo.service';
import {
  AccountAction,
  AccountActionSchema,
} from './mongodb/account-action-mongo.schema';
import { AccountModule } from '@modules/account/account/account.module';
import { CommonModule } from '@common/common.module';
import { HrisAccountCheckTask } from '@modules/scheduler/tasks/hris-account-check.task';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: AccountAction.name, schema: AccountActionSchema }],
      'mongo',
    ),
    AccountModule,
    CommonModule,
  ],
  controllers: [ActionCenterController],
  providers: [
    ActionCenterService,
    AccountActionMongoService,
    HrisAccountCheckTask,
  ],
  exports: [AccountActionMongoService, HrisAccountCheckTask],
})
export class ActionCenterModule {}
