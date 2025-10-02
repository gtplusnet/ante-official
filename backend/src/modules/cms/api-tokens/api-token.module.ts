import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiTokenController } from './api-token.controller';
import { ApiTokenService } from './api-token.service';
import { ApiToken, ApiTokenSchema } from '../schemas/api-token.schema';
import { CommonModule } from '@common/common.module';
import { CacheConfigModule } from '@infrastructure/cache/cache.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: ApiToken.name, schema: ApiTokenSchema }],
      'mongo',
    ),
    CommonModule,
    CacheConfigModule,
    forwardRef(() => ActivityLogModule),
  ],
  controllers: [ApiTokenController],
  providers: [ApiTokenService],
  exports: [ApiTokenService],
})
export class ApiTokenModule {}
