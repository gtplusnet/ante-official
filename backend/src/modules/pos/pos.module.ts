import { Module } from '@nestjs/common';
import { PosController } from './pos.controller';
import { PosPublicController } from './pos-public.controller';
import { PosService } from './pos.service';
import { PrismaService } from '@common/prisma.service';
import { CartModule } from '@modules/cart/cart.module';
import { CommonModule } from '@common/common.module';
import { POSDeviceModule } from '@modules/pos-device/pos-device.module';
import { AuthModule } from '@modules/auth/auth/auth.module';
import { RedisModule } from '@infrastructure/redis/redis.module';
import { PosDeviceAuthGuard } from './guards/pos-device-auth.guard';

@Module({
  imports: [CartModule, CommonModule, POSDeviceModule, AuthModule, RedisModule],
  controllers: [PosController, PosPublicController],
  providers: [PosService, PrismaService, PosDeviceAuthGuard],
  exports: [PosService],
})
export class PosModule {}
