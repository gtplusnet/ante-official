import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CartController } from './cart.controller';
import { CartPublicController } from './cart-public.controller';
import { CartService } from './cart.service';
import { PrismaService } from '@common/prisma.service';
import { CommonModule } from '@common/common.module';
import { POSDeviceModule } from '@modules/pos-device/pos-device.module';
import { PosDeviceAuthGuard } from '@modules/pos/guards/pos-device-auth.guard';

@Module({
  imports: [ConfigModule, CommonModule, POSDeviceModule],
  controllers: [CartController, CartPublicController],
  providers: [CartService, PrismaService, PosDeviceAuthGuard],
  exports: [CartService],
})
export class CartModule {}
