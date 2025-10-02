import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { CommonModule } from '@common/common.module';
import { AuthMiddleware } from '../../../../middleware/auth.middleware';

@Module({
  controllers: [SupplierController],
  imports: [CommonModule],
  providers: [SupplierService],
})
export class SupplierModule implements NestModule {
  async configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).exclude('auth/(.*)').forRoutes('*');
  }
}
